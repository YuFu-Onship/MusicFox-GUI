//go:build windows

package app

import (
	"log/slog"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	control "github.com/go-musicfox/go-musicfox/internal/remote_control"
	"github.com/go-musicfox/go-musicfox/internal/types"
)

// SMTC（Windows 系统媒体控制栏，音量/任务栏悬浮条里的播放控件）集成。
// 参照 musicfox 的 internal/remote_control 实现：用 WinRT SystemMediaTransportControls
// 展示当前歌曲信息，并把播放/暂停/下一首/上一首按钮回调接回应用。
// 播放/暂停直接操作内核播放器；上/下曲由前端负责（队列与随机逻辑都在前端），
// 因此通过 Wails 事件通知前端，前端与点击底部“上一首/下一首”完全同路径。

const (
	smtcEventNext = "smtc:next"
	smtcEventPrev = "smtc:prev"
)

// smtcController 实现 remote_control.Controller，把 SMTC 按钮映射为应用动作。
type smtcController struct {
	a *App
}

func (c smtcController) CtrlPause() {
	c.a.Pause()
}

func (c smtcController) CtrlResume() {
	c.a.Resume()
}

func (c smtcController) CtrlStop() {
	c.a.Stop()
}

func (c smtcController) CtrlToggle() {
	c.a.Toggle()
}

func (c smtcController) CtrlNext() {
	if c.a.ctx != nil {
		runtime.EventsEmit(c.a.ctx, smtcEventNext)
	}
}

func (c smtcController) CtrlPrevious() {
	if c.a.ctx != nil {
		runtime.EventsEmit(c.a.ctx, smtcEventPrev)
	}
}

func (c smtcController) CtrlSeek(d time.Duration) {
	if c.a != nil && c.a.seekSupported() {
		_ = c.a.Seek(d.Seconds())
	}
}

// SMTC 媒体栏目前没有音量/喜欢/随机/循环按钮，保留空实现以满足接口
func (c smtcController) CtrlSetVolume(_ int)    {}
func (c smtcController) CtrlLikeNowPlaying()    {}
func (c smtcController) CtrlDislikeNowPlaying() {}
func (c smtcController) CtrlShuffle()           {}
func (c smtcController) CtrlRepeat()            {}
func (c smtcController) CtrlSetRepeat(_ any)    {}
func (c smtcController) CtrlSetShuffle(_ any)   {}

// smtcSession 周期性把播放快照同步到系统媒体控制栏。
type smtcSession struct {
	a      *App
	rc     *control.RemoteControl
	stopCh chan struct{}

	curSongID int64
	curState  string
}

func newSMTCSession(a *App) (s *smtcSession) {
	defer func() {
		if r := recover(); r != nil {
			slog.Warn("创建系统媒体控制会话失败（不影响播放）", "err", r)
			s = nil
		}
	}()
	if a == nil {
		return nil
	}
	return &smtcSession{
		a:      a,
		rc:     control.NewRemoteControl(smtcController{a: a}, control.PlayingInfo{}),
		stopCh: make(chan struct{}),
	}
}

func (s *smtcSession) start() {
	if s == nil || s.rc == nil {
		return
	}
	go func() {
		ticker := time.NewTicker(time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-s.stopCh:
				return
			case <-s.a.ctx.Done():
				return
			case <-ticker.C:
				s.sync()
			}
		}
	}()
}

// sync 每 1s 采集一次播放快照并同步到 SMTC。
// 换歌/状态变化时整包更新（标题/歌手/专辑/封面/状态/进度），否则只推进进度。
func (s *smtcSession) sync() {
	defer func() {
		if r := recover(); r != nil {
			slog.Warn("同步系统媒体控制失败", "err", r)
		}
	}()
	if s == nil || s.rc == nil || s.a == nil {
		return
	}
	st := s.a.Status()
	if st.Song == nil {
		return
	}
	pos := time.Duration(st.Position * float64(time.Second))
	if s.curSongID != st.Song.ID || s.curState != st.State {
		info := control.PlayingInfo{
			TotalDuration:  time.Duration(st.Song.Duration * float64(time.Second)),
			PassedDuration: pos,
			State:          guiStateToCoreState(st.State),
			Volume:         st.Volume,
			TrackID:        st.Song.ID,
			PicUrl:         st.Song.PicURL,
			Name:           st.Song.Name,
			Artist:         st.Song.Artists,
			Album:          st.Song.Album,
			AlbumArtist:    st.Song.Artists,
		}
		s.rc.SetPlayingInfo(info)
		s.curSongID = st.Song.ID
		s.curState = st.State
		return
	}
	s.rc.SetPosition(pos)
}

func (s *smtcSession) close() {
	if s == nil {
		return
	}
	select {
	case <-s.stopCh:
	default:
		close(s.stopCh)
	}
	if s.rc != nil {
		defer func() {
			_ = recover()
		}()
		s.rc.Release()
	}
}

// guiStateToCoreState 把前端状态字符串转成内核 State，供 SMTC 状态机使用
func guiStateToCoreState(state string) types.State {
	switch state {
	case "playing":
		return types.Playing
	case "paused":
		return types.Paused
	case "stopped":
		return types.Stopped
	case "interrupted":
		return types.Interrupted
	default:
		return types.Unknown
	}
}
