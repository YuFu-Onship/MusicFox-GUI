<p align="center">
<img width="256" height="256" alt="music_gui" src="https://github.com/user-attachments/assets/85930c20-452b-4af3-9a7f-4db30074328d" />
</p>

<h1 align="center">MusicFox GUI</h1>

<p align="center">
  网易云音乐风格的桌面播放器界面 —— 基于 <a href="https://github.com/go-musicfox/go-musicfox">go-musicfox</a> 的播放内核，使用 <b>Go + Wails</b> 编写
</p>

<p align="center">
  <img alt="Go" src="https://img.shields.io/badge/Go-%3E%3D1.26-00ADD8?style=flat-square&logo=go&logoColor=white" />
  <img alt="Wails" src="https://img.shields.io/badge/Wails-v2-DF4A75?style=flat-square&logo=wails" />
  <img alt="Platform" src="https://img.shields.io/badge/Platform-Windows%2010%2F11-0078D6?style=flat-square&logo=windows&logoColor=white" />
  <img alt="AI" src="https://img.shields.io/badge/Vibe%20Coding-DeepSeek%20V4%20Flash%20%2B%20GLM%205.3%20Flash-8A2BE2?style=flat-square" />
</p>

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

## 相关项目

- [go-musicfox](https://github.com/go-musicfox/go-musicfox) —— 网易云音乐终端播放器（上游播放内核）
