
## 说明

这个项目只是对 **go-musicfox 部分功能的 GUI 界面实现**，并非 go-musicfox 的完整桌面版。

- 技术栈：**Go + Wails v2**，前端为原生 HTML / CSS / JS（无 npm 依赖），图标内联自 remix 风格 SVG；
- 播放内核、数据接口与配置直接复用 go-musicfox（beep 引擎 + 网易云接口）；
- 界面按项目内 `my_page_*.html` 设计稿实现（暗色 + 网易红 + 4px 圆角 + 歌词活动矩形动画）；
- 本项目整体由 **AI Vibe Coding** 完成，编写过程中使用的模型为 **DeepSeek V4 Flash** 与 **GLM 5.3 Flash**；
- 正常运行过程中，内存占用约 **200 MB**。

## 已实现的功能（当前）

- 搜索：单曲 / 歌单 / 专辑分类，滚动到底自动增量加载；
- 歌单 / 专辑详情页：查看并播放其中歌曲、收藏；
- 播放控制：顺序 / 随机 / 列表循环 / 单曲循环，上一首 / 下一首，播放与进度跳转；
- 歌词页：窗口化渲染、当前行始终居中、按 square.lua 同款算法平滑移动的活动矩形高亮；
- 播放会话记忆：重启后点播放即可续播上次的歌单 / 播放列表；
- 本地持久化：设置（主题 / 音量）与收藏（歌曲 / 歌单 / 专辑）保存为 exe 同目录的本地文件；
- 收藏页：批量管理（全选 / 播放选中 / 移除）；
- 明暗主题切换、音量静音切换、自定义无边框窗口控制。

## 局限（Limitations）

- 仅面向 Windows 10/11（Go 文件带 `windows` 构建约束）；
- 只覆盖 go-musicfox 的**部分功能**：不支持登录管理、MV、电台、排行榜、歌词同步下载等；
- 歌词 / 封面等资源依赖网易云接口，未登录时为游客模式，部分 VIP / 无版权歌曲可能无法播放；
- 进度跳转仅对 go-mp3 解码的 MP3 精确（与 go-musicfox 行为一致）；
- 播放顺序 / 随机等为前端逻辑，作用于当前队列；对异常播放地址做了超时预检与自动跳过，尽量保证播放不卡死。

## 快速开始

```bash
cd gui
build.bat                 # 或：wails build -skipembedcreate -skipbindings
# 产物：gui\build\bin\musicfox-gui.exe
```

更完整的说明、绑定方法与限制见 [`gui/README.md`](gui/README.md)。

## 相关项目

- [go-musicfox](https://github.com/go-musicfox/go-musicfox) —— 网易云音乐终端播放器（上游播放内核）
