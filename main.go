//go:build windows

package main

import (
	"embed"
	"os"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"

	appimpl "github.com/go-musicfox/go-musicfox/gui/src"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// 便携模式：内核（config/cookie/日志/数据库）与 GUI 状态文件统一放到
	// exe 旁边的 musicfox_gui_data 目录；歌曲缓冲（临时缓存）经配置重定向到
	// musicfox_gui_buffer 目录（见 src/app.go 的 applyBufferDir）。必须在 NewApp 前设置。
	os.Setenv("MUSICFOX_ROOT", appimpl.RootDataDir())
	appimpl.EnsureLocalDirs()

	// 设置进程 AppUserModelID 并补齐开始菜单快捷方式，使 Windows 媒体控制栏
	// 正确显示应用名（避免“未知应用”）
	appimpl.EnsureAppUserModelID()

	app := appimpl.NewApp()

	err := wails.Run(&options.App{
		Title:     "MusicFox GUI",
		Width:     1100,
		Height:    760,
		MinWidth:  400,
		MinHeight: 300,
		// 使用系统原生标题栏；暗色主题标题栏与默认暗色界面一致
		Windows: &windows.Options{
			Theme: windows.Dark,
		},
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 30, G: 30, B: 32, A: 255},
		OnStartup:        appimpl.StartupHook(app),
		OnShutdown:       appimpl.ShutdownHook(app),
		Bind:             []interface{}{app},
	})
	if err != nil {
		println("Error:", err.Error())
	}
}
