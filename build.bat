@echo off
rem MusicFox GUI one-shot build script.
rem Wails v2 static analysis crashes on large replaced modules
rem with: internal error: package "context" without types
rem so these two steps are skipped (bindings are injected at runtime).
cd /d "%~dp0"
wails build -skipembedcreate -skipbindings
if errorlevel 1 (
    echo.
    echo BUILD FAILED. Please check: Go>=1.26, Wails CLI v2, gcc.
    exit /b 1
)
echo.
echo DONE: build\bin\musicfox-gui.exe
