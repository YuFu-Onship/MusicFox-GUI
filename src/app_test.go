//go:build windows

package app

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/go-musicfox/go-musicfox/internal/types"
)

// TestSearch 验证搜索绑定：能拿到非空、字段完整的歌曲列表
func TestSearch(t *testing.T) {
	a := NewApp()

	resp, err := a.Search("周杰伦 晴天", "song", 0)
	if err != nil {
		t.Fatalf("Search error: %v", err)
	}
	songs := resp.Items
	if len(songs) == 0 {
		t.Fatal("期望至少一首歌曲结果")
	}

	found := false
	for _, s := range songs {
		if s.ID == 0 || s.Name == "" {
			continue
		}
		found = true
		break
	}
	if !found {
		t.Fatalf("歌曲字段异常: %+v", songs[0])
	}
	t.Logf("搜索到 %d 首，第一首: %s", len(songs), songs[0].Name)
}

// TestSearchPlaylistArtist 验证歌单/专辑分类搜索可用
func TestSearchPlaylistArtist(t *testing.T) {
	a := NewApp()

	for _, cat := range []string{"playlist", "album"} {
		resp, err := a.Search("周杰伦", cat, 0)
		if err != nil {
			t.Fatalf("%s Search error: %v", cat, err)
		}
		if len(resp.Items) == 0 {
			t.Fatalf("%s 无结果", cat)
		}
		t.Logf("%s: %d 条, 第一条 %s", cat, len(resp.Items), resp.Items[0].Name)
	}
}

// TestLyric 验证歌词绑定：能取回 LRC 歌词文本
func TestLyric(t *testing.T) {
	a := NewApp()

	songs, err := a.Search("周杰伦 晴天", "song", 0)
	if err != nil || len(songs.Items) == 0 {
		t.Fatalf("Search error: %v", err)
	}

	lyric, err := a.Lyric(songs.Items[0].ID)
	if err != nil {
		t.Fatalf("Lyric error: %v", err)
	}
	if len(lyric.Original) == 0 {
		t.Fatal("歌词内容为空")
	}
	t.Logf("歌词前 80 字: %s", firstRunes(lyric.Original, 80))
}

func firstRunes(s string, n int) string {
	r := []rune(s)
	if len(r) > n {
		r = r[:n]
	}
	return string(r)
}

// TestPlaybackControls 端到端验证: 搜索 -> 播放 -> 暂停/继续 -> 音量 -> 进度 -> 停止
func TestPlaybackControls(t *testing.T) {
	a := NewApp()
	a.startup(context.Background())
	defer a.shutdown(context.Background())

	resp, err := a.Search("周杰伦 晴天", "song", 0)
	if err != nil {
		t.Fatalf("Search error: %v", err)
	}
	songs := resp.Items
	if len(songs) == 0 {
		t.Fatal("没有搜索结果")
	}

	// 播放第一首
	res, err := a.PlaySong(songs[0].ID)
	if err != nil || !res.OK {
		t.Fatalf("PlaySong error: %v (res: %+v)", err, res)
	}

	// 等待真正进入播放状态（beep 需先下载完）
	deadline := time.Now().Add(90 * time.Second)
	for time.Now().Before(deadline) {
		if a.player.State() == types.Playing {
			break
		}
		time.Sleep(500 * time.Millisecond)
	}
	if a.player.State() != types.Playing {
		t.Fatalf("等待播放超时, state=%v", a.player.State())
	}

	// 等进度走动
	time.Sleep(2 * time.Second)
	pos := a.player.PassedTime()
	if pos <= 0 {
		t.Fatalf("播放位置未前进: %v", pos)
	}
	t.Logf("正在播放: %s, 位置 %.1fs", songs[0].Name, pos.Seconds())
	// 暂停
	a.Toggle()
	if a.player.State() != types.Paused {
		t.Fatalf("Toggle 后应为 Paused, got %v", a.player.State())
	}
	pausePos := a.player.PassedTime()
	time.Sleep(1500 * time.Millisecond)
	if a.player.PassedTime() != pausePos {
		t.Fatal("暂停后进度仍在变化")
	}
	t.Logf("暂停成功, 位置停在 %.1fs", pausePos.Seconds())

	// 音量
	a.SetVolume(30)
	if v := a.Volume(); v != 30 {
		t.Fatalf("SetVolume(30) 后读取为 %d", v)
	}
	a.SetVolume(0)
	if v := a.Volume(); v != 0 {
		t.Fatalf("SetVolume(0) 后读取为 %d", v)
	}
	a.SetVolume(100)
	if v := a.Volume(); v != 100 {
		t.Fatalf("SetVolume(100) 后读取为 %d", v)
	}
	a.SetVolume(60)
	t.Logf("音量调节正常: %d", a.Volume())

	// 音量归一化：UI 读数不变，引擎实际音量被限制在安全区间（0 仍为真静音）
	a.SetVolumeNorm(true)
	for _, v := range []int{0, 1, 50, 100} {
		a.SetVolume(v)
		if ui := a.Volume(); ui != v {
			t.Fatalf("归一化开启时 UI 音量读数应保持 %d, got %d", v, ui)
		}
		engine := a.player.Volume()
		if v == 0 {
			if engine != 0 {
				t.Fatalf("音量 0 应保持真静音, 引擎音量 %d", engine)
			}
			continue
		}
		if engine < normVolumeFloor || engine > normVolumeCeil {
			t.Fatalf("UI=%d 归一化后引擎音量 %d 超出安全区间 [%d, %d]",
				v, engine, normVolumeFloor, normVolumeCeil)
		}
	}
	a.SetVolume(100)
	if e := a.player.Volume(); e != normVolumeCeil {
		t.Fatalf("UI 100 应映射为引擎 %d, got %d", normVolumeCeil, e)
	}
	a.SetVolumeNorm(false)
	a.SetVolume(60)
	t.Logf("音量归一化验证通过")

	// 进度跳转（暂停状态下 seek 后位置应跳到目标附近）
	if !a.seekSupported() {
		t.Log("当前音质不是 go-mp3 的 mp3，跳过 Seek 断言")
	} else {
		if err := a.Seek(30); err != nil {
			t.Fatalf("Seek error: %v", err)
		}
		time.Sleep(500 * time.Millisecond)
		afterSeek := a.player.PassedTime().Seconds()
		if afterSeek < 27 || afterSeek > 33 {
			t.Fatalf("Seek(30) 后位置为 %.1f, 超出预期范围", afterSeek)
		}
		t.Logf("进度跳转正常: %.1fs", afterSeek)
	}

	// 继续播放
	a.Toggle()
	if a.player.State() != types.Playing {
		t.Fatalf("Resume 后应为 Playing, got %v", a.player.State())
	}

	// 状态快照（前端轮询数据）
	st := a.Status()
	if st.State != "playing" || st.Volume != 60 || st.Song == nil || st.Song.Name == "" {
		t.Fatalf("Status 异常: %+v", st)
	}
	if !st.SeekSupported && !strings.Contains(st.MusicType, "mp3") {
		t.Fatalf("Status.MusicType 异常: %s", st.MusicType)
	}

	// 停止
	a.Stop()
	deadline = time.Now().Add(10 * time.Second)
	for time.Now().Before(deadline) {
		if a.player.State() == types.Stopped {
			break
		}
		time.Sleep(200 * time.Millisecond)
	}
	if a.player.State() != types.Stopped {
		t.Fatalf("Stop 后状态异常: %v", a.player.State())
	}
	t.Log("全流程验证通过: 搜索/播放/暂停/音量/归一化/进度/停止")
}
