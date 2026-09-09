//go:build windows

package app

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/adrg/xdg"
	"github.com/go-musicfox/netease-music/service"
	neteaseutil "github.com/go-musicfox/netease-music/util"
	cookiejar "github.com/juju/persistent-cookiejar"

	"github.com/go-musicfox/go-musicfox/internal/configs"
	"github.com/go-musicfox/go-musicfox/internal/player"
	"github.com/go-musicfox/go-musicfox/internal/structs"
	"github.com/go-musicfox/go-musicfox/internal/types"
	mfoxapp "github.com/go-musicfox/go-musicfox/utils/app"
	"github.com/go-musicfox/go-musicfox/utils/filex"
	"github.com/go-musicfox/go-musicfox/utils/netease"
	"github.com/go-musicfox/go-musicfox/utils/slogx"
	utilsstruct "github.com/go-musicfox/go-musicfox/utils/struct"
)

const defaultConfigToml = "embed/" + types.AppTomlFile

// SongDTO 对外暴露的歌曲信息（歌单/专辑收藏也复用该结构）
type SongDTO struct {
	ID       int64   `json:"id"`
	Type     string  `json:"type,omitempty"` // song / playlist / album，空视为 song（仅 song 可播放）
	Name     string  `json:"name"`
	Artists  string  `json:"artists"`
	Album    string  `json:"album"`
	PicURL   string  `json:"picUrl"`
	Duration float64 `json:"duration"` // 秒
}

// PlayerStatus 播放器状态快照
type PlayerStatus struct {
	State         string   `json:"state"` // playing / paused / stopped / interrupted / unknown
	Position      float64  `json:"position"`
	Volume        int      `json:"volume"`
	Song          *SongDTO `json:"song"`
	MusicType     string   `json:"musicType"`
	SeekSupported bool     `json:"seekSupported"`
}

// Settings 本地设置（存 musicfox_gui_data/setting.json）
type Settings struct {
	Theme  string `json:"theme"` // dark / light
	Volume int    `json:"volume"`
	// BufferMB 歌曲缓冲区大小上限（MB，256~2048），作用于 exe 旁的 musicfox_gui_buffer 目录
	BufferMB int    `json:"bufferMB"`
	Quality  string `json:"quality"` // 音质：standard/higher/exhigh/lossless/hires/jyeffect/sky/jymaster，空=跟随内核配置
	// VolumeNorm 音量归一化：开启后实际输出音量被限制在安全区间，防止音量过高或过低
	VolumeNorm bool `json:"volumeNorm"`
}

// LocalState 前端读写视图：设置 + 收藏
// 设置存 setting.json，收藏存 favorites.csv（均在 exe 旁的 musicfox_gui_data 目录）
type LocalState struct {
	Theme      string    `json:"theme"` // dark / light
	Volume     int       `json:"volume"`
	BufferMB   int       `json:"bufferMB"`
	Quality    string    `json:"quality"`
	VolumeNorm bool      `json:"volumeNorm"`
	Favorites  []SongDTO `json:"favorites"`
	// DataDir/BufferDir 仅用于界面提示（实际数据目录，非持久化字段）
	DataDir   string `json:"dataDir,omitempty"`
	BufferDir string `json:"bufferDir,omitempty"`
}

// SessionState 最近一次播放会话（歌单/播放列表续播），存 session.json（exe 同目录）
type SessionState struct {
	Queue      []SongDTO `json:"queue"` // 最近一次播放的列表/歌单队列
	CurrentID  int64     `json:"currentId"`
	Position   float64   `json:"position"`
	Random     bool      `json:"random"`
	SingleLoop bool      `json:"singleLoop"`
}

// App 是暴露给前端的所有绑定方法的载体
type App struct {
	ctx    context.Context
	player player.Player

	mu        sync.Mutex
	songs     map[int64]structs.Song // 最近一次搜索/歌单/专辑的歌曲（供播放反查）
	favorites map[int64]structs.Song // 本地收藏（跨会话可播放）
	session   map[int64]structs.Song // 最近一次会话队列（跨会话可播放）

	playMu     sync.Mutex   // 串行下发播放请求：等内核完成切换后再放行下一个，避免请求被丢弃
	playSeq    atomic.Int64 // 播放请求序号：连续点击时仅最后一次真正生效
	lastStatus PlayerStatus // 最近一次成功采集的状态快照（内核卡顿时兜底返回）

	smtc *smtcSession // Windows 系统媒体控制栏（SMTC）会话，nil 表示初始化失败/非 Windows

	qualityMu  sync.RWMutex
	quality    string // 设置的音质（空=跟随内核配置），有效播放时使用
	bufferMB   int    // 歌曲缓冲区大小上限（MB）
	volumeNorm bool   // 音量归一化：输出音量限制在安全区间（qualityMu 保护）

	curVolume atomic.Int32 // UI 音量读数 0~100（引擎收到的是归一化换算后的值）

	bufferStop chan struct{} // 缓冲目录清理协程的停止信号
}

// 音量归一化输出区间：开启后把 UI 音量 0~100 映射进该区间（0 仍为真静音），
// 防止音量过高损伤听力或过低难以听见。beep 引擎音量是指数增益刻度
// （100=0dB、75≈-6dB、20≈-24dB），取 [20, 75] 兼顾保护与可用性
const (
	normVolumeFloor = 20
	normVolumeCeil  = 75
)

// 常量目录名：全部运行时文件都收敛在 exe 旁边的这两个目录里
const (
	guiDataFolderName   = "musicfox_gui_data"
	guiBufferFolderName = "musicfox_gui_buffer"
)

// NewApp 创建后端应用实例并初始化配置/登录态
func NewApp() *App {
	// 初始化日志（幂等）
	slogx.Init()

	ensureLocalDirs()
	// 旧版文件迁移：exe 旁散落的 setting/favorites/session → musicfox_gui_data；
	// %AppData%/%LocalAppData% 下 go-musicfox 的 config/cookie → musicfox_gui_data
	migrateGuiSideFiles()
	migrateCoreFiles()

	// 加载配置
	loadConfig()
	// 把内核缓存目录（beep 歌曲缓冲等）重定向到 exe 旁 musicfox_gui_buffer
	applyBufferDir()

	// 配置 UNM 等网易云参数
	applyNeteaseConfig()

	a := &App{
		songs:      make(map[int64]structs.Song),
		favorites:  make(map[int64]structs.Song),
		session:    make(map[int64]structs.Song),
		bufferMB:   512,
		bufferStop: make(chan struct{}),
	}
	initStateFiles()
	a.initCookieJar()
	a.loadFavorites()
	a.loadSession()
	a.loadAppliedSettings()
	return a
}

// guiDataDir 数据根目录：exe 旁的 musicfox_gui_data
func guiDataDir() string { return filepath.Join(exeDir(), guiDataFolderName) }

// bufferDir 缓冲目录：exe 旁的 musicfox_gui_buffer（歌曲临时缓存）
func bufferDir() string { return filepath.Join(exeDir(), guiBufferFolderName) }

func ensureDir(p string) { _ = os.MkdirAll(p, 0o755) }

// ensureLocalDirs 确保两个运行目录存在
func ensureLocalDirs() {
	ensureDir(guiDataDir())
	ensureDir(bufferDir())
}

func sessionFilePath() string {
	ensureDir(guiDataDir())
	return filepath.Join(guiDataDir(), "session.json")
}

// loadSession 启动时载入最近一次会话队列（用于播放反查与界面续播展示）
func (a *App) loadSession() {
	st, err := a.loadSessionFile()
	if err != nil {
		return
	}
	a.mu.Lock()
	defer a.mu.Unlock()
	a.session = make(map[int64]structs.Song, len(st.Queue))
	for _, d := range st.Queue {
		a.session[d.ID] = dtoToStructSong(d)
	}
}

func (a *App) loadSessionFile() (SessionState, error) {
	var st SessionState
	data, err := os.ReadFile(sessionFilePath())
	if err != nil {
		return st, err
	}
	if json.Unmarshal(data, &st) != nil {
		return SessionState{}, nil
	}
	if len(st.Queue) > 4096 {
		st.Queue = st.Queue[:4096]
	}
	return st, nil
}

// LoadSession 读取最近一次播放会话（前端启动时展示/续播）
func (a *App) LoadSession() (SessionState, error) {
	return a.loadSessionFile()
}

// SaveSession 持久化最近一次播放会话，并同步到内存供播放反查
func (a *App) SaveSession(st SessionState) error {
	if len(st.Queue) > 4096 {
		st.Queue = st.Queue[:4096]
	}
	data, err := json.MarshalIndent(st, "", "  ")
	if err != nil {
		return err
	}
	if wErr := os.WriteFile(sessionFilePath(), data, 0o600); wErr != nil {
		return wErr
	}
	a.mu.Lock()
	a.session = make(map[int64]structs.Song, len(st.Queue))
	for _, d := range st.Queue {
		if d.ID > 0 {
			a.session[d.ID] = dtoToStructSong(d)
		}
	}
	a.mu.Unlock()
	return nil
}

// ---------------------------------------------------------------------------
// 本地持久化：setting.json（设置） + favorites.csv（收藏），均放在 exe 同目录，
// 启动时缺失则自动创建；旧版数据目录 gui_state.json 会在首次启动时迁移
// ---------------------------------------------------------------------------

func exeDir() string {
	exe, err := os.Executable()
	if err != nil {
		dir, _ := os.Getwd()
		return dir
	}
	return filepath.Dir(exe)
}

func settingsFilePath() string {
	ensureDir(guiDataDir())
	return filepath.Join(guiDataDir(), "setting.json")
}

func favoritesFilePath() string {
	ensureDir(guiDataDir())
	return filepath.Join(guiDataDir(), "favorites.csv")
}

func defaultSettings() Settings {
	return Settings{Theme: "dark", Volume: 60, BufferMB: 512}
}

// migrateGuiSideFiles 把旧版写在 exe 同目录的 GUI 状态文件移入 musicfox_gui_data
func migrateGuiSideFiles() {
	for _, name := range []string{"setting.json", "favorites.csv", "session.json"} {
		old := filepath.Join(exeDir(), name)
		if _, err := os.Stat(old); os.IsNotExist(err) {
			continue
		}
		neu := filepath.Join(guiDataDir(), name)
		if _, err := os.Stat(neu); err == nil {
			_ = os.Remove(old) // 新位置已有更新的文件，仅清理旧副本
			continue
		}
		if err := os.Rename(old, neu); err != nil {
			slog.Warn("迁移旧状态文件失败", "name", name, "err", err)
		} else {
			slog.Info("已迁移旧状态文件", "name", name)
		}
	}
}

// migrateCoreFiles 把旧版内核（XDG 路径）的 config/cookie 迁入 MUSICFOX_ROOT（musicfox_gui_data）
func migrateCoreFiles() {
	oldRoot := filepath.Join(xdg.ConfigHome, types.AppLocalDataDir)
	oldDataRoot := filepath.Join(xdg.DataHome, types.AppLocalDataDir)

	copyIfMissing := func(src, dst string) {
		if _, err := os.Stat(dst); err == nil {
			return
		}
		data, err := os.ReadFile(src)
		if err != nil {
			return
		}
		ensureDir(filepath.Dir(dst))
		if err := os.WriteFile(dst, data, 0o600); err != nil {
			slog.Warn("迁移内核文件失败", "src", src, "err", err)
			return
		}
		slog.Info("已迁移内核文件", "src", src)
	}
	copyIfMissing(filepath.Join(oldRoot, types.AppTomlFile), mfoxapp.ConfigFilePath())
	copyIfMissing(filepath.Join(oldDataRoot, "cookie"), filepath.Join(mfoxapp.DataDir(), "cookie"))
}

// applyBufferDir 把内核的缓存目录（RuntimeDir/CacheDir）重定向到 exe 旁 musicfox_gui_buffer：
// 便携模式下缓存目录 = filepath.Join(MUSICFOX_ROOT, storage.cache.dir)，
// 因此填相对路径 ..\musicfox_gui_buffer 即可落到 exe 目录旁的缓冲文件夹。
func applyBufferDir() {
	if configs.AppConfig == nil {
		return
	}
	configs.AppConfig.Storage.Cache.Dir = filepath.Join("..", guiBufferFolderName)
}

// initStateFiles 启动时确保设置/收藏文件存在
func initStateFiles() {
	migrateLegacyState()

	if _, err := os.Stat(settingsFilePath()); os.IsNotExist(err) {
		if err := defaultSettings().save(); err != nil {
			slog.Warn("创建 setting.json 失败", "path", settingsFilePath(), "err", err)
		} else {
			slog.Info("已创建默认设置文件", "path", settingsFilePath())
		}
	}
	if _, err := os.Stat(favoritesFilePath()); os.IsNotExist(err) {
		if err := writeFavoritesCSV(nil); err != nil {
			slog.Warn("创建 favorites.csv 失败", "path", favoritesFilePath(), "err", err)
		} else {
			slog.Info("已创建收藏文件", "path", favoritesFilePath())
		}
	}
}

// migrateLegacyState 旧版把设置/收藏存在数据目录 gui_state.json，首次升级时迁移
func migrateLegacyState() {
	// 兼容：旧 XDG 数据目录 与 便携根内残留
	legacyPath := ""
	for _, p := range []string{
		filepath.Join(xdg.DataHome, types.AppLocalDataDir, "gui_state.json"),
		filepath.Join(mfoxapp.DataDir(), "gui_state.json"),
	} {
		if _, err := os.Stat(p); err == nil {
			legacyPath = p
			break
		}
	}
	if legacyPath == "" {
		return
	}
	// 仅当新文件尚未生成时迁移，避免覆盖已有数据
	_, setErr := os.Stat(settingsFilePath())
	_, favErr := os.Stat(favoritesFilePath())
	if setErr == nil && favErr == nil {
		return
	}
	data, err := os.ReadFile(legacyPath)
	if err != nil {
		return
	}
	var old LocalState
	if json.Unmarshal(data, &old) != nil {
		return
	}
	if setErr != nil {
		_ = Settings{Theme: old.Theme, Volume: old.Volume, BufferMB: old.BufferMB, Quality: old.Quality, VolumeNorm: old.VolumeNorm}.save()
	}
	if favErr != nil && len(old.Favorites) > 0 {
		_ = writeFavoritesCSV(old.Favorites)
	}
}

// loadSettings 读取设置，缺失字段保留默认值
func loadSettings() Settings {
	st := defaultSettings()
	data, err := os.ReadFile(settingsFilePath())
	if err != nil {
		return st
	}
	_ = json.Unmarshal(data, &st)
	if st.Volume < 0 {
		st.Volume = 0
	}
	if st.Volume > 100 {
		st.Volume = 100
	}
	if st.BufferMB < 256 || st.BufferMB > 2048 {
		st.BufferMB = 512
	}
	q := service.SongQualityLevel(strings.ToLower(strings.TrimSpace(st.Quality)))
	if !q.IsValid() {
		st.Quality = ""
	} else {
		st.Quality = string(q)
	}
	return st
}

func (s Settings) save() error {
	data, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(settingsFilePath(), data, 0o600)
}

var favoritesCSVHeader = []string{"type", "id", "name", "artists", "album", "picUrl", "duration"}

// writeFavoritesCSV 覆盖写入收藏 CSV（带 UTF-8 BOM，便于 Excel 直接打开）
func writeFavoritesCSV(favs []SongDTO) error {
	f, err := os.Create(favoritesFilePath())
	if err != nil {
		return err
	}
	defer f.Close()
	if _, err := f.Write([]byte{0xEF, 0xBB, 0xBF}); err != nil {
		return err
	}
	w := csv.NewWriter(f)
	if err := w.Write(favoritesCSVHeader); err != nil {
		return err
	}
	for _, d := range favs {
		t := d.Type
		if t == "" {
			t = "song"
		}
		if err := w.Write([]string{
			t,
			strconv.FormatInt(d.ID, 10),
			d.Name,
			d.Artists,
			d.Album,
			d.PicURL,
			strconv.Itoa(int(math.Round(d.Duration))),
		}); err != nil {
			return err
		}
	}
	w.Flush()
	return w.Error()
}

// readFavoritesCSV 读取收藏 CSV（兼容无 BOM/缺列的手工编辑文件）
func readFavoritesCSV() ([]SongDTO, error) {
	f, err := os.Open(favoritesFilePath())
	if err != nil {
		return nil, err
	}
	defer f.Close()
	r := csv.NewReader(f)
	r.FieldsPerRecord = -1
	rows, err := r.ReadAll()
	if err != nil {
		return nil, err
	}
	out := make([]SongDTO, 0, len(rows))
	for i, row := range rows {
		// 跳过表头（含 BOM 情况）
		if i == 0 && len(row) > 0 && strings.EqualFold(strings.TrimPrefix(row[0], "\uFEFF"), "type") {
			continue
		}
		if len(row) < 3 {
			continue
		}
		id, err := strconv.ParseInt(strings.TrimSpace(row[1]), 10, 64)
		if err != nil || id <= 0 {
			continue
		}
		get := func(idx int) string {
			if idx < len(row) {
				return row[idx]
			}
			return ""
		}
		d := SongDTO{
			Type:    strings.TrimSpace(strings.TrimPrefix(get(0), "\uFEFF")),
			ID:      id,
			Name:    get(2),
			Artists: get(3),
			Album:   get(4),
			PicURL:  get(5),
		}
		if d.Type == "" {
			d.Type = "song"
		}
		if sec, err := strconv.ParseFloat(strings.TrimSpace(get(6)), 64); err == nil {
			d.Duration = sec
		}
		out = append(out, d)
	}
	return out, nil
}

// loadFavorites 启动时载入本地收藏（歌曲用于播放反查）
func (a *App) loadFavorites() {
	favs, err := readFavoritesCSV()
	if err != nil {
		return
	}
	a.mu.Lock()
	defer a.mu.Unlock()
	for _, d := range favs {
		if d.Type == "song" {
			a.favorites[d.ID] = dtoToStructSong(d)
		}
	}
}

// LoadState 读取本地设置与收藏（前端启动/刷新时调用）
func (a *App) LoadState() (LocalState, error) {
	st := loadSettings()
	a.setQualityBuffer(st.Quality, st.BufferMB)
	favs, err := readFavoritesCSV()
	if err != nil && !os.IsNotExist(err) {
		slog.Warn("读取收藏失败", "path", favoritesFilePath(), "err", err)
	}
	// 同步到内存，便于播放反查
	a.mu.Lock()
	a.favorites = make(map[int64]structs.Song, len(favs))
	for _, d := range favs {
		if d.Type == "song" {
			a.favorites[d.ID] = dtoToStructSong(d)
		}
	}
	a.mu.Unlock()

	// 界面默认高亮当前生效音质（未单独设置时跟随内核配置）
	qualityUI := st.Quality
	if qualityUI == "" && configs.AppConfig != nil && configs.AppConfig.Player.SongLevel.IsValid() {
		qualityUI = string(configs.AppConfig.Player.SongLevel)
	}
	if qualityUI == "" {
		qualityUI = string(service.Higher)
	}
	return LocalState{
		Theme:      st.Theme,
		Volume:     st.Volume,
		BufferMB:   st.BufferMB,
		Quality:    qualityUI,
		VolumeNorm: st.VolumeNorm,
		Favorites:  favs,
		DataDir:    guiDataDir(),
		BufferDir:  bufferDir(),
	}, nil
}

// SaveState 持久化设置（setting.json）与收藏（favorites.csv）
func (a *App) SaveState(st LocalState) error {
	savedQ := strings.ToLower(strings.TrimSpace(st.Quality))
	if !service.SongQualityLevel(savedQ).IsValid() {
		savedQ = ""
	}
	savedMB := st.BufferMB
	if savedMB < 256 || savedMB > 2048 {
		savedMB = 512
	}
	a.qualityMu.Lock()
	if savedQ == "" && a.quality != "" {
		savedQ = a.quality // 兼容旧前端未携带该字段：保留已有选择
	}
	a.qualityMu.Unlock()
	a.setQualityBuffer(savedQ, savedMB)
	a.setVolumeNorm(st.VolumeNorm)

	if err := (Settings{Theme: st.Theme, Volume: st.Volume, BufferMB: savedMB, Quality: savedQ, VolumeNorm: st.VolumeNorm}).save(); err != nil {
		return err
	}
	if err := writeFavoritesCSV(st.Favorites); err != nil {
		return err
	}
	// 同步到内存，便于播放反查
	a.mu.Lock()
	a.favorites = make(map[int64]structs.Song, len(st.Favorites))
	for _, d := range st.Favorites {
		if d.Type == "" || d.Type == "song" {
			a.favorites[d.ID] = dtoToStructSong(d)
		}
	}
	a.mu.Unlock()
	return nil
}

// setQualityBuffer 内存中应用 音质/缓冲区大小 设置
func (a *App) setQualityBuffer(q string, mb int) {
	a.qualityMu.Lock()
	if service.SongQualityLevel(q).IsValid() {
		a.quality = q
	} else {
		a.quality = ""
	}
	a.qualityMu.Unlock()
	if mb < 256 || mb > 2048 {
		mb = 512
	}
	a.bufferMB = mb
}

// loadAppliedSettings 启动后把 setting.json 里的音质/缓冲区/音量归一化应用到内存
func (a *App) loadAppliedSettings() {
	st := loadSettings()
	a.setQualityBuffer(st.Quality, st.BufferMB)
	a.qualityMu.Lock()
	a.volumeNorm = st.VolumeNorm
	a.qualityMu.Unlock()
}

// dtoToStructSong 由持久化 DTO 还原可播放歌曲
func dtoToStructSong(d SongDTO) structs.Song {
	s := structs.Song{
		Id:       d.ID,
		Name:     d.Name,
		Duration: time.Duration(d.Duration * float64(time.Second)),
	}
	if d.Artists != "" {
		s.Artists = []structs.Artist{{Name: d.Artists}}
	}
	if d.Album != "" {
		s.Album = structs.Album{Name: d.Album, PicUrl: d.PicURL}
	}
	return s
}

// startup Wails 启动回调：初始化音频播放引擎与系统媒体控制会话
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	// beep 引擎读取全局 configs.AppConfig（缓存目录已重定向到 musicfox_gui_buffer）
	a.player = player.NewBeepPlayer()
	// 应用持久化的音量（引擎默认满音量，界面读数需要在这里真正生效；
	// 持久化 0 表示静音退出，必须同样下发）
	if a.player != nil {
		a.curVolume.Store(int32(a.player.Volume()))
		v := loadSettings().Volume
		a.SetVolume(v)
		slog.Info("applied saved volume on startup", "volume", v)
	}
	slog.Info("beep player started")

	// 缓冲目录大小上限清理
	a.startBufferJanitor()

	// Windows 系统媒体控制栏（音量/任务栏媒体悬浮条）集成
	a.smtc = newSMTCSession(a)
	if a.smtc != nil {
		a.smtc.start()
		slog.Info("system media transport session started")
	} else {
		slog.Warn("system media transport session unavailable")
	}
}

// shutdown Wails 退出回调：保存 cookie 并释放播放器
func (a *App) shutdown(_ context.Context) {
	a.stopBufferJanitor()
	if a.smtc != nil {
		a.smtc.close()
		a.smtc = nil
	}
	if a.player != nil {
		a.player.Close()
	}
	// 持久化登录态
	if jar, ok := neteaseutil.GetGlobalCookieJar().(*cookiejar.Jar); ok {
		_ = jar.Save()
	}
}

// startBufferJanitor 周期性清理缓冲目录，使总大小不超过设置的上限
func (a *App) startBufferJanitor() {
	if a == nil || a.bufferStop != nil {
		return
	}
	a.bufferStop = make(chan struct{})
	go func() {
		ticker := time.NewTicker(8 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-a.bufferStop:
				return
			case <-ticker.C:
				a.cleanBufferIfNeeded()
			}
		}
	}()
}

func (a *App) stopBufferJanitor() {
	if a == nil || a.bufferStop == nil {
		return
	}
	close(a.bufferStop)
	a.bufferStop = nil
}

func (a *App) bufferLimitBytes() int64 {
	mb := a.bufferMB
	if mb < 256 || mb > 2048 {
		mb = 512
	}
	return int64(mb) << 20
}

// cleanBufferIfNeeded 缓冲目录超过上限时从最旧开始删除（始终保留最新文件，可能是正在播放的临时缓存）
func (a *App) cleanBufferIfNeeded() {
	if a == nil {
		return
	}
	entries, err := os.ReadDir(bufferDir())
	if err != nil {
		return
	}
	type bufFile struct {
		name string
		size int64
	}
	var files []bufFile
	var total int64
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		info, err := e.Info()
		if err != nil {
			continue
		}
		files = append(files, bufFile{name: e.Name(), size: info.Size()})
		total += info.Size()
	}
	limit := a.bufferLimitBytes()
	if total <= limit || len(files) < 2 {
		return
	}
	// 最旧的先删（目录项按名称排序无意义，按修改时间排一次）
	slices.SortFunc(files, func(x, y bufFile) int {
		xi, _ := os.Stat(filepath.Join(bufferDir(), x.name))
		yi, _ := os.Stat(filepath.Join(bufferDir(), y.name))
		switch {
		case xi == nil || yi == nil:
			return 0
		case xi.ModTime().Before(yi.ModTime()):
			return -1
		case xi.ModTime().After(yi.ModTime()):
			return 1
		default:
			return 0
		}
	})
	for _, fl := range files[:len(files)-1] {
		if total <= limit {
			break
		}
		if err := os.Remove(filepath.Join(bufferDir(), fl.name)); err == nil {
			total -= fl.size
		}
	}
}

// loadConfig 加载 musicfox 配置文件，缺失/损坏时自动重建为默认配置
func loadConfig() {
	configPath := mfoxapp.ConfigFilePath()
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		_ = filex.CopyFileFromEmbed(defaultConfigToml, configPath)
	}

	cfg, err := configs.NewConfigFromTomlFile(configPath)
	if err != nil {
		// 配置文件损坏：备份后重置为默认
		slog.Warn("配置文件解析失败，备份并重置", "path", configPath, "err", err)
		backupPath := fmt.Sprintf("%s.bak.%s", configPath, time.Now().Format("20060102-150405"))
		if renameErr := os.Rename(configPath, backupPath); renameErr != nil && !os.IsNotExist(renameErr) {
			panic(fmt.Sprintf("无法备份损坏的配置文件: %v", renameErr))
		}
		_ = filex.CopyFileFromEmbed(defaultConfigToml, configPath)
		cfg, err = configs.NewConfigFromTomlFile(configPath)
		if err != nil {
			panic(fmt.Sprintf("重置配置文件后仍无法加载: %v", err))
		}
	}
	configs.AppConfig = cfg
}

// applyNeteaseConfig 与 cmd/musicfox.go 一致，把 UNM 配置写入 netease 模块
func applyNeteaseConfig() {
	if configs.AppConfig == nil {
		return
	}
	cfg := configs.AppConfig
	neteaseutil.UNMSwitch = cfg.UNM.Enable
	neteaseutil.Sources = cfg.UNM.Sources
	neteaseutil.SearchLimit = cfg.UNM.SearchLimit
	neteaseutil.EnableLocalVip = cfg.UNM.EnableLocalVip
	neteaseutil.UnlockSoundEffects = cfg.UNM.UnlockSoundEffects
	neteaseutil.UNMProxyURL = cfg.UNM.ProxyURL
}

// initCookieJar 复用 musicfox 的持久化 cookie（若之前在 TUI 中登录过）
func (a *App) initCookieJar() {
	cookiePath := filepath.Join(mfoxapp.DataDir(), "cookie")
	jar, err := cookiejar.New(&cookiejar.Options{Filename: cookiePath})
	if err != nil {
		slog.Warn("Cookie 文件损坏，备份并重置", "err", err)
		backupPath := fmt.Sprintf("%s.bak.%s", cookiePath, time.Now().Format("20060102-150405"))
		_ = os.Rename(cookiePath, backupPath)
		jar, err = cookiejar.New(&cookiejar.Options{Filename: cookiePath})
		if err != nil {
			jar, _ = cookiejar.New(nil)
		}
	}
	neteaseutil.SetGlobalCookieJar(jar)

	// 环境变量或配置里的 cookie 登录
	cookieStr := os.Getenv("MUSICFOX_COOKIE")
	if configs.AppConfig != nil && cookieStr == "" {
		cookieStr = configs.AppConfig.Main.Account.NeteaseCookie
	}
	if cookieStr == "" {
		return
	}

	if err := mfoxapp.ParseCookieFromStr(cookieStr, jar); err != nil {
		slog.Warn("解析 cookie 失败", "err", err)
		return
	}
	neteaseutil.SetGlobalCookieJar(jar)

	// 异步刷新 token，不阻塞界面启动
	go func() {
		newJar, err := mfoxapp.RefreshCookieJar()
		if err != nil {
			slog.Warn("cookie 刷新失败，以游客身份运行", "err", err)
			return
		}
		neteaseutil.SetGlobalCookieJar(newJar)
		if err := newJar.Save(); err != nil {
			slog.Warn("保存 cookie 失败", "err", err)
		}
		slog.Info("cookie 刷新成功")
	}()
}

func (a *App) playable() bool {
	return a.player != nil
}

func (a *App) effectiveQuality() service.SongQualityLevel {
	a.qualityMu.Lock()
	q := a.quality
	a.qualityMu.Unlock()
	if q != "" {
		if lvl := service.SongQualityLevel(q); lvl.IsValid() {
			return lvl
		}
	}
	if configs.AppConfig != nil && configs.AppConfig.Player.SongLevel.IsValid() {
		return configs.AppConfig.Player.SongLevel
	}
	return service.Higher
}

// ---------------------------------------------------------------------------
// 前端绑定方法
// ---------------------------------------------------------------------------

// SearchItem 搜索结果中的一项（单曲 / 歌单 / 歌手统一结构）
type SearchItem struct {
	ID       int64   `json:"id"`
	Name     string  `json:"name"`
	Sub      string  `json:"sub"`    // 单曲=歌手·专辑；歌单=播放量·歌曲数；歌手=别名
	PicURL   string  `json:"picUrl"` // 仅单曲有
	Duration float64 `json:"duration"`
}

// SearchResp 一页搜索结果
type SearchResp struct {
	Items []SearchItem `json:"items"`
	More  bool         `json:"more"`
}

// 搜索分类：song=单曲 playlist=歌单 album=专辑（对应网易云 search type）
var neteaseSearchType = map[string]string{
	"song":     "1",
	"playlist": "1000",
	"album":    "10",
}

// Search 分类搜索，支持 offset 增量加载（每页 30 条，musicfox 同款接口）
func (a *App) Search(keyword string, searchType string, offset int) (SearchResp, error) {
	kw := strings.TrimSpace(keyword)
	if kw == "" {
		return SearchResp{}, errors.New("请输入搜索关键词")
	}
	if searchType == "" {
		searchType = "song"
	}
	netType, ok := neteaseSearchType[searchType]
	if !ok {
		return SearchResp{}, errors.New("不支持的搜索分类")
	}

	searchService := service.SearchService{
		S:      kw,
		Type:   netType,
		Limit:  "30",
		Offset: fmt.Sprintf("%d", offset),
	}
	code, response := searchService.Search()
	if code != 200 {
		return SearchResp{}, fmt.Errorf("搜索失败（网络错误码: %v）", code)
	}

	// 单曲：记录到 songs 供播放反查；歌单/歌手不进入播放池
	switch searchType {
	case "song":
		songs := utilsstruct.GetSongsOfSearchResult(response)
		a.mu.Lock()
		a.songs = make(map[int64]structs.Song, len(songs))
		for _, s := range songs {
			a.songs[s.Id] = s
		}
		a.mu.Unlock()

		items := make([]SearchItem, 0, len(songs))
		for _, s := range songs {
			dto := toSongDTO(s)
			items = append(items, SearchItem{
				ID:       dto.ID,
				Name:     dto.Name,
				Sub:      dto.Artists + " · " + dto.Album,
				PicURL:   dto.PicURL,
				Duration: dto.Duration,
			})
		}
		return SearchResp{Items: items, More: len(items) == 30}, nil

	case "playlist":
		a.clearSongPool()
		items := parseSearchPlaylists(response)
		return SearchResp{Items: items, More: len(items) == 30}, nil

	default: // album
		a.clearSongPool()
		items := parseSearchAlbums(response)
		return SearchResp{Items: items, More: len(items) == 30}, nil
	}
}

// PlaylistSongs 获取歌单内全部歌曲，并写入播放池
func (a *App) PlaylistSongs(playlistID int64) ([]SongDTO, error) {
	if playlistID <= 0 {
		return nil, errors.New("无效的歌单 ID")
	}
	svc := &service.PlaylistDetailService{Id: fmt.Sprintf("%d", playlistID)}
	code, data := svc.PlaylistDetail()
	if code != 200 {
		return nil, fmt.Errorf("获取歌单失败（网络错误码: %v）", code)
	}
	return a.adoptSongs(utilsstruct.GetSongsOfPlaylist(data))
}

// AlbumSongs 获取专辑内全部歌曲，并写入播放池
func (a *App) AlbumSongs(albumID int64) ([]SongDTO, error) {
	if albumID <= 0 {
		return nil, errors.New("无效的专辑 ID")
	}
	svc := &service.AlbumService{ID: fmt.Sprintf("%d", albumID)}
	code, data := svc.Album()
	if code != 200 {
		return nil, fmt.Errorf("获取专辑失败（网络错误码: %v）", code)
	}
	return a.adoptSongs(utilsstruct.GetSongsOfAlbum(data))
}

// adoptSongs 缓存歌曲到播放池并转成 DTO
func (a *App) adoptSongs(songs []structs.Song) ([]SongDTO, error) {
	a.mu.Lock()
	a.songs = make(map[int64]structs.Song, len(songs))
	for _, s := range songs {
		a.songs[s.Id] = s
	}
	a.mu.Unlock()

	dtos := make([]SongDTO, 0, len(songs))
	for _, s := range songs {
		dtos = append(dtos, toSongDTO(s))
	}
	return dtos, nil
}

func (a *App) clearSongPool() {
	a.mu.Lock()
	a.songs = make(map[int64]structs.Song)
	a.mu.Unlock()
}

func parseSearchPlaylists(data []byte) []SearchItem {
	var raw struct {
		Result struct {
			Playlists []struct {
				ID         int64  `json:"id"`
				Name       string `json:"name"`
				PlayCount  int64  `json:"playCount"`
				TrackCount int64  `json:"trackCount"`
			} `json:"playlists"`
		} `json:"result"`
	}
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil
	}
	items := make([]SearchItem, 0, len(raw.Result.Playlists))
	for _, p := range raw.Result.Playlists {
		items = append(items, SearchItem{
			ID:   p.ID,
			Name: p.Name,
			Sub:  fmt.Sprintf("%s · %d 首", humanizeCount(p.PlayCount), p.TrackCount),
		})
	}
	return items
}

func parseSearchAlbums(data []byte) []SearchItem {
	var raw struct {
		Result struct {
			Albums []struct {
				ID     int64  `json:"id"`
				Name   string `json:"name"`
				Artist struct {
					Name string `json:"name"`
				} `json:"artist"`
				Size int64 `json:"size"`
			} `json:"albums"`
		} `json:"result"`
	}
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil
	}
	items := make([]SearchItem, 0, len(raw.Result.Albums))
	for _, al := range raw.Result.Albums {
		items = append(items, SearchItem{
			ID:   al.ID,
			Name: al.Name,
			Sub:  al.Artist.Name + fmt.Sprintf(" · %d 首", al.Size),
		})
	}
	return items
}

// humanizeCount 数字缩写成 万/亿
func humanizeCount(n int64) string {
	switch {
	case n >= 100000000:
		return fmt.Sprintf("%.1f亿", float64(n)/100000000)
	case n >= 10000:
		return fmt.Sprintf("%.1f万", float64(n)/10000)
	default:
		return fmt.Sprintf("%d", n)
	}
}

// PlaySongResult 播放请求结果（Skip=true 表示该歌曲无法播放，前端会自动切到下一首）
type PlaySongResult struct {
	OK      bool   `json:"ok"`
	Skip    bool   `json:"skip"`
	Message string `json:"message,omitempty"`
}

// probeClient URL 预检专用：带超时，避免无效地址长时间挂起
var probeClient = &http.Client{Timeout: 8 * time.Second}

// probePlayableURL 对播放地址做一次快速 HTTP 预检，剔除已失效/不可达的地址。
// UNM 解密产生的是本地 file:// 地址，直接放行交给内核
func probePlayableURL(rawURL string) error {
	if strings.HasPrefix(rawURL, "file://") {
		return nil
	}
	req, err := http.NewRequest(http.MethodGet, rawURL, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
	resp, err := probeClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusPartialContent {
		return nil
	}
	return fmt.Errorf("HTTP %d", resp.StatusCode)
}

// PlaySong 播放搜索结果中的某首歌。
// 无法播放（无版权/需会员/地址失效/超时）时不返回 error，而是返回 Skip 标记，
// 由前端自动切换下一首；同时预检 URL 并等内核完成切换，避免无效地址阻塞后续播放
func (a *App) PlaySong(songID int64) (PlaySongResult, error) {
	if !a.playable() {
		return PlaySongResult{Message: "播放器尚未就绪"}, nil
	}

	a.mu.Lock()
	song, ok := a.songs[songID]
	if !ok {
		song, ok = a.favorites[songID] // 收藏歌曲跨会话可播
	}
	if !ok {
		song, ok = a.session[songID] // 最近一次会话队列跨会话可播（启动后点播放续播）
	}
	a.mu.Unlock()
	if !ok {
		return PlaySongResult{Message: "该歌曲不在可播放列表中，请先搜索"}, nil
	}

	// 标记本次请求序号：连续点击时只有最后一次真正下发
	seq := a.playSeq.Add(1)

	// 解析播放地址放进 goroutine 并限时，解析卡顿不再拖死前端轮询与后续播放
	type fetchRes struct {
		info netease.PlayableInfo
		err  error
	}
	ch := make(chan fetchRes, 1)
	go func() {
		info, err := netease.FetchPlayableInfo(songID, a.effectiveQuality())
		ch <- fetchRes{info: info, err: err}
	}()
	var info netease.PlayableInfo
	select {
	case r := <-ch:
		info = r.info
		if r.err != nil {
			return PlaySongResult{Skip: true, Message: "获取播放地址失败，已自动跳过"}, nil
		}
	case <-time.After(8 * time.Second):
		return PlaySongResult{Skip: true, Message: "获取播放地址超时，已自动跳过"}, nil
	}
	if info.URL == "" {
		return PlaySongResult{Skip: true, Message: "无可用播放地址（歌曲可能无版权，或需要登录会员账号），已自动跳过"}, nil
	}

	musicType := strings.ToLower(info.MusicType)
	st, exists := player.SongTypeMapping[musicType]
	if !exists {
		return PlaySongResult{Skip: true, Message: fmt.Sprintf("暂不支持该音频格式: %s，已自动跳过", musicType)}, nil
	}

	// 地址预检：失效地址下发给内核会导致播放协程永久阻塞，这里提前拦截
	if err := probePlayableURL(info.URL); err != nil {
		slog.Warn("playable url probe failed", "id", songID, "err", err)
		return PlaySongResult{Skip: true, Message: "播放地址不可用，已自动跳过"}, nil
	}

	// 串行下发：等内核完成切换或超时后才放行下一个播放请求，避免 musicChan 缓冲只有 1 导致连点丢歌
	a.playMu.Lock()
	defer a.playMu.Unlock()
	if seq != a.playSeq.Load() {
		// 已有更新的播放请求，本次直接放弃
		return PlaySongResult{}, nil
	}

	a.player.Play(player.URLMusic{
		URL:  info.URL,
		Song: song,
		Type: st,
	})
	slog.Info("start play", "song", song.Name, "id", songID, "type", musicType)

	// 等待内核真正进入 Playing（最多 10s）。
	// 内核接管本次播放时会先进入 Paused；随后若转为 Stopped 且当前曲目
	// 确为本次请求的歌曲，即内核级失败（源失效/解码失败），立即返回 Skip
	// 由前端自动切换下一首，不再占住 playMu 干等 10s 拖慢后续播放
	startedAt := time.Now()
	deadline := startedAt.Add(10 * time.Second)
	seenActive := false
	for time.Now().Before(deadline) {
		switch a.player.State() {
		case types.Playing:
			return PlaySongResult{OK: true}, nil
		case types.Paused:
			seenActive = true
		case types.Stopped:
			// seenActive：内核已接管本次切换后失败；
			// 1s 宽限：覆盖接管前上一曲残留的 Stopped（同曲连播场景），避免误判
			if a.player.CurMusic().Id == songID && (seenActive || time.Since(startedAt) >= time.Second) {
				return PlaySongResult{Skip: true, Message: "歌曲播放失败，已自动跳过"}, nil
			}
		}
		time.Sleep(50 * time.Millisecond)
	}
	// 超时时状态未知，仍返回成功交给状态轮询观察
	return PlaySongResult{OK: true}, nil
}

// Toggle 播放/暂停切换
func (a *App) Toggle() {
	if a.playable() {
		a.player.Toggle()
	}
}

// Pause 暂停
func (a *App) Pause() {
	if a.playable() {
		a.player.Pause()
	}
}

// Resume 继续播放
func (a *App) Resume() {
	if a.playable() {
		a.player.Resume()
	}
}

// Stop 停止播放
func (a *App) Stop() {
	if a.playable() {
		a.player.Stop()
	}
}

// SetVolume 设置音量 0~100（UI 音量，归一化不影响读数）。
// beep 引擎的 SetVolume(0) 只会把增益降到 2^-5（仍有微弱声音），
// 这里沿用 go-musicfox UpVolume/DownVolume 的步进逻辑置位/清除 Silent 标记，实现完全静音。
// 开启音量归一化时，实际下发到引擎的音量被限制在安全区间
func (a *App) SetVolume(volume int) {
	if volume < 0 {
		volume = 0
	} else if volume > 100 {
		volume = 100
	}
	a.curVolume.Store(int32(volume))
	a.applyVolume(volume)
}

// applyVolume 按当前归一化设置把 UI 音量换算后下发到播放引擎
func (a *App) applyVolume(volume int) {
	if !a.playable() {
		return
	}
	a.qualityMu.RLock()
	norm := a.volumeNorm
	a.qualityMu.RUnlock()
	if norm && volume > 0 {
		// 0 保留为真静音，其余映射进安全区间
		volume = normVolumeFloor + (normVolumeCeil-normVolumeFloor)*volume/100
	}
	if volume <= 0 {
		a.player.SetVolume(1) // 先离开触底值，DownVolume 才会生效
		a.player.DownVolume() // 音量触底时置 Silent=true，真正静音
		a.player.SetVolume(0) // 回到 0 刻度
		return
	}
	a.player.SetVolume(1) // 从非零小音量出发
	a.player.UpVolume()   // UpVolume 会清除 Silent 标记
	a.player.SetVolume(volume)
}

// setVolumeNorm 更新音量归一化开关，并按新映射立即重新下发当前音量
func (a *App) setVolumeNorm(on bool) {
	a.qualityMu.Lock()
	a.volumeNorm = on
	a.qualityMu.Unlock()
	a.applyVolume(int(a.curVolume.Load()))
}

// SetVolumeNorm 开关音量归一化（前端设置页）
func (a *App) SetVolumeNorm(on bool) {
	a.setVolumeNorm(on)
}

// VolumeUp 音量 +5，返回 UI 音量
func (a *App) VolumeUp() int {
	return a.stepVolume(5)
}

// VolumeDown 音量 -5，返回 UI 音量
func (a *App) VolumeDown() int {
	return a.stepVolume(-5)
}

// stepVolume 以 UI 音量为基准步进（归一化只影响引擎实际输出，不影响读数）
func (a *App) stepVolume(delta int) int {
	if !a.playable() {
		return 0
	}
	v := int(a.curVolume.Load()) + delta
	if v < 0 {
		v = 0
	} else if v > 100 {
		v = 100
	}
	a.SetVolume(v)
	return v
}

// Volume 当前 UI 音量（0~100）
func (a *App) Volume() int {
	return int(a.curVolume.Load())
}

// Seek 跳转到指定进度（秒）。beep 引擎目前仅对 go-mp3 解码的 MP3 支持精确跳转
func (a *App) Seek(seconds float64) error {
	if !a.playable() {
		return errors.New("播放器尚未就绪")
	}
	if seconds < 0 {
		seconds = 0
	}
	if !a.seekSupported() {
		return errors.New("当前歌曲格式不支持拖动进度")
	}
	a.player.Seek(time.Duration(seconds * float64(time.Second)))
	return nil
}

// seekSupported beep 引擎暂时只对 mp3(go-mp3) 实现 Seek
func (a *App) seekSupported() bool {
	if a.player == nil {
		return false
	}
	cur := a.player.CurMusic()
	if cur.Type != player.Mp3 {
		return false
	}
	if configs.AppConfig == nil {
		return false
	}
	return configs.AppConfig.Player.Beep.Mp3Decoder == types.BeepGoMp3Decoder
}

// collectStatus 采集播放状态快照（会调用可能阻塞的内核方法）
func (a *App) collectStatus() PlayerStatus {
	status := PlayerStatus{
		State:  "unknown",
		Volume: 0,
	}
	if !a.playable() {
		return status
	}

	switch a.player.State() {
	case types.Playing:
		status.State = "playing"
	case types.Paused:
		status.State = "paused"
	case types.Stopped:
		status.State = "stopped"
	case types.Interrupted:
		status.State = "interrupted"
	}

	status.Position = a.player.PassedTime().Seconds()
	status.Volume = int(a.curVolume.Load()) // UI 音量读数（引擎为归一化换算值）

	cur := a.player.CurMusic()
	if cur.Id != 0 {
		dto := toSongDTO(cur.Song)
		status.Song = &dto
		status.MusicType = songTypeName(cur.Type)
		status.SeekSupported = a.seekSupported()
	}
	return status
}

// Status 播放状态快照（前端轮询）。
// 内核某些方法在异常情况下可能长时间阻塞，这里限时采集：
// 超时则回退到最近一次成功快照，保证前端轮询永不挂死
func (a *App) Status() PlayerStatus {
	ch := make(chan PlayerStatus, 1)
	go func() { ch <- a.collectStatus() }()
	select {
	case st := <-ch:
		a.mu.Lock()
		a.lastStatus = st
		a.mu.Unlock()
		return st
	case <-time.After(2 * time.Second):
		a.mu.Lock()
		defer a.mu.Unlock()
		if a.lastStatus.State == "" {
			return PlayerStatus{State: "unknown"}
		}
		return a.lastStatus
	}
}

func songTypeName(t player.SongType) string {
	for name, st := range player.SongTypeMapping {
		if st == t {
			return name
		}
	}
	return "unknown"
}

// LyricDTO 歌词数据（原始 LRC + 翻译 LRC，由前端解析为时间轴）
type LyricDTO struct {
	Original   string `json:"original"`
	Translated string `json:"translated"`
}

// Lyric 获取某首歌的歌词（网易云 LRC 原文与翻译）
func (a *App) Lyric(songID int64) (LyricDTO, error) {
	if songID == 0 {
		return LyricDTO{}, errors.New("无效的歌曲ID")
	}
	data, err := netease.FetchLyric(songID)
	if err != nil {
		return LyricDTO{}, fmt.Errorf("获取歌词失败: %v", err)
	}
	return LyricDTO{Original: data.Original, Translated: data.Translated}, nil
}

// ---------------------------------------------------------------------------
// 内部转换
// ---------------------------------------------------------------------------

func toSongDTO(s structs.Song) SongDTO {
	artists := make([]string, 0, len(s.Artists))
	for _, artist := range s.Artists {
		artists = append(artists, artist.Name)
	}
	pic := s.Album.PicUrl
	if pic != "" && !strings.Contains(pic, "?") {
		pic += "?param=300y300"
	}
	return SongDTO{
		ID:       s.Id,
		Name:     s.Name,
		Artists:  strings.Join(artists, " / "),
		Album:    s.Album.Name,
		PicURL:   pic,
		Duration: s.Duration.Seconds(),
	}
}

// ---------------------------------------------------------------------------
// 供 main（模块根目录 package main）使用的导出入口：
// 目录 / 生命周期钩子，避免在 App 上暴露会被 Wails 绑定成前端方法的成员。
// ---------------------------------------------------------------------------

// RootDataDir 数据根目录（main 在设置 MUSICFOX_ROOT 便携根目录前调用）
func RootDataDir() string { return guiDataDir() }

// EnsureLocalDirs 创建 exe 旁的数据目录与缓冲目录
func EnsureLocalDirs() { ensureLocalDirs() }

// StartupHook 返回 App 的 Wails 启动回调（等价于原 app.startup）
func StartupHook(a *App) func(ctx context.Context) { return a.startup }

// ShutdownHook 返回 App 的 Wails 退出回调（等价于原 app.shutdown）
func ShutdownHook(a *App) func(ctx context.Context) { return a.shutdown }
