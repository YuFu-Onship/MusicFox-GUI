"use strict";

/* ================= DOM ================= */
const $ = (id) => document.getElementById(id);

const els = {
  /* 侧边栏 */
  navFav: $("navFav"),
  navSearch: $("navSearch"),
  navTheme: $("navTheme"),
  navSettings: $("navSettings"),
  navThemeIcon: $("navThemeIcon"),

  /* 设置视图 */
  settingsPanel: $("settingsPanel"),
  setQualityOpts: $("setQualityOpts"),
  setBufferOpts: $("setBufferOpts"),
  setNormOpts: $("setNormOpts"),

  /* 主视图 */
  searchBar: $("searchBar"),
  searchInput: $("searchInput"),
  searchBtn: $("searchBtn"),
  searchClear: $("searchClear"),
  histList: $("histList"),
  histClear: $("histClear"),
  histEmpty: $("histEmpty"),
  browseArea: $("browseArea"),
  resultPanel: $("resultPanel"),
  catBar: $("catBar"),
  trackList: $("trackList"),
  empty: $("empty"),
  emptyTitle: $("emptyTitle"),
  emptySub: $("emptySub"),

  /* 歌单/专辑详情页 */
  detailPanel: $("detailPanel"),
  detailBack: $("detailBack"),
  detailTitle: $("detailTitle"),
  detailCover: $("detailCover"),
  detailName: $("detailName"),
  detailMeta: $("detailMeta"),
  detailPlayAll: $("detailPlayAll"),
  detailFav: $("detailFav"),
  detailFavText: $("detailFavText"),
  detailList: $("detailList"),

  /* 收藏视图 */
  favPanel: $("favPanel"),
  favCount: $("favCount"),
  favPlaylistCount: $("favPlaylistCount"),
  favAlbumCount: $("favAlbumCount"),
  favManage: $("favManage"),
  favToolbar: $("favToolbar"),
  favSelectAll: $("favSelectAll"),
  favPlaySel: $("favPlaySel"),
  favRemoveSel: $("favRemoveSel"),
  favDone: $("favDone"),
  favList: $("favList"),
  favEmpty: $("favEmpty"),

  /* 歌词覆盖层 */
  lyricsPage: $("lyricsPage"),
  lyricCollapse: $("lyricCollapse"),
  lyricTheme: $("lyricTheme"),
  lyricThemeIcon: $("lyricThemeIcon"),
  lyricsScroll: $("lyricsScroll"),

  /* 播放条 */
  playerBar: $("playerBar"),
  songBtn: $("songBtn"),
  coverBox: $("coverBox"),
  coverIcon: $("coverIcon"),
  coverImg: $("coverImg"),
  songTitle: $("songTitle"),
  songArtist: $("songArtist"),
  modeBtn: $("modeBtn"),
  modeIcon: $("modeIcon"),
  prevBtn: $("prevBtn"),
  playBtn: $("playBtn"),
  playIcon: $("playIcon"),
  nextBtn: $("nextBtn"),
  repeatBtn: $("repeatBtn"),
  repeatIcon: $("repeatIcon"),
  progressContainer: $("progressContainer"),
  progressTrack: $("progressTrack"),
  progressFill: $("progressFill"),
  progressHandle: $("progressHandle"),
  progressTip: $("progressTip"),
  volumeBtn: $("volumeBtn"),
  volumeIcon: $("volumeIcon"),
  volumeNum: $("volumeNum"),
  volumeTrack: $("volumeTrack"),
  volumeFill: $("volumeFill"),
  queueWrap: $("queueWrap"),
  queueBtn: $("queueBtn"),
  queueBadge: $("queueBadge"),
  queuePop: $("queuePop"),
  queueTitle: $("queueTitle"),
  queueClose: $("queueClose"),
  queueList: $("queueList"),
  snackbar: $("snackbar"),
};

/* ================= 图标（remix 风格内联，跟随 currentColor） ================= */
const IC = {
  play: '<path d="M19.376 12.4161L8.77735 19.4818C8.54759 19.635 8.23715 19.5729 8.08397 19.3432C8.02922 19.261 8 19.1645 8 19.0658V4.93433C8 4.65818 8.22386 4.43433 8.5 4.43433C8.59871 4.43433 8.69522 4.46355 8.77735 4.5183L19.376 11.584C19.6057 11.7372 19.6678 12.0477 19.5146 12.2774C19.478 12.3323 19.4309 12.3795 19.376 12.4161Z"/>',
  pause: '<path d="M6 5H8V19H6V5ZM16 5H18V19H16V5Z"/>',
  shuffle:
    '<path d="M18 17.8832V16L23 19L18 22V19.9095C14.9224 19.4698 12.2513 17.4584 11.0029 14.5453L11 14.5386L10.9971 14.5453C9.57893 17.8544 6.32508 20 2.72483 20H2V18H2.72483C5.52503 18 8.05579 16.3312 9.15885 13.7574L9.91203 12L9.15885 10.2426C8.05579 7.66878 5.52503 6 2.72483 6H2V4H2.72483C6.32508 4 9.57893 6.14557 10.9971 9.45473L11 9.46141L11.0029 9.45473C12.2513 6.5416 14.9224 4.53022 18 4.09051V2L23 5L18 8V6.11684C15.7266 6.53763 13.7737 8.0667 12.8412 10.2426L12.088 12L12.8412 13.7574C13.7737 15.9333 15.7266 17.4624 18 17.8832Z"/>',
  order:
    '<path d="M17 3.99998V2.0675C17 1.79136 17.2239 1.5675 17.5 1.5675C17.617 1.5675 17.7302 1.60851 17.8201 1.68339L21.9391 5.11587C22.1512 5.29266 22.1799 5.60794 22.0031 5.82008C21.9081 5.93407 21.7674 5.99998 21.619 5.99998H2V3.99998H17ZM2 18H22V20H2V18ZM2 11H22V13H2V11Z"/>',
  repeat:
    '<path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>',
  repeatOne:
    '<path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/>',
  eq: '<svg viewBox="0 0 24 24"><path d="M4 9h4v11H4zM16 4h4v16h-4zM10 7h4v13h-4z"/></svg>',
  moon: '<path d="M11.3807 2.01886C9.91573 3.38768 9 5.3369 9 7.49999C9 11.6421 12.3579 15 16.5 15C18.6631 15 20.6123 14.0843 21.9811 12.6193C21.6613 17.8537 17.3149 22 12 22C6.47715 22 2 17.5228 2 12C2 6.68514 6.14629 2.33869 11.3807 2.01886Z"/>',
  sun: '<path d="M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM16.9497 18.364L18.364 16.9497L20.4853 19.0711L19.0711 20.4853L16.9497 18.364ZM19.0711 3.51472L20.4853 4.92893L18.364 7.05025L16.9497 5.63604L19.0711 3.51472ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497ZM23 11V13H20V11H23ZM4 11V13H1V11H4Z"/>',
  volMute:
    '<path d="M5.88889 16.0001H2C1.44772 16.0001 1 15.5524 1 15.0001V9.00007C1 8.44778 1.44772 8.00007 2 8.00007H5.88889L11.1834 3.66821C11.3971 3.49335 11.7121 3.52485 11.887 3.73857C11.9601 3.8279 12 3.93977 12 4.05519V19.9449C12 20.2211 11.7761 20.4449 11.5 20.4449C11.3846 20.4449 11.2727 20.405 11.1834 20.3319L5.88889 16.0001ZM20.4142 12.0001L23.9497 15.5356L22.5355 16.9498L19 13.4143L15.4645 16.9498L14.0503 15.5356L17.5858 12.0001L14.0503 8.46454L15.4645 7.05032L19 10.5859L22.5355 7.05032L23.9497 8.46454L20.4142 12.0001Z"/>',
  volDown:
    '<path d="M8.88889 16.0001H5C4.44772 16.0001 4 15.5524 4 15.0001V9.00007C4 8.44778 4.44772 8.00007 5 8.00007H8.88889L14.1834 3.66821C14.3971 3.49335 14.7121 3.52485 14.887 3.73857C14.9601 3.8279 15 3.93977 15 4.05519V19.9449C15 20.2211 14.7761 20.4449 14.5 20.4449C14.3846 20.4449 14.2727 20.405 14.1834 20.3319L8.88889 16.0001ZM18.8631 16.5911L17.4411 15.1691C18.3892 14.4376 19 13.2902 19 12.0001C19 10.5697 18.2493 9.31476 17.1203 8.60766L18.5589 7.16906C20.0396 8.26166 21 10.0187 21 12.0001C21 13.8422 20.1698 15.4905 18.8631 16.5911Z"/>',
  volUp:
    '<path d="M2 16.0001H5.88889L11.1834 20.3319C11.2727 20.405 11.3846 20.4449 11.5 20.4449C11.7761 20.4449 12 20.2211 12 19.9449V4.05519C12 3.93977 11.9601 3.8279 11.887 3.73857C11.7121 3.52485 11.3971 3.49335 11.1834 3.66821L5.88889 8.00007H2C1.44772 8.00007 1 8.44778 1 9.00007V15.0001C1 15.5524 1.44772 16.0001 2 16.0001ZM23 12C23 15.292 21.5539 18.2463 19.2622 20.2622L17.8445 18.8444C19.7758 17.1937 21 14.7398 21 12C21 9.26016 19.7758 6.80629 17.8445 5.15557L19.2622 3.73779C21.5539 5.75368 23 8.70795 23 12ZM18 12C18 10.0883 17.106 8.38548 15.7133 7.28673L14.2842 8.71584C15.3213 9.43855 16 10.64 16 12C16 13.36 15.3213 14.5614 14.2842 15.2841L15.7133 16.7132C17.106 15.6145 18 13.9116 18 12Z"/>',
};

/* ================= 工具 ================= */
function setSvg(el, inner) {
  el.innerHTML = inner;
}

function fmtTime(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const t = Math.floor(sec);
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

let toastTimer = null;
function toast(msg, kind) {
  els.snackbar.textContent = msg;
  els.snackbar.classList.toggle("err", kind === "err");
  els.snackbar.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.snackbar.classList.add("hidden"), 2600);
}

/* ================= 主题 ================= */
function isDarkTheme() {
  return document.documentElement.getAttribute("data-theme") !== "light";
}

function applyThemeIcon(dark) {
  setSvg(els.navThemeIcon, dark ? IC.moon : IC.sun);
  setSvg(els.lyricThemeIcon, dark ? IC.moon : IC.sun);
}

function setTheme(dark, persist) {
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  applyThemeIcon(dark);
  if (persist !== false) {
    try {
      localStorage.setItem("musicfox-theme", dark ? "dark" : "light");
    } catch (_) {}
  }
}

function toggleTheme() {
  setTheme(!isDarkTheme(), true);
  scheduleLocalSave();
}

els.navTheme.addEventListener("click", () => toggleTheme());
els.lyricTheme.addEventListener("click", () => toggleTheme());
els.navSettings.addEventListener("click", () => showSettingsView());

/* ================= 页面 / 侧栏 =================
   页面模型：搜索页、收藏页、设置页、歌单/专辑详情页同级；
   详情页顶部返回按钮回到打开前的页面 */
function setActiveNav(el) {
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  el.classList.add("active");
}

/* 搜索页当前处于 结果(results) 还是 空闲浏览(browse)；
   回到搜索页时按此状态确定显示，避免搜索栏在页面切换后丢失 */
let searchMode = "browse";

function isSearchPage() {
  return (
    els.favPanel.classList.contains("hidden") &&
    els.settingsPanel.classList.contains("hidden") &&
    els.detailPanel.classList.contains("hidden")
  );
}

function showFavoritesView() {
  if (!els.favPanel.classList.contains("hidden")) return;
  /* 兜底关闭详情页并作废未完成的详情加载 */
  detailToken++;
  detailLoading = false;
  els.detailPanel.classList.add("hidden");
  document.body.classList.remove("detail-open");
  els.searchBar.classList.add("hidden");
  els.browseArea.classList.add("hidden");
  els.resultPanel.classList.add("hidden");
  els.settingsPanel.classList.add("hidden");
  exitBatch();
  els.favPanel.classList.remove("hidden");
  renderFavorites();
  setActiveNav(els.navFav);
}

function showSearchView() {
  if (isSearchPage()) return; // 已在搜索页
  els.favPanel.classList.add("hidden");
  els.settingsPanel.classList.add("hidden");
  els.detailPanel.classList.add("hidden");
  document.body.classList.remove("detail-open");
  exitBatch();
  applySearchView();
  setActiveNav(els.navSearch);
}

/* 按当前模式呈现搜索页：搜索栏始终可见 */
function applySearchView() {
  els.searchBar.classList.remove("hidden");
  if (searchMode === "results" && curItems.length) {
    els.browseArea.classList.add("hidden");
    els.resultPanel.classList.remove("hidden");
    markPlayingRow(lastActiveId);
    syncFavBtns();
    return;
  }
  searchMode = "browse";
  els.resultPanel.classList.add("hidden");
  els.browseArea.classList.remove("hidden");
  renderHistory();
}

function showBrowseIdle() {
  els.favPanel.classList.add("hidden");
  els.settingsPanel.classList.add("hidden");
  els.detailPanel.classList.add("hidden");
  document.body.classList.remove("detail-open");
  searchMode = "browse";
  applySearchView();
  setActiveNav(els.navSearch);
}

/* 设置页：同级独立视图（保留侧边栏） */
function showSettingsView() {
  if (!els.settingsPanel.classList.contains("hidden")) return;
  detailToken++;
  detailLoading = false;
  els.detailPanel.classList.add("hidden");
  document.body.classList.remove("detail-open");
  els.favPanel.classList.add("hidden");
  els.searchBar.classList.add("hidden");
  els.browseArea.classList.add("hidden");
  els.resultPanel.classList.add("hidden");
  exitBatch();
  els.settingsPanel.classList.remove("hidden");
  paintSettingsOpts();
  setActiveNav(els.navSettings);
}

els.navFav.addEventListener("click", () => showFavoritesView());
els.navSearch.addEventListener("click", () => {
  /* 若详情页开着，先按来源正确退出（内部有隐藏守卫） */
  closeDetail();
  showSearchView();
  els.searchInput.focus();
});

function showResults() {
  searchMode = "results";
  els.browseArea.classList.add("hidden");
  els.resultPanel.classList.remove("hidden");
}

/* ================= 歌词页开合（含滑入/滑出动画） ================= */
let lyricsOpen = false;

function setLyricsOpen(open) {
  lyricsOpen = open;
  els.lyricsPage.classList.toggle("collapsed", !open);
  if (open) startLrcRect();
  else stopLrcRect();
}

els.lyricCollapse.addEventListener("click", () => setLyricsOpen(false));
els.songBtn.addEventListener("click", () => {
  if (!curSongId && !DEMO) return;
  if (lyricsOpen) setLyricsOpen(false);
  else openLyrics();
});

function openLyrics() {
  if (!curSongId && !DEMO) return;
  setLyricsOpen(true);
  if (curSongId) {
    ensureLyrics();
  } else {
    renderLyricNote("尚未开始播放", false);
  }
}

/* ================= 搜索（musicfox 式分类 + 增量加载） ================= */
const CATS = [
  { key: "song", label: "单曲" },
  { key: "playlist", label: "歌单" },
  { key: "album", label: "专辑" },
];

let curKeyword = "";
let curCat = "song";
let curItems = []; // 当前分类已加载的全部条目
let curOffset = 0;
let curMore = false;
let loadingMore = false;
let songPool = []; // 最近一次「单曲」分类结果，用于播放队列/上下曲/续播
let lastActiveId = null;
let lastShownKey = ""; // 当前已展示的 关键词|分类（防止重复请求）

function shownKey() {
  return curKeyword + "|" + curCat;
}

function switchCat(cat, needFetch) {
  if (cat === curCat && !needFetch) return;
  curCat = cat;
  els.catBar
    .querySelectorAll(".tab-item")
    .forEach((b) => b.classList.toggle("active", b.dataset.cat === cat));
  if (needFetch && curKeyword) {
    if (shownKey() !== lastShownKey) doSearch(curKeyword, cat);
  } else if (!curKeyword) {
    toast("请先输入搜索关键词");
  }
}

els.catBar.addEventListener("click", (e) => {
  const tab = e.target.closest(".tab-item[data-cat]");
  if (!tab) return;
  switchCat(tab.dataset.cat, true);
});

/* 滚动到底部自动加载下一页（代替显式按钮） */
els.trackList.addEventListener("scroll", () => {
  const el = els.trackList;
  if (
    curMore &&
    !loadingMore &&
    el.scrollTop + el.clientHeight >= el.scrollHeight - 120
  ) {
    loadMore();
  }
});

async function loadMore() {
  if (loadingMore || !curMore || !curKeyword) return;
  loadingMore = true;
  try {
    const resp = await apiSearch(curKeyword, curCat, curOffset);
    const page = resp.items || [];
    curItems = curItems.concat(page);
    curOffset += page.length;
    curMore = !!resp.more;
    lastShownKey = shownKey();
    renderResultList(
      page,
      curCat,
      true,
      curItems.length - page.length,
      curItems.length,
    );
  } catch (e) {
    toast(String(e && e.message ? e.message : e), "err");
  } finally {
    loadingMore = false;
  }
}

function showEmpty(title, sub) {
  els.trackList.innerHTML = "";
  els.empty.classList.remove("hidden");
  els.emptyTitle.textContent = title;
  els.emptySub.textContent = sub;
}

/* 搜索结果/空态内容的滑入动画（只作用于列表，不动分类按钮） */
function slideResults(fromRight) {
  const el = curItems.length ? els.trackList : els.empty;
  if (!el) return;
  el.classList.remove("list-slide", "list-slide-left");
  void el.offsetWidth;
  el.classList.add(fromRight ? "list-slide" : "list-slide-left");
}

function buildRow(item, cat, idx) {
  const row = document.createElement("div");
  const idxCell = document.createElement("span");
  idxCell.className = "col-index";
  idxCell.textContent = String(idx + 1);

  const title = document.createElement("span");
  title.className = "col-title";
  title.textContent = item.name;
  title.title = item.name;

  if (cat === "song") {
    row.className = "track-row song";
    row.dataset.id = String(item.id);
    const artist = document.createElement("span");
    artist.className = "col-artist";
    artist.textContent =
      item.artists || (item.sub && item.sub.split(" · ")[0]) || "";
    artist.title = artist.textContent;
    const dur = document.createElement("span");
    dur.className = "col-duration";
    dur.textContent = fmtTime(item.duration);
    row.append(idxCell, title, artist, dur);
    attachHeart(row, item, "song");
    row.addEventListener("click", () => {
      anchorRandomPick(item.id, false);
      playSong(item.id, item.name);
    });
  } else {
    row.className = "track-row list";
    row.dataset.id = String(item.id);
    row.dataset.key = cat + ":" + item.id;
    const sub = document.createElement("span");
    sub.className = "col-sub";
    sub.textContent = item.sub || "";
    sub.title = item.sub || "";
    row.append(idxCell, title, sub);
    attachHeart(row, item, cat);
    row.addEventListener("click", () => openDetail(cat, item));
  }
  return row;
}

function renderResultList(items, cat, append, baseIndex, totalCount) {
  if (!append) {
    els.trackList.innerHTML = "";
    els.empty.classList.add("hidden");
    els.trackList.scrollTop = 0;
  }
  const base = baseIndex || 0;
  items.forEach((it, i) =>
    els.trackList.appendChild(buildRow(it, cat, base + i)),
  );
  markPlayingRow(lastActiveId);
  syncFavBtns();
}

async function doSearch(keyword, cat) {
  const kw = (keyword != null ? keyword : els.searchInput.value).trim();
  if (!kw) return;
  const catIdx = { song: 0, playlist: 1, album: 2 };
  const prevIdx = catIdx[curCat] || 0;
  els.searchInput.value = kw;
  syncSearchClear();
  if (cat && cat !== curCat) switchCat(cat, false);
  const fromRight = (catIdx[curCat] || 0) >= prevIdx;
  curKeyword = kw;
  curOffset = 0;
  lastShownKey = shownKey();
  try {
    const resp = await apiSearch(kw, curCat, 0);
    curItems = resp.items || [];
    curOffset = curItems.length;
    curMore = !!resp.more;
    renderResultList(curItems, curCat, false);
    showResults();
    slideResults(fromRight);
    setActiveNav(els.navSearch);
    if (curCat === "song" && curItems.length) {
      songPool = curItems.map((it) => ({
        id: it.id,
        name: it.name,
        artists: it.sub ? it.sub.split(" · ")[0] : "",
        album: it.sub ? it.sub.split(" · ")[1] : "",
        duration: it.duration,
        picUrl: it.picUrl || "",
      }));
    }
    updateQueue();
    addHistory(kw);
    const label = CATS.find((c) => c.key === curCat)?.label || "";
    if (!curItems.length) {
      showEmpty(`没有找到相关${label}`, "换个关键词试试吧");
      return;
    }
    toast(
      curCat === "song"
        ? `找到 ${curItems.length} 首歌曲`
        : `找到 ${curItems.length} 条${label}`,
    );
  } catch (e) {
    toast(String(e && e.message ? e.message : e), "err");
  }
}

els.searchBtn.addEventListener("click", () => doSearch());
els.searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") doSearch();
});

function syncSearchClear() {
  els.searchClear.classList.toggle("hidden", !els.searchInput.value.trim());
}
els.searchInput.addEventListener("input", syncSearchClear);
els.searchClear.addEventListener("click", () => {
  els.searchInput.value = "";
  syncSearchClear();
  showBrowseIdle();
  els.searchInput.focus();
});

/* ================= 历史搜索（localStorage，最多 20 条，最新在前） ================= */
const HIST_KEY = "musicfox-search-history";
let searchHistory = [];

function loadHistory() {
  try {
    const arr = JSON.parse(localStorage.getItem(HIST_KEY) || "[]");
    searchHistory = Array.isArray(arr) ? arr.map(String).filter(Boolean) : [];
  } catch (_) {
    searchHistory = [];
  }
  // 去重并保留顺序
  searchHistory = searchHistory
    .filter((k, i) => searchHistory.indexOf(k) === i)
    .slice(0, 20);
}

function saveHistory() {
  try {
    localStorage.setItem(HIST_KEY, JSON.stringify(searchHistory));
  } catch (_) {}
}

function renderHistory() {
  loadHistory();
  if (!els.histList) return;
  els.histList.innerHTML = "";
  els.histEmpty.classList.toggle("hidden", searchHistory.length > 0);
  els.histClear.classList.toggle("hidden", searchHistory.length === 0);
  searchHistory.forEach((kw) => {
    const tag = document.createElement("div");
    tag.className = "tag";
    const text = document.createElement("span");
    text.textContent = kw;
    text.title = kw;
    const x = document.createElement("button");
    x.type = "button";
    x.className = "tag-x";
    x.title = "删除该记录";
    x.innerHTML =
      '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
    tag.append(text, x);
    tag.addEventListener("click", () => doSearch(kw, "song"));
    x.addEventListener("click", (ev) => {
      ev.stopPropagation();
      searchHistory = searchHistory.filter((h) => h !== kw);
      saveHistory();
      renderHistory();
    });
    els.histList.appendChild(tag);
  });
}

function addHistory(kw) {
  const key = String(kw || "").trim();
  if (!key) return;
  if (searchHistory[0] === key) return; // 已是最近一条，无需重复
  searchHistory = [key]
    .concat(searchHistory.filter((h) => h !== key))
    .slice(0, 20);
  saveHistory();
}

els.histClear.addEventListener("click", () => {
  searchHistory = [];
  saveHistory();
  renderHistory();
  toast("已清空搜索历史");
});

/* ================= 收藏（歌曲/歌单/专辑，持久化到 favorites.csv） ================= */
let favorites = [];
let favBatch = false;
const favSel = new Set(); // 选中项，存收藏键 type:id
let favTab = "song";

function favType(f) {
  return f.type || "song";
}

function favKey(f) {
  return favType(f) + ":" + f.id;
}

function favDto(item, type) {
  const sub = item.sub || "";
  const parts = sub.split(" · ");
  const base = {
    id: item.id,
    name: item.name,
    picUrl: item.picUrl || "",
    duration: item.duration || 0,
  };
  if (type === "playlist") {
    return {
      ...base,
      type: "playlist",
      artists: item.artists || "",
      album: item.album || sub,
    };
  }
  if (type === "album") {
    return {
      ...base,
      type: "album",
      artists: item.artists || parts[0] || "",
      album: item.album || parts[1] || sub,
    };
  }
  return {
    ...base,
    type: "song",
    artists: item.artists || parts[0] || "",
    album: item.album || parts[1] || "",
  };
}

function isFaved(id, type) {
  const t = type || "song";
  return favorites.some((f) => favType(f) === t && f.id === id);
}

function toggleFav(item, type) {
  const t = type || favType(item);
  const dto = favDto(item, t);
  const i = favorites.findIndex((f) => favType(f) === t && f.id === dto.id);
  if (i >= 0) favorites.splice(i, 1);
  else favorites.unshift(dto);
  persistFavs();
  syncFavBtns();
  updateFavCount();
  paintDetailFav();
  if (!els.favPanel.classList.contains("hidden")) renderFavorites();
}

const HEART_SVG =
  '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>';

/* dislike（断心）图标，取自 assets/svg/dislike-fill.svg */
const DISLIKE_SVG =
  '<path d="M2.80777 1.3934L21.1925 19.7782L19.7783 21.1924L16.0316 17.4454L12 21.485L3.52154 12.993C1.48186 10.7094 1.49309 7.24014 3.55524 4.96959L1.39355 2.80762L2.80777 1.3934ZM20.2428 4.75736C22.5054 7.02472 22.5831 10.637 20.4788 12.993L18.8442 14.629L7.2604 3.04551C8.92926 2.83935 10.6682 3.33369 12.0011 4.52853C14.3502 2.42 17.9802 2.49 20.2428 4.75736Z"/>';

function attachHeart(row, item, type) {
  const t = type || "song";
  const b = document.createElement("button");
  b.type = "button";
  b.className = "row-heart";
  b.dataset.key = t + ":" + item.id;
  b.title = "收藏/取消收藏";
  b.innerHTML = `<svg viewBox="0 0 24 24">${HEART_SVG}</svg>`;
  b.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFav(item, t);
  });
  row.appendChild(b);
  return b;
}

function syncFavBtns() {
  document.querySelectorAll(".row-heart").forEach((b) => {
    const idx = String(b.dataset.key).indexOf(":");
    const t = idx > 0 ? String(b.dataset.key).slice(0, idx) : "song";
    const id = Number(String(b.dataset.key).slice(idx + 1));
    b.classList.toggle("faved", isFaved(id, t));
  });
}

function updateFavCount() {
  const count = (t) => favorites.filter((f) => favType(f) === t).length;
  if (els.favCount) els.favCount.textContent = String(count("song"));
  if (els.favPlaylistCount)
    els.favPlaylistCount.textContent = String(count("playlist"));
  if (els.favAlbumCount) els.favAlbumCount.textContent = String(count("album"));
}

function renderFavorites() {
  els.favList.innerHTML = "";
  updateFavCount();
  const list = favorites.filter((f) => favType(f) === favTab);
  const labels = { song: "歌曲", playlist: "歌单", album: "专辑" };
  const emptyTitle = els.favEmpty.querySelector(".empty-title");
  if (emptyTitle) emptyTitle.textContent = `还没有收藏的${labels[favTab]}`;
  els.favEmpty.classList.toggle("hidden", list.length > 0);
  els.favList.classList.toggle("batch", favBatch);
  if (!list.length) return;
  list.forEach((s, i) => {
    const isSong = favType(s) === "song";
    const row = document.createElement("div");
    row.className =
      "fav-row" +
      (isSong && s.id === lastActiveId ? " playing" : "") +
      (favSel.has(favKey(s)) ? " selected" : "");
    row.dataset.id = String(s.id);
    row.dataset.key = favKey(s);

    const check = document.createElement("span");
    check.className = "fav-check";
    check.innerHTML = `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;

    const idx = document.createElement("span");
    idx.className = "fav-index";
    idx.textContent = String(i + 1).padStart(2, "0");

    const name = document.createElement("span");
    name.className = "fav-name";
    name.textContent = s.name;
    name.title = s.name;

    const artist = document.createElement("span");
    artist.className = "fav-artist";
    artist.textContent = s.artists || "";
    artist.title = s.artists || "";

    const album = document.createElement("span");
    album.className = "fav-album";
    album.textContent = s.album || "";
    album.title = s.album || "";

    const dur = document.createElement("span");
    dur.className = "fav-duration";
    dur.textContent = isSong ? fmtTime(s.duration) : "";

    const heart = document.createElement("button");
    heart.type = "button";
    heart.className = "fav-heart";
    heart.title = "取消收藏";
    /* 悬浮行时心形换为 dislike（断心）图标，提示点击即取消收藏 */
    heart.innerHTML =
      `<svg class="ic-heart" viewBox="0 0 24 24">${HEART_SVG}</svg>` +
      `<svg class="ic-dislike" viewBox="0 0 24 24">${DISLIKE_SVG}</svg>`;
    heart.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFav(s, favType(s));
    });

    row.append(check, idx, name, artist, album, dur, heart);
    row.addEventListener("click", () => {
      if (favBatch) {
        const k = favKey(s);
        if (favSel.has(k)) favSel.delete(k);
        else favSel.add(k);
        row.classList.toggle("selected", favSel.has(k));
      } else if (isSong) {
        songPool = favorites.filter((f) => favType(f) === "song");
        updateQueue();
        anchorRandomPick(s.id, false);
        playSong(s.id, s.name);
      } else {
        openDetail(favType(s), {
          id: s.id,
          name: s.name,
          album: s.album || "",
          artists: s.artists || "",
        });
      }
    });
    els.favList.appendChild(row);
  });
}

function enterBatch() {
  favBatch = true;
  favSel.clear();
  els.favToolbar.classList.remove("hidden");
  els.favManage.querySelector("span").textContent = "退出管理";
  renderFavorites();
}

function exitBatch() {
  favBatch = false;
  favSel.clear();
  els.favToolbar.classList.add("hidden");
  els.favManage.querySelector("span").textContent = "批量管理";
  renderFavorites();
}

els.favManage.addEventListener("click", () => {
  if (favBatch) exitBatch();
  else enterBatch();
});
els.favDone.addEventListener("click", exitBatch);
els.favSelectAll.addEventListener("click", () => {
  const list = favorites.filter((f) => favType(f) === favTab);
  const allSel = list.length > 0 && list.every((f) => favSel.has(favKey(f)));
  if (allSel) list.forEach((f) => favSel.delete(favKey(f)));
  else list.forEach((f) => favSel.add(favKey(f)));
  renderFavorites();
});
els.favPlaySel.addEventListener("click", () => {
  const picked = favorites.filter(
    (f) => favType(f) === "song" && favSel.has(favKey(f)),
  );
  if (!picked.length) {
    toast("请先勾选要播放的歌曲");
    return;
  }
  songPool = picked;
  updateQueue();
  anchorRandomPick(picked[0].id, true);
  playSong(picked[0].id, picked[0].name, true);
});
els.favRemoveSel.addEventListener("click", () => {
  if (!favSel.size) {
    toast("请先勾选要移除的条目");
    return;
  }
  favorites = favorites.filter((f) => !favSel.has(favKey(f)));
  favSel.clear();
  persistFavs();
  syncFavBtns();
  renderFavorites();
});
document.querySelectorAll(".tab-item[data-favtab]").forEach((t) => {
  t.addEventListener("click", () => {
    if (favTab === t.dataset.favtab) return;
    favTab = t.dataset.favtab;
    document
      .querySelectorAll(".tab-item[data-favtab]")
      .forEach((x) => x.classList.toggle("active", x === t));
    renderFavorites();
  });
});

/* 本地持久化（设置 + 收藏） */
let saveTimer = null;
function persistFavs() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persistLocal, 250);
}
function scheduleLocalSave() {
  persistFavs();
}
function persistLocal() {
  const state = {
    theme: isDarkTheme() ? "dark" : "light",
    volume,
    favorites,
    bufferMB: bufMB,
    quality: qualitySel,
    volumeNorm,
  };
  if (go) {
    try {
      go.SaveState(state);
    } catch (_) {}
  } else {
    try {
      localStorage.setItem("musicfox-fav", JSON.stringify(state));
    } catch (_) {}
  }
}

/* ================= 设置页（歌曲音质 / 缓冲区大小） ================= */
const QUALITY_LABELS = {
  standard: "标准",
  higher: "较高",
  exhigh: "极高",
};
const BUFFER_CHOICES = [256, 512, 1024, 2048];

let qualitySel = "higher"; // 音质 key（standard/higher/exhigh）
let bufMB = 512; // 缓冲区大小上限（MB）
let volumeNorm = false; // 音量归一化：输出限制在安全区间

function paintSettingsOpts() {
  if (!els.setQualityOpts) return;
  els.setQualityOpts
    .querySelectorAll(".opt-pill")
    .forEach((b) => b.classList.toggle("active", b.dataset.q === qualitySel));
  els.setBufferOpts
    .querySelectorAll(".opt-pill")
    .forEach((b) => b.classList.toggle("active", Number(b.dataset.mb) === bufMB));
  if (els.setNormOpts) {
    els.setNormOpts
      .querySelectorAll(".opt-pill")
      .forEach((b) =>
        b.classList.toggle(
          "active",
          b.dataset.norm === (volumeNorm ? "on" : "off"),
        ),
      );
  }
}

function applyQuality(q) {
  if (!QUALITY_LABELS[q]) return;
  qualitySel = q;
  paintSettingsOpts();
  persistLocal();
  toast(`歌曲音质已切换为「${QUALITY_LABELS[q]}」，对之后播放的歌曲生效`);
}

function applyBuffer(mb) {
  mb = Number(mb);
  if (BUFFER_CHOICES.indexOf(mb) < 0) return;
  bufMB = mb;
  paintSettingsOpts();
  persistLocal();
  toast(
    `歌曲缓冲区上限已设为 ${mb >= 1024 ? mb / 1024 + " GB" : mb + " MB"}`,
  );
}

els.setQualityOpts.addEventListener("click", (e) => {
  const b = e.target.closest(".opt-pill[data-q]");
  if (b) applyQuality(b.dataset.q);
});
els.setBufferOpts.addEventListener("click", (e) => {
  const b = e.target.closest(".opt-pill[data-mb]");
  if (b) applyBuffer(b.dataset.mb);
});

function applyVolumeNorm(on) {
  volumeNorm = !!on;
  paintSettingsOpts();
  persistLocal();
  if (go) {
    try {
      go.SetVolumeNorm(volumeNorm);
    } catch (_) {}
  }
  toast(
    volumeNorm
      ? "音量归一化已开启：输出音量限制在安全区间"
      : "音量归一化已关闭",
  );
}

els.setNormOpts.addEventListener("click", (e) => {
  const b = e.target.closest(".opt-pill[data-norm]");
  if (!b) return;
  const on = b.dataset.norm === "on";
  if (on === volumeNorm) return;
  applyVolumeNorm(on);
});

/* ================= 会话续播（记录最近一次播放的列表/歌单队列） ================= */
let resumeReady = false; // 启动时存在上次会话：点播放按钮续播
let resumeSeekPos = 0;
let sessionLivePos = 0;
let sessionTimer = null;
let lastSessionSaveAt = 0;

function songDto(s) {
  return {
    id: s.id,
    name: s.name || "",
    artists: s.artists || "",
    album: s.album || "",
    picUrl: s.picUrl || "",
    duration: s.duration || 0,
  };
}

function snapshotSession(position) {
  return {
    queue: (songPool || [])
      .filter((s) => s && s.id && s.name)
      .map(songDto),
    currentId: curSongId || 0,
    position: position || 0,
    random: randomMode,
    singleLoop: singleLoop,
  };
}

function persistSessionNow(position) {
  if (!curSongId || !songPool.length) return;
  if (position != null && position >= 0) sessionLivePos = position;
  const snap = snapshotSession(sessionLivePos);
  if (go) {
    try {
      go.SaveSession(snap);
    } catch (_) {}
  } else {
    try {
      localStorage.setItem("musicfox-session", JSON.stringify(snap));
    } catch (_) {}
  }
}

function scheduleSessionSave(position) {
  if (position != null && position >= 0) sessionLivePos = position;
  clearTimeout(sessionTimer);
  sessionTimer = setTimeout(() => {
    persistSessionNow(sessionLivePos);
    lastSessionSaveAt = Date.now();
  }, 1200);
}

/* 启动时还原上次会话的界面展示：歌曲信息 + 队列 + 播放模式；点播放才真正开播 */
function applySavedSession(sess) {
  if (!sess || !sess.currentId || !Array.isArray(sess.queue) || !sess.queue.length) return;
  const queue = sess.queue.map(songDto).filter((s) => s.id);
  const cur = queue.find((s) => s.id === sess.currentId) || queue[0];
  if (!cur) return;
  songPool = queue;
  if (typeof sess.random === "boolean") randomMode = sess.random;
  if (typeof sess.singleLoop === "boolean") singleLoop = sess.singleLoop;
  paintMode();
  updateQueue();
  resumeReady = true;
  resumeSeekPos = sess.position > 5 ? sess.position : 0;
  curSongId = cur.id;
  curSongName = cur.name;
  curSongArtist = cur.artists || "";
  curSongAlbum = cur.album || "";
  curSongPic = cur.picUrl || "";
  lastActiveId = cur.id;
  curDuration = cur.duration || 0;
  els.songTitle.textContent = cur.name || "上次播放";
  els.songArtist.textContent = cur.artists
    ? `${cur.artists} · ${cur.album || ""}`
    : "点击播放继续上次的播放";
  els.playBtn.disabled = false;
  els.prevBtn.disabled = queue.length === 0;
  els.nextBtn.disabled = queue.length === 0;
  els.progressHandle.style.display = "";
  progressCtl.setRatio(
    curDuration && resumeSeekPos ? clamp01(resumeSeekPos / curDuration) : 0,
  );
  applyCover(cur.picUrl);
}

/* 点播放按钮续播上次会话：播放完成后按保存的进度跳转 */
async function resumePlay() {
  const id = curSongId;
  const name = curSongName;
  const pos = resumeSeekPos;
  resumeReady = false;
  resumeSeekPos = 0;
  paintPlayIcon(true);
  uiPlaying = true;
  anchorRandomPick(id, true);
  await playSong(id, name, true);
  if (pos > 3) {
    setTimeout(async () => {
      try {
        if (DEMO) {
          demoPosition = Math.min(pos, curDuration || pos);
          return;
        }
        await go.Seek(pos);
      } catch (_) {}
    }, 900);
  }
}

function markPlayingRow(id) {
  [els.trackList, els.detailList, els.favList].forEach((list) => {
    list
      .querySelectorAll(
        ".track-row.playing, .song-item.playing, .fav-row.playing",
      )
      .forEach((r) => r.classList.remove("playing"));
    if (id == null) return;
    const row = list.querySelector(`[data-id="${id}"]`);
    /* 歌单/专辑行（带非 song 键）不参与播放高亮，避免同 id 误高亮 */
    if (row && (!row.dataset.key || row.dataset.key.startsWith("song:")))
      row.classList.add("playing");
  });
  /* 切歌后把当前可见列表自动滚动到高亮行（歌单/专辑/搜索/收藏页都适用） */
  revealPlayingRow(id);
}

/* 把可见列表滚动到当前播放行，让其在可视区居中；避免自动切歌后行在屏幕外 */
function revealPlayingRow(id) {
  if (id == null) return;
  const lists = [els.trackList, els.detailList, els.favList];
  for (const el of lists) {
    if (!el || el.closest(".hidden") != null) continue;
    const row = el.querySelector(".playing");
    if (!row || !row.isConnected) continue;
    const containerTop = el.getBoundingClientRect().top;
    const containerH = el.clientHeight;
    const rowTop = row.getBoundingClientRect().top;
    const rowH = row.getBoundingClientRect().height || 30;
    const target = Math.round(el.scrollTop + (rowTop - containerTop) - (containerH - rowH) / 2);
    const max = el.scrollHeight - containerH;
    const clamped = Math.min(Math.max(target, 0), Math.max(max, 0));
    if (Math.abs(el.scrollTop - clamped) > 2) el.scrollTop = clamped;
    return; // 每次只滚动当前可见的那一个列表
  }
}

/* ================= 播放 ================= */
let playToken = 0;
let playGuardUntil = 0; // 乐观切歌后的保护窗口，期间忽略后端旧歌曲状态回写

async function playSong(id, name, force) {
  if (!force && curSongId && id === curSongId) return;
  const token = ++playToken;
  const s = songPool.find((x) => x.id === id);
  lastActiveId = id;
  markPlayingRow(id);

  /* 乐观更新：点击后立即把底部栏/封面/歌词页切到这首歌，不等后端真正开播；
     后端确认前 applyStatus 不回写旧歌状态（playGuardUntil），超时则自愈 */
  curSongId = id;
  curSongName = (s && s.name) || name || "";
  curSongArtist = (s && s.artists) || "";
  curSongAlbum = (s && s.album) || "";
  curSongPic = (s && s.picUrl) || "";
  /* 找不到歌曲信息时不预写 lastSongId，留待后端确认后补全/失败时完整回退 */
  lastSongId = s ? id : null;
  playGuardUntil = Date.now() + 8000; // 后端会等切换完成才返回，窗口需覆盖解析+预检+开播耗时
  uiPlaying = true;
  paintPlayIcon(true);
  els.songTitle.textContent = curSongName;
  els.songArtist.textContent = s
    ? (s.artists || "") + " · " + (s.album || "")
    : "";
  curDuration = s ? s.duration || 0 : 0;
  curPos = 0;
  seekGuardUntil = 0;
  els.progressHandle.style.display = "";
  progressCtl.setRatio(0);
  applyCover(curSongPic);
  lyricLines = [];
  activeLrcIdx = -1;
  lyricLoading = false;
  lyricCache.delete(id);
  updateQueue();
  if (lyricsOpen) {
    renderLyricNote("正在加载歌词…", true);
    ensureLyrics();
  }
  try {
    const res = await apiPlaySong(id);
    if (token !== playToken) return;
    /* 后端判定无法播放（无版权/需会员/地址失效/超时）时返回 skip，
       提示后自动切到下一首；DEMO 路径返回 undefined，需判 res 存在 */
    if (res && res.ok === false) {
      if (res.message) toast(res.message, "err");
      if (res.skip) autoSkip(id);
      return;
    }
  } catch (e) {
    if (token === playToken)
      toast(String(e && e.message ? e.message : e), "err");
    return;
  }
  if (token !== playToken) return;
  skipChain = 0;
  updateQueue();
  if (!DEMO) toast(`正在播放：${name || (s && s.name) || ""}`);
}

let skipChain = 0; // 连续无法播放的计数，超过列表长度时停止自动切换

/* 当前歌曲无法播放时自动切到列表中的下一首（循环）；
   连续跳过超过列表长度说明整表都不可播，停止避免死循环 */
function autoSkip(failedId) {
  skipChain++;
  if (songPool.length <= 1 || skipChain >= songPool.length) {
    skipChain = 0;
    if (songPool.length > 1) toast("连续多首歌曲无法播放，已停止自动切换");
    return;
  }
  const idx = songPool.findIndex((x) => x.id === failedId);
  let next = null;
  if (randomMode && songPool.length > 1) {
    next = randomNeighborIdx(1, idx >= 0 ? idx : 0);
    if (next != null) next = songPool[next];
  } else if (idx >= 0) {
    next = songPool[(idx + 1) % songPool.length];
  }
  if (!next || next.id === failedId) {
    skipChain = 0;
    return;
  }
  toast(`《${curSongName || "该歌曲"}》无法播放，自动切换下一首`);
  playSong(next.id, next.name);
}

let uiPlaying = false;
let toggleGuardUntil = 0; // 用户点击播放/暂停后的保护窗口，期间忽略后端旧状态回写

async function togglePlay() {
  if (!hasSongReady()) return;
  if (resumeReady) {
    resumePlay(); // 上次会话：点击播放 = 续播
    return;
  }
  uiPlaying = !uiPlaying;
  paintPlayIcon(uiPlaying); // 图标立刻翻转，不等后端
  toggleGuardUntil = Date.now() + 1000;
  try {
    if (DEMO) {
      demoPlaying = uiPlaying;
      return;
    }
    await go.Toggle();
  } catch (_) {}
}

function paintPlayIcon(playing) {
  setSvg(els.playIcon, playing ? IC.pause : IC.play);
  els.playBtn.title = playing ? "暂停" : "播放";
}

function playNeighbor(delta) {
  if (!songPool.length) return;
  let idx = songPool.findIndex((s) => s.id === lastActiveId);
  if (idx < 0) idx = 0;
  /* 随机播放模式下沿洗牌序列前进/回退，而非固定 ±1 */
  if (randomMode && songPool.length > 1) {
    const nxt = randomNeighborIdx(delta, idx);
    if (nxt != null) {
      playAt(nxt, true);
      return;
    }
  }
  const next = idx + delta;
  if (next < 0 || next >= songPool.length) return;
  playSong(songPool[next].id, songPool[next].name);
}

let randomMode = false;
let singleLoop = false;

/* ---- 随机播放（洗牌序列） ----
   随机开启时维护一个整表的随机播放顺序：当前曲位于 shuffleSeq[shufflePos]，
   下一首/自动续播沿序列前进，上一首沿历史回退；一轮放完自动重洗继续，
   与顺序模式一样作用于整个播放列表（歌单/专辑/收藏/搜索结果均适用）。 */
let shuffleSeq = null; // number[]：songPool 下标组成的随机播放顺序
let shufflePos = -1; // 当前曲在 shuffleSeq 中的位置
let shuffleHistory = []; // 随机模式下已跳过的曲目下标（最近的在末尾，用于上一首）

function shuffleIndices(n) {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
}

/* 歌单里可能同一首歌出现多次：洗牌后避免相邻两项是同曲（会显得“随机重了”） */
function avoidAdjacentSameId(seq) {
  const n = seq.length;
  for (let k = 0; k < n - 1; k++) {
    const id = songPool[seq[k]] && songPool[seq[k]].id;
    if (!id || (songPool[seq[k + 1]] && songPool[seq[k + 1]].id !== id)) {
      continue;
    }
    for (let m = k + 2; m < n; m++) {
      if (!songPool[seq[m]] || songPool[seq[m]].id !== id) {
        const t = seq[k + 1];
        seq[k + 1] = seq[m];
        seq[m] = t;
        break;
      }
    }
  }
  return seq;
}

function poolIndexOf(id) {
  if (id == null) return -1;
  return songPool.findIndex((s) => s.id === id);
}

function clearShuffleState() {
  shuffleSeq = null;
  shufflePos = -1;
  shuffleHistory = [];
}

/* 随机模式下把 poolIdx 这首歌作为当前曲并重新洗牌（手动点歌/换列表/刚开启随机时） */
function anchorShuffleAt(poolIdx) {
  const n = songPool.length;
  if (n <= 1 || poolIdx < 0 || poolIdx >= n) {
    clearShuffleState();
    return;
  }
  const seq = avoidAdjacentSameId(shuffleIndices(n));
  const p = seq.indexOf(poolIdx);
  if (p > 0) {
    seq[p] = seq[0];
    seq[0] = poolIdx;
    avoidAdjacentSameId(seq); // 首曲固定后重查一遍相邻同曲
  }
  shuffleSeq = seq;
  shufflePos = 0;
  shuffleHistory = [];
}

/* 确保随机序列与当前队列长度一致；不一致时以当前曲为起点重建 */
function ensureShuffleReady() {
  if (!randomMode) return;
  const n = songPool.length;
  if (n <= 1) {
    clearShuffleState();
    return;
  }
  if (
    shuffleSeq &&
    shuffleSeq.length === n &&
    shufflePos >= 0 &&
    shufflePos < n &&
    shuffleSeq[shufflePos] >= 0 &&
    shuffleSeq[shufflePos] < n
  ) {
    return;
  }
  anchorShuffleAt(poolIndexOf(lastActiveId));
}

/* 随机模式下从当前曲向前/向后取下一首的下标；返回 null 表示不可切 */
function randomNeighborIdx(dir, curPoolIdx) {
  const n = songPool.length;
  if (n <= 1) return null;
  ensureShuffleReady();
  if (!shuffleSeq) return null;
  if (curPoolIdx >= 0 && shuffleSeq[shufflePos] !== curPoolIdx) {
    const p = shuffleSeq.indexOf(curPoolIdx);
    if (p >= 0) shufflePos = p;
  }
  if (dir > 0) {
    shuffleHistory.push(shuffleSeq[shufflePos]);
    if (shuffleHistory.length > 128) shuffleHistory.shift();
    let pos = shufflePos + 1;
    if (pos >= n) {
      // 一轮放完：重洗开启新的一轮，避免紧接着重复刚播完的这首
      const lastIdx = shuffleSeq[shufflePos];
      const lastId = songPool[lastIdx] && songPool[lastIdx].id;
      shuffleSeq = avoidAdjacentSameId(shuffleIndices(n));
      if (lastId != null && n > 1 && songPool[shuffleSeq[0]] && songPool[shuffleSeq[0]].id === lastId) {
        for (let m = 1; m < n; m++) {
          if (!songPool[shuffleSeq[m]] || songPool[shuffleSeq[m]].id !== lastId) {
            const t = shuffleSeq[0];
            shuffleSeq[0] = shuffleSeq[m];
            shuffleSeq[m] = t;
            break;
          }
        }
        avoidAdjacentSameId(shuffleSeq);
      }
      pos = 0;
    }
    shufflePos = pos;
    return shuffleSeq[pos];
  }
  // dir < 0：优先回退已播历史
  if (shuffleHistory.length) {
    const target = shuffleHistory.pop();
    const p = shuffleSeq.indexOf(target);
    if (p >= 0) {
      shufflePos = p;
      return target;
    }
    anchorShuffleAt(target);
    return target;
  }
  return null; // 本轮开头，无可回退
}

/* 手动选择某首歌开播时，让随机序列以其为新起点（当前曲不重复播放） */
function anchorRandomPick(id, force) {
  if (!randomMode) return;
  if (!force && curSongId && id === curSongId) return;
  const poolIdx = poolIndexOf(id);
  if (poolIdx >= 0) anchorShuffleAt(poolIdx);
}

/* 底部控制栏：先应用按钮状态/图标，再执行逻辑（避免等后端动作完成才反馈） */
function pressFx(btn) {
  btn.classList.add("active");
  clearTimeout(btn._fx);
  btn._fx = setTimeout(() => btn.classList.remove("active"), 160);
}

function paintMode() {
  if (randomMode) {
    setSvg(els.modeIcon, IC.shuffle);
    els.modeBtn.title = "播放顺序：随机播放（点击切换为顺序播放）";
  } else {
    setSvg(els.modeIcon, IC.order);
    els.modeBtn.title = "播放顺序：顺序播放（点击切换为随机播放）";
  }
  if (singleLoop) {
    setSvg(els.repeatIcon, IC.repeatOne);
    els.repeatBtn.title = "循环：单曲循环（点击切换为列表循环）";
  } else {
    setSvg(els.repeatIcon, IC.repeat);
    els.repeatBtn.title = "循环：列表循环（点击切换为单曲循环）";
  }
}

els.modeBtn.addEventListener("click", (e) => {
  randomMode = !randomMode;
  paintMode(); // 图标立即切换
  if (randomMode) {
    // 开启随机：以当前曲为起点生成随机播放顺序
    const curPoolIdx = poolIndexOf(lastActiveId);
    if (curPoolIdx >= 0) anchorShuffleAt(curPoolIdx);
  } else {
    clearShuffleState();
  }
  persistSessionNow(sessionLivePos);
  pressFx(els.modeBtn);
  e.preventDefault?.();
});
els.repeatBtn.addEventListener("click", (e) => {
  singleLoop = !singleLoop;
  paintMode(); // 图标立即切换
  persistSessionNow(sessionLivePos);
  pressFx(els.repeatBtn);
  e.preventDefault?.();
});

function autoAdvance() {
  if (!songPool.length || lastActiveId == null) return;
  const idx = songPool.findIndex((s) => s.id === lastActiveId);
  if (idx < 0) return;
  const n = songPool.length;
  if (singleLoop) {
    playAt(idx, true);
  } else if (randomMode && n > 1) {
    const nxt = randomNeighborIdx(1, idx);
    if (nxt != null) playAt(nxt, true);
  } else {
    playAt((idx + 1) % n, true);
  }
}

function playAt(idx, force) {
  const s = songPool[idx];
  if (s) playSong(s.id, s.name, force);
}

els.playBtn.addEventListener("click", (e) => {
  togglePlay(); // 图标先翻转再请求后端
  pressFx(els.playBtn);
  e.preventDefault?.();
});
els.prevBtn.addEventListener("click", (e) => {
  pressFx(els.prevBtn);
  playNeighbor(-1);
  e.preventDefault?.();
});
els.nextBtn.addEventListener("click", (e) => {
  pressFx(els.nextBtn);
  playNeighbor(1);
  e.preventDefault?.();
});

function hasSongReady() {
  return !!(DEMO || curSongId);
}

/* ================= 播放列表弹层 ================= */
function updateQueue() {
  els.queueTitle.textContent = `播放列表（${songPool.length}）`;
  els.queueBadge.classList.toggle("hidden", songPool.length === 0);
  els.queueBadge.textContent = String(songPool.length);
  if (!els.queuePop.classList.contains("hidden")) renderQueue();
}

function renderQueue() {
  els.queueList.innerHTML = "";
  if (!songPool.length) {
    const empty = document.createElement("div");
    empty.className = "queue-empty";
    empty.textContent = "暂无播放列表，请先搜索单曲";
    els.queueList.appendChild(empty);
    return;
  }
  songPool.forEach((s, i) => {
    const item = document.createElement("div");
    item.className = "queue-item";
    item.dataset.id = String(s.id);
    if (s.id === lastActiveId) item.classList.add("active");

    const title = document.createElement("span");
    title.className = "q-title";
    title.textContent = `${i + 1}. ${s.name}`;
    title.title = s.name;

    const artist = document.createElement("span");
    artist.className = "q-artist";
    artist.textContent = s.artists || "";

    item.append(title, artist);
    item.addEventListener("click", () => {
      anchorRandomPick(s.id, false);
      playSong(s.id, s.name);
      closePops();
    });
    els.queueList.appendChild(item);
  });
}

function closePops() {
  els.queuePop.classList.add("hidden");
}

els.queueBtn.addEventListener("click", () => {
  const willOpen = els.queuePop.classList.contains("hidden");
  closePops();
  if (willOpen) {
    els.queuePop.classList.remove("hidden");
    renderQueue();
  }
});
els.queueClose.addEventListener("click", closePops);
document.addEventListener("pointerdown", (e) => {
  if (e.target.closest("#queueWrap")) return;
  closePops();
});

/* ================= rail 滑块 ================= */
function bindRail(rail, fill, handlers) {
  let active = false;
  let ratio = 0;
  const ratioFromEvent = (e) => {
    const rect = rail.getBoundingClientRect();
    return clamp01((e.clientX - rect.left) / rect.width);
  };
  const setRatio = (r) => {
    ratio = clamp01(r);
    fill.style.width = `${ratio * 100}%`;
  };
  const down = (e) => {
    if (rail.classList.contains("disabled")) return;
    active = true;
    rail.classList.add("dragging");
    rail.setPointerCapture?.(e.pointerId);
    setRatio(ratioFromEvent(e));
    handlers.onMove?.(ratio, e);
  };
  const move = (e) => {
    if (!active) return;
    setRatio(ratioFromEvent(e));
    handlers.onMove?.(ratio, e);
  };
  const up = (e) => {
    if (!active) return;
    active = false;
    rail.classList.remove("dragging");
    rail.releasePointerCapture?.(e.pointerId);
    handlers.onCommit?.(ratio);
  };
  rail.addEventListener("pointerdown", down);
  rail.addEventListener("pointermove", move);
  rail.addEventListener("pointerup", up);
  rail.addEventListener("pointercancel", up);
  return { setRatio };
}

let curDuration = 0;
let curPos = 0; // 最近一次已知的播放进度（秒），键盘 ←→ 调整的基准
let seekGuardUntil = 0; // 键盘调进度后的保护窗口，期间忽略旧进度回写
let progressDrag = false;

const progressCtl = bindRail(els.progressTrack, els.progressFill, {
  onMove(ratio, e) {
    progressDrag = true;
    if (curDuration > 0) tipAt(e, ratio);
  },
  onCommit(ratio) {
    setTimeout(() => (progressDrag = false), 60);
    if (curDuration > 0) seekTo(ratio * curDuration);
  },
});

function tipAt(e, ratio) {
  const r = els.playerBar.getBoundingClientRect();
  const dur = curDuration;
  const text = `${fmtTime((ratio || 0) * dur)} / ${fmtTime(dur)}`;
  els.progressTip.textContent = text;
  const left = clamp01((e.clientX - r.left) / r.width) * r.width;
  els.progressTip.style.left = `${left}px`;
}

els.progressContainer.addEventListener("pointermove", (e) => {
  if (els.progressTrack.classList.contains("disabled")) return;
  const rect = els.progressTrack.getBoundingClientRect();
  const ratio = clamp01((e.clientX - rect.left) / rect.width);
  tipAt(e, ratio);
});
els.progressContainer.addEventListener("pointerleave", () => {
  if (!progressDrag) els.progressTip.style.opacity = "0";
});
els.progressContainer.addEventListener("pointerdown", () => {
  els.progressTip.style.opacity = "1";
});
els.progressContainer.addEventListener("pointerup", () => {
  setTimeout(() => (els.progressTip.style.opacity = "0"), 200);
});

let volumeTimer = null;
let volumeNumTimer = null;
let volumeCommitTimer = null;

/* 调节音量期间（拖动音量条 / ↑↓ 键 / 静音切换）：
   图标临时切换为当前音量数值，0.5s 无操作后恢复图标（按钮定宽，宽度不变） */
function showVolumeNumber(v) {
  els.volumeNum.textContent = String(
    Math.round(Math.min(100, Math.max(0, v))),
  );
  els.volumeBtn.classList.add("show-num");
  clearTimeout(volumeNumTimer);
}

function scheduleVolumeNumHide() {
  clearTimeout(volumeNumTimer);
  volumeNumTimer = setTimeout(
    () => els.volumeBtn.classList.remove("show-num"),
    500,
  );
}

const volumeCtl = bindRail(els.volumeTrack, els.volumeFill, {
  onMove(ratio) {
    const v = Math.round(ratio * 100);
    paintVolume(v);
    showVolumeNumber(v); // 拖动期间保持数值显示
    clearTimeout(volumeTimer);
    volumeTimer = setTimeout(() => callVolume(v), 120);
  },
  onCommit(ratio) {
    callVolume(Math.round(ratio * 100));
    scheduleVolumeNumHide(); // 停止拖动 0.5s 后恢复图标
  },
});

function paintVolume(v) {
  const inner = v <= 0 ? IC.volMute : v < 50 ? IC.volDown : IC.volUp;
  setSvg(els.volumeIcon, inner);
  els.volumeBtn.title = v <= 0 ? "静音" : `音量 ${v}`;
}

async function callVolume(v) {
  v = Math.round(Math.min(100, Math.max(0, v)));
  volume = v;
  scheduleLocalSave();
  if (!DEMO) {
    try {
      await go.SetVolume(v);
    } catch (_) {}
  }
}

/* 键盘 ↑↓ 音量 ±5：滑杆/图标/数值立即更新，后端调用 120ms 防抖合并 */
function nudgeVolume(delta) {
  const target = Math.round(Math.min(100, Math.max(0, volume + delta)));
  showVolumeNumber(target);
  scheduleVolumeNumHide(); // 最后一次按键结束后 0.5s 恢复图标
  if (target === volume) return;
  volume = target;
  volumeCtl.setRatio(target / 100);
  paintVolume(target);
  scheduleLocalSave();
  clearTimeout(volumeCommitTimer);
  volumeCommitTimer = setTimeout(() => {
    if (DEMO || !go) return;
    go.SetVolume(volume).catch(() => {});
  }, 120);
}

let lastVolBeforeMute = 60;
function applyVolumeLocal(v) {
  volumeCtl.setRatio(clamp01(v / 100));
  paintVolume(v);
  showVolumeNumber(v);
  scheduleVolumeNumHide();
  callVolume(v);
}

els.volumeBtn.addEventListener("click", () => {
  // 先应用图标与滑杆状态，再调用后端音量
  if (volume > 0) {
    lastVolBeforeMute = volume;
    applyVolumeLocal(0);
  } else {
    applyVolumeLocal(lastVolBeforeMute > 0 ? lastVolBeforeMute : 60);
  }
});

function seekTo(sec) {
  if (DEMO) {
    demoPosition = Math.min(Math.max(0, sec), curDuration);
    return;
  }
  go.Seek(sec).catch((e) =>
    toast(String(e && e.message ? e.message : e), "err"),
  );
}

/* 键盘 ←→ 进度 ±15s：进度条立即反馈，后端跳转 120ms 防抖合并；
   跳转后的保护窗口内不回写旧进度，避免进度条抖回。
   上次会话尚未续播时（resumeReady）调整的是续播起点 */
let seekCommitTimer = null;
function nudgeSeek(delta) {
  if (!hasSongReady() || !curDuration) return;
  if (els.progressTrack.classList.contains("disabled")) return;
  const base = resumeReady ? resumeSeekPos : curPos;
  let target = base + delta;
  if (target < 0) target = 0;
  if (target > curDuration) target = curDuration;
  if (resumeReady) {
    resumeSeekPos = target;
  } else {
    curPos = target;
    clearTimeout(seekCommitTimer);
    seekCommitTimer = setTimeout(() => {
      seekGuardUntil = Date.now() + 900;
      seekTo(curPos);
    }, 120);
  }
  progressCtl.setRatio(clamp01(target / curDuration));
}

/* ================= 歌词（窗口化：只渲染当前行 ±7 条，无滚动） ================= */
const lyricCache = new Map();
const LRC_HALF = 7;
let curSongId = 0;
let curSongName = "";
let curSongArtist = "";
let curSongAlbum = "";
let curSongPic = "";
let lyricLines = [];
let activeLrcIdx = -1;
let lyricLoading = false;

function parseLRC(lrc) {
  if (!lrc) return [];
  const out = [];
  const re = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
  for (const raw of String(lrc).split(/\r?\n/)) {
    if (!raw.includes("[")) continue;
    const times = [];
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(raw))) {
      const min = parseInt(m[1], 10);
      const sec = parseInt(m[2], 10);
      let frac = 0;
      if (m[3] !== undefined) {
        const digits = String(m[3]);
        frac = parseInt(digits, 10);
        if (digits.length === 1) frac *= 100;
        else if (digits.length === 2) frac *= 10;
      }
      times.push(min * 60 + sec + frac / 1000);
    }
    if (!times.length) continue;
    const closeIdx = raw.lastIndexOf("]");
    const text = (closeIdx >= 0 ? raw.slice(closeIdx + 1) : raw).trim();
    if (!text) continue;
    for (const t of times) out.push({ ms: Math.round(t * 1000), text });
  }
  return out.sort((a, b) => a.ms - b.ms);
}

function buildLyricModel(lrc, translated) {
  const orig = parseLRC(lrc);
  const trans = parseLRC(translated);
  const transByKey = new Map();
  const key = (ms) => Math.round(ms / 100) * 100;
  for (const t of trans) {
    if (!transByKey.has(key(t.ms))) transByKey.set(key(t.ms), t.text);
  }
  return orig.map((l) => ({
    ms: l.ms,
    text: l.text,
    trans: transByKey.get(key(l.ms)) || "",
  }));
}

function isPureMusic(lrc) {
  return /纯音乐|暂无歌词/.test(lrc || "");
}

function makeHeader() {
  const header = document.createElement("div");
  header.className = "song-header";
  const title = document.createElement("div");
  title.className = "title";
  title.textContent = curSongName || "未在播放";
  const artist = document.createElement("div");
  artist.className = "artist";
  artist.textContent = curSongArtist || "";
  header.append(title, artist);
  return header;
}

async function ensureLyrics() {
  if (!curSongId || lyricLoading) return;
  if (lyricCache.has(curSongId)) {
    const cached = lyricCache.get(curSongId);
    if (!cached.length && els.lyricsScroll.querySelector(".lyric-note")) return;
    applyLyricView(cached, activeLrcIdx);
    return;
  }
  lyricLoading = true;
  renderLyricNote("正在加载歌词…", true);
  try {
    const dto = await apiLyric(curSongId);
    let lines = [];
    if (!isPureMusic(dto.original)) {
      lines = buildLyricModel(dto.original, dto.translated);
    }
    lyricCache.set(curSongId, lines);
    applyLyricView(lines, activeLrcIdx);
  } catch (e) {
    renderLyricNote("歌词加载失败", true);
  } finally {
    lyricLoading = false;
  }
}

/* 无歌词/纯音乐/加载中：与歌词页同布局（标题/歌手），中央说明文字 */
function renderLyricNote(text, showHeader) {
  lyricHeaderKey = ""; // 说明视图后重建歌词时要一并重建头部
  els.lyricsScroll.innerHTML = "";
  lyricLines = [];
  activeLrcIdx = -1;
  if (showHeader && curSongName) els.lyricsScroll.appendChild(makeHeader());
  const note = document.createElement("div");
  note.className = "lyric-note";
  if (text === "纯音乐，请欣赏") {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.style.width = "46px";
    svg.style.height = "46px";
    svg.style.opacity = "0.5";
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute(
      "d",
      "M12 13.5351V3H20V6H14V17C14 19.2091 12.2091 21 10 21C7.79086 21 6 19.2091 6 17C6 14.7909 7.79086 13 10 13C10.7286 13 11.4117 13.1948 12 13.5351Z",
    );
    svg.appendChild(p);
    note.appendChild(svg);
  }
  const t = document.createElement("span");
  t.textContent = text;
  note.appendChild(t);
  els.lyricsScroll.appendChild(note);
  hideLrcRect();
}

/* 顶部歌名/歌手所属歌曲标记：换歌或清空后才重建头部，行切换不动它 */
let lyricHeaderKey = "";

function lyricContextKey() {
  return `${curSongId}|${curSongName || ""}|${curSongArtist || ""}`;
}

/* 只重建歌词窗口内的行；顶部歌曲信息头部保持原 DOM，避免行更新时头部闪烁/重播动画 */
function applyLyricView(lines, idx) {
  lyricLines = lines;
  if (!lines.length) {
    renderLyricNote(curSongId ? "纯音乐，请欣赏" : "暂无歌词", !!curSongId);
    return;
  }

  const key = lyricContextKey();
  let headerEl = els.lyricsScroll.querySelector(".song-header");
  let win = els.lyricsScroll.querySelector(".lrc-window");

  if (key !== lyricHeaderKey || !headerEl || !win) {
    /* 换了歌/初次渲染/说明态转正：整体重建一次（头部随之更新） */
    lyricHeaderKey = key;
    els.lyricsScroll.innerHTML = "";
    els.lyricsScroll.appendChild(makeHeader());
    win = document.createElement("div");
    win.className = "lrc-window";
    els.lyricsScroll.appendChild(win);
  }

  /* 同一首歌：仅刷新窗口内歌词行，头部元素原地不动 */
  win.innerHTML = "";
  const show = idx == null || idx < 0 ? 0 : idx;
  const from = Math.max(0, show - LRC_HALF);
  const to = Math.min(lines.length - 1, show + LRC_HALF);
  for (let i = from; i <= to; i++) {
    const l = lines[i];
    const row = document.createElement("div");
    row.className = "lyric-line" + (i === idx ? " active" : "");
    const main = document.createElement("span");
    main.className = "lrc-main";
    main.textContent = l.text;
    row.appendChild(main);
    if (i === idx && l.trans) {
      const sub = document.createElement("span");
      sub.className = "lrc-trans";
      sub.textContent = l.trans;
      row.appendChild(sub);
    }
    row.addEventListener("click", () => seekTo(l.ms / 1000));
    win.appendChild(row);
    l.el = row;
  }
  if (idx >= 0) startLrcRect();
  else hideLrcRect();
}

function updateActiveLyric(posSec) {
  if (!lyricLines.length) return;
  let idx = -1;
  for (let i = 0; i < lyricLines.length; i++) {
    if (lyricLines[i].ms <= posSec * 1000 + 40) idx = i;
    else break;
  }
  if (idx === activeLrcIdx) return;
  activeLrcIdx = idx;
  applyLyricView(lyricLines, idx);
}

/* ================= 歌词活动矩形（square.lua 同款四边缓动） ================= */
const rectLoop = { raf: 0 };
const rectState = { L: 0, R: 0, T: 0, B: 0, init: false, last: 0 };
let lrcRect = null;

function ensureLrcRect() {
  if (!lrcRect || !lrcRect.isConnected) {
    lrcRect = document.createElement("div");
    lrcRect.className = "lrc-rect";
    els.lyricsScroll.appendChild(lrcRect);
  }
  return lrcRect;
}

function snapClose(a, b, k) {
  const d = b - a;
  if (Math.abs(d) < 0.1) return b;
  return a + d * k;
}

function measureActiveLine() {
  const line = lyricLines[activeLrcIdx]?.el;
  if (!line || !line.isConnected) return null;
  const el = els.lyricsScroll;
  const cr = el.getBoundingClientRect();
  const lr = line.getBoundingClientRect();
  const s = el.scrollTop;
  const sl = el.scrollLeft || 0;
  return {
    L: lr.left - cr.left + sl,
    R: lr.right - cr.left + sl,
    T: lr.top - cr.top + s,
    B: lr.bottom - cr.top + s,
  };
}

function rectTick(now) {
  rectLoop.raf = 0;
  if (!lyricsOpen) return;
  const t = measureActiveLine();
  if (!t) {
    if (lrcRect) lrcRect.style.opacity = "0";
    rectLoop.raf = requestAnimationFrame(rectTick);
    return;
  }
  if (!rectState.init) {
    rectState.init = true;
    rectState.L = t.L;
    rectState.R = t.R;
    rectState.T = t.T;
    rectState.B = t.B;
  } else {
    const dt = Math.min(
      0.05,
      rectState.last ? (now - rectState.last) / 1000 : 0.016,
    );
    rectState.last = now;
    const midX = (rectState.L + rectState.R) / 2;
    const midY = (rectState.T + rectState.B) / 2;
    const dx = (t.L + t.R) / 2 - midX;
    const dy = (t.T + t.B) / 2 - midY;
    const SLOW = 0.5;
    const FAST = 0.8;
    rectState.L = snapClose(rectState.L, t.L, (dx < 0 ? FAST : SLOW) * dt * 30);
    rectState.R = snapClose(rectState.R, t.R, (dx > 0 ? FAST : SLOW) * dt * 30);
    rectState.T = snapClose(rectState.T, t.T, (dy < 0 ? FAST : SLOW) * dt * 30);
    rectState.B = snapClose(rectState.B, t.B, (dy > 0 ? FAST : SLOW) * dt * 30);
  }
  const r = ensureLrcRect();
  r.style.opacity = "1";
  r.style.left = `${rectState.L}px`;
  r.style.top = `${rectState.T}px`;
  r.style.width = `${rectState.R - rectState.L}px`;
  r.style.height = `${rectState.B - rectState.T}px`;
  rectLoop.raf = requestAnimationFrame(rectTick);
}

function startLrcRect() {
  if (!lyricsOpen || rectLoop.raf) return;
  rectState.last = performance.now();
  rectLoop.raf = requestAnimationFrame(rectTick);
}

function stopLrcRect() {
  if (rectLoop.raf) {
    cancelAnimationFrame(rectLoop.raf);
    rectLoop.raf = 0;
  }
}

function hideLrcRect() {
  rectState.init = false;
  if (lrcRect) lrcRect.style.opacity = "0";
}

/* ================= 状态应用 ================= */
let lastSongId = null;
let prevState = null;
let lastAutoAt = 0;

function applyStatus(st) {
  const playing = st.state === "playing";
  const hasSong = !!st.song;
  const nowState = st.state;

  if (
    prevState === "playing" &&
    nowState === "stopped" &&
    hasSong &&
    Date.now() - lastAutoAt > 1500
  ) {
    lastAutoAt = Date.now();
    autoAdvance();
  }
  prevState = nowState;

  /* 歌曲乐观切换的保护窗口：后端尚未切到新歌时（仍报旧歌/无歌）
     不回写底部栏/封面/歌词页，保留乐观界面；超时则恢复后端同步 */
  if (Date.now() < playGuardUntil && (!hasSong || st.song.id !== curSongId)) {
    if (lyricsOpen && lyricLines.length) updateActiveLyric(0);
    return;
  }
  playGuardUntil = 0;

  els.prevBtn.disabled = !hasSong || songPool.length === 0;
  els.nextBtn.disabled = !hasSong || songPool.length === 0;
  els.playBtn.disabled = !hasSong;
  els.progressTrack.classList.toggle("disabled", !hasSong || !st.seekSupported);
  /* 点击后的保护窗口内，后端仍是旧状态时不回写图标，避免图标闪回；
     后端已确认（与 uiPlaying 一致）或窗口过后则正常同步 */
  const wantPlaying = playing && hasSong;
  if (Date.now() >= toggleGuardUntil) {
    uiPlaying = wantPlaying;
    paintPlayIcon(wantPlaying);
  } else if (wantPlaying === uiPlaying) {
    paintPlayIcon(wantPlaying);
  }

  if (hasSong) {
    if (st.song.id !== lastSongId) {
      lastSongId = st.song.id;
      lastActiveId = st.song.id;
      curSongId = st.song.id;
      curSongName = st.song.name;
      curSongArtist = st.song.artists;
      curSongAlbum = st.song.album;
      curSongPic = st.song.picUrl || "";

      els.songTitle.textContent = st.song.name;
      els.songArtist.textContent = st.song.artists + " · " + st.song.album;
      curDuration = st.song.duration || 0;
      curPos = st.position;
      seekGuardUntil = 0;
      els.progressHandle.style.display = "";
      applyCover(st.song.picUrl);
      markPlayingRow(st.song.id);
      lyricLines = [];
      lyricLoading = false;
      lyricCache.delete(curSongId);
      if (lyricsOpen) {
        renderLyricNote("正在加载歌词…", true);
        ensureLyrics();
      }
    }

    if (lyricsOpen) {
      if (!lyricLines.length && !lyricLoading) ensureLyrics();
      updateActiveLyric(st.position);
    }

    if (curDuration > 0) {
      /* 键盘 ←→ 调进度后的保护窗口内不回写旧进度，避免进度条抖回 */
      if (Date.now() >= seekGuardUntil) {
        curPos = st.position;
        progressCtl.setRatio(clamp01(st.position / curDuration));
      }
      /* 播放中每 ~3s 记录一次会话（含进度），退出/重启后可续播 */
      if (playing) {
        sessionLivePos = st.position;
        const now = Date.now();
        if (now - lastSessionSaveAt > 3000) {
          lastSessionSaveAt = now;
          persistSessionNow(sessionLivePos);
        }
      }
    }
    } else {
      if (resumeReady) {
        // 启动后有上次会话但尚未点播放：保持续播界面，不让后端空状态覆盖
        els.playBtn.disabled = false;
        return;
      }
      els.songTitle.textContent = "未在播放";
    els.songArtist.textContent = "搜索并点击歌曲开始播放";
    curDuration = 0;
    els.progressHandle.style.display = "none";
    progressCtl.setRatio(0);
    if (lyricsOpen) renderLyricNote("尚未开始播放", false);
  }
}

function applyCover(picUrl) {
  if (picUrl) {
    els.coverImg.src = picUrl;
    els.coverImg.classList.remove("hidden");
    els.coverIcon.classList.add("hidden");
  } else {
    els.coverImg.removeAttribute("src");
    els.coverImg.classList.add("hidden");
    els.coverIcon.classList.remove("hidden");
  }
}

/* ================= 后端 / 演示模式 ================= */
let go = null;
let DEMO = false;

async function waitForGo() {
  for (let i = 0; i < 30; i++) {
    if (window.go && window.go.app && window.go.app.App) {
      go = window.go.app.App;
      return true;
    }
    // 兼容旧命名空间
    if (window.go && window.go.main && window.go.main.App) {
      go = window.go.main.App;
      return true;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

/* ---- 演示数据 ---- */
const demoSearchPool = [
  {
    id: 1,
    name: "夜航星 (Night Voyager)",
    artists: "不才",
    album: "我的三体·章北海传",
    duration: 272,
  },
  { id: 2, name: "渡口", artists: "蔡琴", album: "民歌蔡琴", duration: 225 },
  { id: 3, name: "晴天", artists: "周杰伦", album: "叶惠美", duration: 269 },
  {
    id: 4,
    name: "Beyond The Sea",
    artists: "Bobby Darin",
    album: "That's All",
    duration: 172,
  },
  {
    id: 5,
    name: "深海回响",
    artists: "Teto",
    album: "Live2D 主题曲",
    duration: 208,
  },
  {
    id: 6,
    name: "Highlighted lyric in the lyrics",
    artists: "Artist Name",
    album: "Sample Album",
    duration: 243,
  },
  {
    id: 7,
    name: "Miku - Hatsune Miku (Vocaloid)",
    artists: "初音ミク",
    album: "VoiceVox",
    duration: 231,
  },
  {
    id: 8,
    name: "Teto - Kasane Teto",
    artists: "重音テト",
    album: "VoiceVox",
    duration: 218,
  },
];

const demoPlaylistPool = Array.from({ length: 47 }, (_, i) => ({
  id: 100000 + i,
  name: `歌单示例 ${String(i + 1).padStart(2, "0")} · ${["华语流行", "ACG 动画", "睡前轻音乐", "日系摇滚", "纯音乐"][i % 5]}`,
  sub: `${(i * 7 + 3200) % 100000}万 · ${20 + i * 3} 首`,
}));

const demoAlbumPool = Array.from({ length: 24 }, (_, i) => ({
  id: 300000 + i,
  name: `专辑示例 ${String(i + 1).padStart(2, "0")} · ${demoSearchPool[i % demoSearchPool.length].album}`,
  sub: `${demoSearchPool[i % demoSearchPool.length].artists} · ${6 + (i % 12)} 首`,
}));

function demoPage(pool, kw, offset) {
  const q = kw.toLowerCase();
  const all = pool.filter(
    (it) =>
      !q ||
      it.name.toLowerCase().includes(q) ||
      String(it.sub || "")
        .toLowerCase()
        .includes(q),
  );
  const page = all.slice(offset, offset + 30);
  return { items: page, more: offset + page.length < all.length };
}

async function apiSearch(kw, cat, offset) {
  if (go) return go.Search(kw, cat, offset);
  if (cat === "playlist") return demoPage(demoPlaylistPool, kw, offset);
  if (cat === "album") return demoPage(demoAlbumPool, kw, offset);
  const pool = demoSearchPool.map((s) => ({
    id: s.id,
    name: s.name,
    sub: `${s.artists} · ${s.album}`,
    picUrl: "",
    duration: s.duration,
    artists: s.artists,
    album: s.album,
  }));
  const q = kw.toLowerCase();
  const all = pool.filter(
    (s) =>
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.artists.toLowerCase().includes(q) ||
      s.album.toLowerCase().includes(q),
  );
  return {
    items: all.slice(offset, offset + 30),
    more: offset + 30 < all.length,
  };
}

/* ================= 歌单 / 专辑详情页 ================= */
let detailCat = "playlist";
let detailNameStr = "";
let detailToken = 0;
let detailLoading = false;
let detailInfo = null; // 当前详情页对应的歌单/专辑 {type,id,name,sub}
let detailFrom = "search"; // 详情页由哪个页面打开："search" | "fav"

function toPoolItems(dtos) {
  return (dtos || []).map((d) => ({
    id: d.id,
    name: d.name,
    artists: d.artists || "",
    album: d.album || "",
    picUrl: d.picUrl || "",
    duration: d.duration || 0,
  }));
}

async function apiDetailSongs(cat, id) {
  if (go) {
    const dtos =
      cat === "album" ? await go.AlbumSongs(id) : await go.PlaylistSongs(id);
    return toPoolItems(dtos);
  }
  if (cat === "album") return toPoolItems(demoSearchPool.slice(0, 5));
  const rev = demoSearchPool.slice().reverse();
  return toPoolItems(rev.concat(demoSearchPool));
}

function renderDetailList(songs) {
  els.detailList.innerHTML = "";
  songs.forEach((s, i) => {
    const row = document.createElement("div");
    row.className = "song-item" + (s.id === lastActiveId ? " playing" : "");
    row.dataset.id = String(s.id);
    const idx = document.createElement("span");
    idx.className = "song-index";
    idx.textContent = String(i + 1).padStart(2, "0");
    const name = document.createElement("span");
    name.className = "song-name";
    name.textContent = s.name;
    name.title = s.name;
    const artist = document.createElement("span");
    artist.className = "song-artist-name";
    artist.textContent = s.artists || "";
    artist.title = s.artists || "";
    const dur = document.createElement("span");
    dur.className = "song-duration";
    dur.textContent = fmtTime(s.duration);
    row.append(idx, name, artist, dur);
    attachHeart(row, s, "song");
    row.addEventListener("click", () => {
      anchorRandomPick(s.id, false);
      playSong(s.id, s.name);
    });
    els.detailList.appendChild(row);
  });
  syncFavBtns();
}

/* 详情页作为独立页面：隐藏搜索区/收藏页，仅显示详情面板，并隐藏侧边栏 */
function showDetailPage() {
  els.searchBar.classList.add("hidden");
  els.browseArea.classList.add("hidden");
  els.resultPanel.classList.add("hidden");
  els.favPanel.classList.add("hidden");
  exitBatch();
  els.detailPanel.classList.remove("hidden");
  document.body.classList.add("detail-open");
}

/* 返回按钮：回到打开详情页前的页面（搜索页或收藏页） */
function closeDetail() {
  if (els.detailPanel.classList.contains("hidden")) return;
  detailToken++; // 作废未完成的加载
  detailLoading = false;
  els.detailPanel.classList.add("hidden");
  document.body.classList.remove("detail-open");
  if (detailFrom === "fav") {
    els.favPanel.classList.remove("hidden");
    renderFavorites();
    setActiveNav(els.navFav);
  } else {
    applySearchView();
    if (searchMode === "results") slideResults(true);
    setActiveNav(els.navSearch);
  }
}

/* 详情页收藏按钮：已收藏 → 高亮 + “取消收藏” */
function paintDetailFav() {
  if (!els.detailFav) return;
  const faved = !!detailInfo && isFaved(detailInfo.id, detailInfo.type);
  els.detailFav.classList.toggle("active", faved);
  if (els.detailFavText)
    els.detailFavText.textContent = faved
      ? "取消收藏"
      : `收藏${detailInfo && detailInfo.type === "album" ? "专辑" : "歌单"}`;
}

async function openDetail(cat, item) {
  const token = ++detailToken;
  detailCat = cat;
  detailNameStr = item.name;
  detailInfo = {
    type: cat,
    id: item.id,
    name: item.name,
    sub: item.sub || item.album || "",
  };
  detailFrom = els.favPanel.classList.contains("hidden") ? "search" : "fav";
  els.detailTitle.textContent = cat === "album" ? "专辑" : "歌单";
  els.detailName.textContent = item.name;
  els.detailMeta.textContent = detailInfo.sub;
  els.detailList.innerHTML = "";
  const hint = document.createElement("div");
  hint.className = "queue-empty";
  hint.textContent = "正在加载歌曲…";
  els.detailList.appendChild(hint);
  paintDetailFav();
  showDetailPage();
  detailLoading = true;
  try {
    const songs = await apiDetailSongs(cat, item.id);
    if (token !== detailToken) return;
    songPool = songs;
    updateQueue();
    renderDetailList(songs);
  } catch (e) {
    if (token === detailToken)
      toast(String(e && e.message ? e.message : e), "err");
  } finally {
    detailLoading = false;
  }
}

els.detailBack.addEventListener("click", closeDetail);
els.detailFav.addEventListener("click", () => {
  if (!detailInfo) return;
  toggleFav(
    { id: detailInfo.id, name: detailInfo.name, sub: detailInfo.sub },
    detailInfo.type,
  );
  paintDetailFav();
});

/* Esc：先关歌词页，再关详情页/设置页 */
window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (lyricsOpen) {
    setLyricsOpen(false);
    return;
  }
  if (!els.settingsPanel.classList.contains("hidden")) {
    showSearchView();
    return;
  }
  closeDetail();
});

/* ================= 全局快捷键 =================
   ↑/↓ 音量 ±5（音量图标暂显数值）、←/→ 进度 ±15s、空格 播放/暂停、
   [ / ]（含 { / }）上一曲/下一曲；输入框聚焦或按住修饰键时不劫持 */
window.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  const ae = document.activeElement;
  if (
    ae &&
    (ae.tagName === "INPUT" ||
      ae.tagName === "TEXTAREA" ||
      ae.isContentEditable)
  )
    return;
  switch (e.key) {
    case "ArrowUp":
      e.preventDefault();
      nudgeVolume(5);
      break;
    case "ArrowDown":
      e.preventDefault();
      nudgeVolume(-5);
      break;
    case "ArrowLeft":
      e.preventDefault();
      nudgeSeek(-15);
      break;
    case "ArrowRight":
      e.preventDefault();
      nudgeSeek(15);
      break;
    case " ":
    case "Spacebar":
      /* preventDefault 会抑制焦点按钮的空格激活，避免双重触发 */
      e.preventDefault();
      if (e.repeat) return;
      togglePlay();
      pressFx(els.playBtn);
      break;
    case "[":
    case "{":
      e.preventDefault();
      if (e.repeat) return;
      pressFx(els.prevBtn);
      playNeighbor(-1);
      break;
    case "]":
    case "}":
      e.preventDefault();
      if (e.repeat) return;
      pressFx(els.nextBtn);
      playNeighbor(1);
      break;
  }
});
els.detailPlayAll.addEventListener("click", () => {
  if (detailLoading || !songPool.length) {
    toast("歌曲还在加载中");
    return;
  }
  /* 随机播放时不从第一首开始，而是随机挑一首作为起点 */
  const start =
    randomMode && songPool.length > 1
      ? Math.floor(Math.random() * songPool.length)
      : 0;
  if (randomMode) anchorShuffleAt(start);
  playAt(start, true);
});

function makeDemoLyric(duration) {
  const base = [
    "如果时间可以倒流",
    "穿过黑夜与星尘的尽头",
    "追逐微光闪烁的坐标",
    "你在荒原的夜空仰望",
    "哪怕引力在此刻失序",
    "静默的声音穿越光年",
    "将所有记忆化为尘埃",
    "在无人知晓的轨道前行",
    "Highlighted lyric in the lyrics",
    "I make childs amend you",
    "Hate vice venting",
    "When you hear lasting to the lyrics",
    "终会在晨光中再次相遇",
    "哪怕只剩下一微秒的光芒",
  ];
  const translations = {
    2: "去追逐那微光闪烁的坐标",
    5: "静默的声音正穿越光年",
    7: "在无人知晓的轨道上继续前行",
    9: "我让时光为你重塑",
    12: "终会在晨光中再次相遇",
  };
  const texts = [];
  for (let i = 0; texts.length < 46; i++) texts.push(base[i % base.length]);
  const seg = duration / (texts.length + 1);
  return texts.map((text, i) => {
    let trans = translations[i % base.length] || "";
    if (trans === text) trans = "";
    return { ms: Math.round(seg * (i + 1) - seg * 0.6), text, trans };
  });
}

async function apiLyric(id) {
  if (go) return go.Lyric(id);
  const song = songPool.find((s) => s.id === id) || demoSearchPool[0];
  const dur = song ? song.duration * 1000 : 240000;
  const toLrc = (list) =>
    list
      .map((l) => {
        const mm = Math.floor(l.ms / 60000);
        const ss = Math.floor((l.ms % 60000) / 1000);
        const ff = String(Math.floor((l.ms % 1000) / 100)) + "0";
        return `[${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}.${ff}]${l.text}`;
      })
      .join("\n");
  const lines = makeDemoLyric(dur);
  return {
    original: toLrc(lines),
    translated: toLrc(lines.filter((l) => l.trans)),
  };
}

async function apiPlaySong(id) {
  if (go) return go.PlaySong(id);
  const song = songPool.find((s) => s.id === id) || demoSearchPool[0];
  demoPlaying = true;
  uiPlaying = true;
  demoPosition = 0;
  demoState = {
    state: "playing",
    position: 0,
    volume,
    seekSupported: true,
    song: {
      id: song.id,
      name: song.name,
      artists: song.artists || "",
      album: song.album || "",
      picUrl: song.picUrl || "",
      duration: song.duration,
    },
  };
}

async function apiStatus() {
  if (go) return go.Status();
  return {
    state: demoPlaying ? "playing" : "paused",
    position: demoState ? demoPosition : 0,
    volume,
    song: demoState ? demoState.song : null,
    seekSupported: true,
  };
}

let demoState = null;
let demoPlaying = false;
let demoPosition = 0;
let volume = 60;

function startDemo() {
  demoPlaying = true;
  uiPlaying = true;
  demoPosition = 0;
  const song = demoSearchPool[5];
  songPool = demoSearchPool.slice();
  demoState = {
    state: "playing",
    position: 0,
    volume,
    seekSupported: true,
    song: {
      id: song.id,
      name: song.name,
      artists: song.artists,
      album: song.album,
      picUrl: "",
      duration: song.duration,
    },
  };
  renderResultList(songPool, "song", false);
  updateQueue();
}

async function tickDemo() {
  if (!demoState) return;
  if (demoPlaying) {
    demoPosition += 0.4;
    if (demoPosition >= demoState.song.duration) {
      prevState = "playing";
      demoPosition = 0;
      autoAdvance();
    }
  }
  try {
    applyStatus(await apiStatus());
  } catch (_) {}
}

/* ================= 启动 ================= */
(async function boot() {
  try {
    const saved = localStorage.getItem("musicfox-theme");
    if (saved) setTheme(saved === "dark", false);
  } catch (_) {}
  applyThemeIcon(isDarkTheme());

  paintMode();
  paintPlayIcon(false);
  volumeCtl.setRatio(volume / 100);
  paintVolume(volume);

  const hasGo = await waitForGo();
  if (!hasGo) {
    DEMO = true;
    try {
      const saved = localStorage.getItem("musicfox-fav");
      if (saved) {
        const val = JSON.parse(saved);
        /* 兼容：旧版直接存收藏数组，新版存 {favorites, bufferMB, quality} */
        if (Array.isArray(val)) {
          favorites = val
            .filter((f) => f && f.id)
            .map((f) => ({ ...f, type: f.type || "song" }));
        } else {
          if (Array.isArray(val.favorites))
            favorites = val.favorites
              .filter((f) => f && f.id)
              .map((f) => ({ ...f, type: f.type || "song" }));
          if (typeof val.bufferMB === "number" && BUFFER_CHOICES.indexOf(Number(val.bufferMB)) >= 0)
            bufMB = Number(val.bufferMB);
          if (QUALITY_LABELS[val.quality]) qualitySel = val.quality;
          else qualitySel = "higher";
          if (typeof val.volumeNorm === "boolean") volumeNorm = val.volumeNorm;
        }
      }
    } catch (_) {}
    updateFavCount();
    /* 演示模式同样支持会话续播：有上次会话则不自动开播，等用户点播放 */
    try {
      const sess = JSON.parse(localStorage.getItem("musicfox-session") || "null");
      if (sess && sess.currentId && Array.isArray(sess.queue))
        applySavedSession(sess);
    } catch (_) {}
    if (!resumeReady) startDemo();
    renderHistory();
    setInterval(tickDemo, 400);
    return;
  }
  setInterval(async () => {
    try {
      applyStatus(await go.Status());
    } catch (_) {}
  }, 400);

  /* Windows 系统媒体控制栏（SMTC）的“上一首/下一首”回调：
     与底部按钮同路径，自动遵循随机/循环模式 */
  try {
    if (window.runtime && window.runtime.EventsOn) {
      window.runtime.EventsOn("smtc:next", () => playNeighbor(1));
      window.runtime.EventsOn("smtc:prev", () => playNeighbor(-1));
    }
  } catch (_) {}

  /* 读取本地设置与收藏 */
  try {
    const ls = await go.LoadState();
    if (ls && ls.theme) setTheme(ls.theme === "dark", false);
    if (ls && typeof ls.volume === "number") {
      volume = Math.round(Math.min(100, Math.max(0, ls.volume)));
      volumeCtl.setRatio(clamp01(volume / 100));
      paintVolume(volume);
    } else {
      const st = await go.Status();
      if (st.volume !== undefined) {
        volume = st.volume;
        volumeCtl.setRatio(clamp01(volume / 100));
        paintVolume(volume);
      }
    }
    /* 滑块读数只是 UI：把音量真正应用到播放引擎，避免初启后仍按 100% 播放 */
    try {
      await go.SetVolume(volume);
    } catch (_) {}
    if (ls && Array.isArray(ls.favorites))
      favorites = ls.favorites
        .filter((f) => f && f.id)
        .map((f) => ({ ...f, type: f.type || "song" }));
    if (ls && BUFFER_CHOICES.indexOf(Number(ls.bufferMB)) >= 0) bufMB = Number(ls.bufferMB);
    if (ls && QUALITY_LABELS[ls.quality]) qualitySel = ls.quality;
    else if (ls) qualitySel = "higher";
    if (ls && typeof ls.volumeNorm === "boolean") volumeNorm = ls.volumeNorm;
    paintSettingsOpts();
    updateFavCount();
  } catch (_) {}

  /* 还原最近一次播放会话（歌单/列表队列），点播放按钮续播 */
  try {
    applySavedSession(await go.LoadSession());
  } catch (_) {}

  renderHistory();
  els.searchInput.focus();
})();

/* 窗口关闭前兜底保存一次会话进度 */
window.addEventListener("pagehide", () => {
  if (curSongId && songPool.length) persistSessionNow(sessionLivePos);
});

/* 窗口缩放时若歌词页开着则重排活动矩形位置 */
let resizeLyr = {};
window.addEventListener("resize", () => {
  if (lyricsOpen) {
    clearTimeout(resizeLyr._t);
    resizeLyr._t = setTimeout(() => {
      hideLrcRect();
      const line = lyricLines[activeLrcIdx]?.el;
      if (line && line.isConnected) {
        const t = measureActiveLine();
        if (t) {
          rectState.init = true;
          rectState.L = t.L;
          rectState.R = t.R;
          rectState.T = t.T;
          rectState.B = t.B;
        }
      }
    }, 120);
  }
});
