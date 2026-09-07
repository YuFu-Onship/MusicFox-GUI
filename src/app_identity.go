//go:build windows

package app

import (
	"log/slog"
	"os"
	"path/filepath"
	"syscall"
	"unsafe"

	"github.com/go-ole/go-ole"
	"github.com/go-ole/go-ole/oleutil"
)

// Windows 媒体控制栏（SMTC 悬浮条）展示的应用名通过 AppUserModelID 解析：
// 先查“开始菜单快捷方式(System.AppUserModel.ID 属性)”匹配，找不到再看 exe
// 版本信息（FileDescription/ProductName）。MusicFox GUI 的 exe 已内嵌版本资源，
// 因此这里只需：设置稳定的进程 AUMID，并首次运行时补一个开始菜单快捷方式，
// 让媒体悬浮条与任务栏显示 “MusicFox GUI” 而非 “未知应用”。

const appUserModelID = "go-musicfox.MusicFoxGUI"

const startMenuLnkName = "MusicFox GUI.lnk"

var (
	shell32dll        = syscall.NewLazyDLL("shell32.dll")
	procSetExplicitID = shell32dll.NewProc("SetCurrentProcessExplicitAppUserModelID")
)

// setProcessAppUserModelID 把本进程的 AppUserModelID 设为固定值
func setProcessAppUserModelID(id string) error {
	pid, err := syscall.UTF16PtrFromString(id)
	if err != nil {
		return err
	}
	r1, _, e1 := procSetExplicitID.Call(uintptr(unsafe.Pointer(pid)))
	if r1 != 0 {
		if e1 != nil {
			return e1
		}
		return syscall.Errno(r1)
	}
	return nil
}

// EnsureAppUserModelID 设置 AUMID，并在后台（首次）创建开始菜单快捷方式。
// 由 main 启动时调用。
func EnsureAppUserModelID() {
	if err := setProcessAppUserModelID(appUserModelID); err != nil {
		slog.Warn("设置 AppUserModelID 失败", "err", err)
	}
	go ensureStartMenuShortcut()
}

func startMenuProgramsDir() (string, error) {
	appData, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(appData, "Microsoft", "Windows", "Start Menu", "Programs"), nil
}

// ensureStartMenuShortcut 仅当 exe 位置变化或快捷方式缺失时，
// 用 WScript.Shell 创建 “MusicFox GUI.lnk”（指向当前 exe）。
func ensureStartMenuShortcut() {
	defer func() {
		if r := recover(); r != nil {
			slog.Warn("创建开始菜单快捷方式异常", "err", r)
		}
	}()
	exe, err := os.Executable()
	if err != nil {
		return
	}
	dir, err := startMenuProgramsDir()
	if err != nil {
		slog.Warn("无法定位开始菜单目录", "err", err)
		return
	}
	lnk := filepath.Join(dir, startMenuLnkName)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		slog.Warn("创建开始菜单目录失败", "err", err)
		return
	}

	marker := filepath.Join(guiDataDir(), ".startmenu-target")
	if data, err := os.ReadFile(marker); err == nil && string(data) == exe {
		if _, err := os.Stat(lnk); err == nil {
			return // 已为本 exe 建过且快捷方式仍在
		}
	}

	if err := ole.CoInitializeEx(0, ole.COINIT_APARTMENTTHREADED); err != nil {
		slog.Warn("COM 初始化失败", "err", err)
		return
	}
	defer ole.CoUninitialize()

	if err := createStartMenuShortcut(exe, lnk); err != nil {
		slog.Warn("创建开始菜单快捷方式失败", "err", err)
		return
	}
	_ = os.WriteFile(marker, []byte(exe), 0o600)
	slog.Info("已创建开始菜单快捷方式", "lnk", lnk)
}

// createStartMenuShortcut 用 WScript.Shell 生成 .lnk
func createStartMenuShortcut(exe, lnk string) error {
	unknown, err := oleutil.CreateObject("WScript.Shell")
	if err != nil {
		return err
	}
	shell, err := unknown.QueryInterface(ole.IID_IDispatch)
	if err != nil {
		return err
	}
	defer shell.Release()

	shortcutVar, err := oleutil.CallMethod(shell, "CreateShortcut", lnk)
	if err != nil {
		return err
	}
	shortcut := shortcutVar.ToIDispatch()
	if shortcut == nil {
		return syscall.EINVAL
	}
	defer shortcut.Release()

	if _, err := oleutil.PutProperty(shortcut, "TargetPath", exe); err != nil {
		return err
	}
	if _, err := oleutil.PutProperty(shortcut, "WorkingDirectory", filepath.Dir(exe)); err != nil {
		return err
	}
	if _, err := oleutil.PutProperty(shortcut, "IconLocation", exe+",0"); err != nil {
		return err
	}
	if _, err := oleutil.PutProperty(shortcut, "Description", "MusicFox GUI"); err != nil {
		return err
	}
	if _, err := oleutil.CallMethod(shortcut, "Save"); err != nil {
		return err
	}
	return nil
}
