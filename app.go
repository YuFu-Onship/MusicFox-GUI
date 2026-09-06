//go:build windows

package main

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
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

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

// Settings 本地设置（exe 同目录 setting.json）
type Settings struct {
	Theme  string `json:"theme"` // dark / light
	Volume int    `json:"volume"`
}

// LocalState 前端读写视图：设置 + 收藏
// 设置存 setting.json，收藏存 favorites.csv（均在 exe 同目录）
type LocalState struct {
	Theme     string    `json:"theme"` // dark / light
	Volume    int       `json:"volume"`
	Favorites []SongDTO `json:"favorites"`
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
}

// NewApp 创建后端应用实例并初始化配置/登录态
func NewApp() *App {
	// 初始化日志（幂等）
	slogx.Init()

	// 加载配置
	loadConfig()

	// 配置 UNM 等网易云参数
	applyNeteaseConfig()

	a := &App{songs: make(map[int64]structs.Song), favorites: make(map[int64]structs.Song), session: make(map[int64]structs.Song)}
	initStateFiles()
	a.initCookieJar()
	a.loadFavorites()
	a.loadSession()
	return a
}

func sessionFilePath() string { return filepath.Join(exeDir(), "session.json") }

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

func settingsFilePath() string  { return filepath.Join(exeDir(), "setting.json") }
func favoritesFilePath() string { return filepath.Join(exeDir(), "favorites.csv") }

func defaultSettings() Settings { return Settings{Theme: "dark", Volume: 60} }

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
	legacyPath := filepath.Join(mfoxapp.DataDir(), "gui_state.json")
	if _, err := os.Stat(legacyPath); err != nil {
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
		_ = Settings{Theme: old.Theme, Volume: old.Volume}.save()
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
	return LocalState{Theme: st.Theme, Volume: st.Volume, Favorites: favs}, nil
}

// SaveState 持久化设置（setting.json）与收藏（favorites.csv）
func (a *App) SaveState(st LocalState) error {
	if err := (Settings{Theme: st.Theme, Volume: st.Volume}).save(); err != nil {
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

// startup Wails 启动回调：初始化音频播放引擎
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	// beep 引擎读取全局 configs.AppConfig
	a.player = player.NewBeepPlayer()
	// 应用持久化的音量（引擎默认满音量，界面读数需要在这里真正生效）
	if v := loadSettings().Volume; a.player != nil {
		a.player.SetVolume(v)
		slog.Info("applied saved volume on startup", "volume", v)
	}
	slog.Info("beep player started")
}

// shutdown Wails 退出回调：保存 cookie 并释放播放器
func (a *App) shutdown(_ context.Context) {
	if a.player != nil {
		a.player.Close()
	}
	// 持久化登录态
	if jar, ok := neteaseutil.GetGlobalCookieJar().(*cookiejar.Jar); ok {
		_ = jar.Save()
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

	// 等待内核真正进入 Playing（最多 10s）；内核级失败会转为 Stopped，由前端自动续播接管
	deadline := time.Now().Add(10 * time.Second)
	for time.Now().Before(deadline) {
		if a.player.State() == types.Playing {
			return PlaySongResult{OK: true}, nil
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

// SetVolume 设置音量 0~100。
// beep 引擎的 SetVolume(0) 只会把增益降到 2^-5（仍有微弱声音），
// 这里沿用 go-musicfox UpVolume/DownVolume 的步进逻辑置位/清除 Silent 标记，实现完全静音
func (a *App) SetVolume(volume int) {
	if !a.playable() {
		return
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

// VolumeUp 音量 +5，返回新音量
func (a *App) VolumeUp() int {
	if !a.playable() {
		return 0
	}
	a.SetVolume(a.player.Volume() + 5)
	return a.player.Volume()
}

// VolumeDown 音量 -5，返回新音量
func (a *App) VolumeDown() int {
	if !a.playable() {
		return 0
	}
	a.SetVolume(a.player.Volume() - 5)
	return a.player.Volume()
}

// Volume 当前音量
func (a *App) Volume() int {
	if !a.playable() {
		return 0
	}
	return a.player.Volume()
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
	status.Volume = a.player.Volume()

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
