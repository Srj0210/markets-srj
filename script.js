/* ============================================
   SRJahir Markets v2.0 — Fixed + SEO + Fast
   US Market Focus | Batch Calls | Auto-Refresh
   ============================================ */

const API = "https://autumn-band-75e8.surajmaitra1996.workers.dev";
const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));
const fmt = n => (!n && n !== 0) ? "—" : Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ── US MARKET INDICES (ETF proxies that work on Finnhub) ── */
const INDICES = [
  { name: "S&P 500", sym: "SPY", fullName: "SPDR S&P 500 ETF" },
  { name: "NASDAQ", sym: "QQQ", fullName: "Invesco QQQ Trust" },
  { name: "Dow Jones", sym: "DIA", fullName: "SPDR Dow Jones ETF" },
  { name: "Russell 2000", sym: "IWM", fullName: "iShares Russell 2000" },
];

const TRENDING = ["AAPL", "MSFT", "TSLA", "NVDA", "META", "AMZN", "GOOGL", "AMD"];

/* Sector ETFs */
const SECTORS = [
  { name: "Technology", sym: "XLK" },
  { name: "Healthcare", sym: "XLV" },
  { name: "Financials", sym: "XLF" },
  { name: "Energy", sym: "XLE" },
  { name: "Consumer", sym: "XLY" },
  { name: "Industrials", sym: "XLI" },
  { name: "Real Estate", sym: "XLRE" },
  { name: "Utilities", sym: "XLU" },
];

/* Extra stocks for gainers/losers */
const EXTRA = ["GOOG", "NFLX", "CRM", "ORCL", "AVGO", "PLTR", "COIN", "SQ", "SHOP", "UBER", "INTC", "BA", "DIS", "PYPL"];

/* ── BATCH FETCH (parallel, not sequential) ── */
async function batchQuotes(symbols) {
  const results = {};
  const promises = symbols.map(async sym => {
    try {
      const r = await fetch(`${API}/quote?symbol=${sym}`);
      const d = await r.json();
      if (d && d.c) results[sym] = d;
    } catch {}
  });
  await Promise.all(promises);
  return results;
}

/* ── MARKET STATUS ── */
function updateMarketStatus() {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay();
  const h = et.getHours();
  const m = et.getMinutes();
  const time = h * 60 + m;

  const el = qs("#marketStatus");
  const upd = qs("#lastUpdate");

  if (day === 0 || day === 6) {
    el.innerHTML = "🔴 Market Closed — Weekend";
    el.className = "status-closed";
  } else if (time >= 570 && time < 960) { // 9:30 AM - 4:00 PM ET
    el.innerHTML = "🟢 Market Open — US Trading Hours";
    el.className = "status-open";
  } else if (time >= 240 && time < 570) {
    el.innerHTML = "🟡 Pre-Market Trading";
    el.className = "status-pre";
  } else if (time >= 960 && time < 1200) {
    el.innerHTML = "🟡 After-Hours Trading";
    el.className = "status-after";
  } else {
    el.innerHTML = "🔴 Market Closed";
    el.className = "status-closed";
  }

  upd.textContent = `Last updated: ${now.toLocaleTimeString()}`;
}

/* ── SEARCH ── */
async function searchSymbols(q) {
  if (!q) return [];
  try {
    const res = await fetch(`${API}/search?query=${q}`);
    const data = await res.json();
    return data.result?.slice(0, 5) || [];
  } catch { return []; }
}

function showSuggest(list) {
  const box = qs("#suggestBox");
  if (!list.length) { box.style.display = "none"; return; }
  box.style.display = "block";
  box.innerHTML = list.map(s => `
    <div class="s-item" onclick="goStock('${s.symbol}')">
      <div class="s-symbol">${s.symbol}</div>
      <div class="s-name">${s.description}</div>
    </div>
  `).join("");
}

function bindSearch() {
  const i = qs("#searchInput");
  let timeout;
  i.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      const q = i.value.trim();
      if (!q) { showSuggest([]); return; }
      showSuggest(await searchSymbols(q));
    }, 300); // debounce
  });
  document.addEventListener("click", e => {
    if (!qs(".search-wrapper").contains(e.target)) qs("#suggestBox").style.display = "none";
  });
}

function goStock(sym) { location.href = `stock.html?symbol=${sym}`; }

/* ── RENDER INDICES ── */
function renderIndices(quotes) {
  const g = qs("#indicesGrid");
  g.innerHTML = INDICES.map(idx => {
    const q = quotes[idx.sym];
    if (!q) return `<div class="tile"><div class="idx-name">${idx.name}</div><div class="idx-price">—</div><div class="idx-change">—</div></div>`;
    const ch = ((q.c - q.pc) / q.pc) * 100;
    return `
      <div class="tile clickable" onclick="goStock('${idx.sym}')">
        <div class="idx-name">${idx.name}</div>
        <div class="idx-price">${fmt(q.c)}</div>
        <div class="idx-change ${ch >= 0 ? 'pos' : 'neg'}">${ch >= 0 ? '+' : ''}${ch.toFixed(2)}%</div>
      </div>`;
  }).join("");
}

/* ── RENDER TRENDING ── */
function renderTrending(quotes) {
  const g = qs("#trendingGrid");
  g.innerHTML = TRENDING.map(sym => {
    const q = quotes[sym];
    if (!q) return `<div class="tile"><div>${sym}</div><div>—</div></div>`;
    const ch = ((q.c - q.pc) / q.pc) * 100;
    return `
      <div class="tile clickable" onclick="goStock('${sym}')">
        <div class="stock-sym">${sym}</div>
        <div class="stock-price">${fmt(q.c)}</div>
        <div class="stock-change ${ch >= 0 ? 'pos' : 'neg'}">${ch >= 0 ? '+' : ''}${ch.toFixed(2)}%</div>
      </div>`;
  }).join("");
}

/* ── GAINERS & LOSERS ── */
function renderGainersLosers(quotes) {
  const all = Object.entries(quotes)
    .filter(([, q]) => q && q.c && q.pc)
    .map(([sym, q]) => ({ sym, price: q.c, change: ((q.c - q.pc) / q.pc) * 100 }));

  all.sort((a, b) => b.change - a.change);

  const gainers = all.slice(0, 5);
  const losers = all.slice(-5).reverse();

  qs("#gainersGrid").innerHTML = gainers.map(s => `
    <div class="mini-row clickable" onclick="goStock('${s.sym}')">
      <span class="mini-sym">${s.sym}</span>
      <span class="mini-price">${fmt(s.price)}</span>
      <span class="pos">+${s.change.toFixed(2)}%</span>
    </div>`).join("");

  qs("#losersGrid").innerHTML = losers.map(s => `
    <div class="mini-row clickable" onclick="goStock('${s.sym}')">
      <span class="mini-sym">${s.sym}</span>
      <span class="mini-price">${fmt(s.price)}</span>
      <span class="neg">${s.change.toFixed(2)}%</span>
    </div>`).join("");
}

/* ── SECTORS ── */
function renderSectors(quotes) {
  const g = qs("#sectorGrid");
  g.innerHTML = SECTORS.map(sec => {
    const q = quotes[sec.sym];
    if (!q) return `<div class="sector-tile"><span>${sec.name}</span><span>—</span></div>`;
    const ch = ((q.c - q.pc) / q.pc) * 100;
    return `
      <div class="sector-tile clickable" onclick="goStock('${sec.sym}')">
        <span class="sector-name">${sec.name}</span>
        <div class="sector-bar ${ch >= 0 ? 'bar-pos' : 'bar-neg'}" style="width:${Math.min(Math.abs(ch) * 20, 100)}%"></div>
        <span class="${ch >= 0 ? 'pos' : 'neg'}">${ch >= 0 ? '+' : ''}${ch.toFixed(2)}%</span>
      </div>`;
  }).join("");
}

/* ── WATCHLIST ── */
const WATCH_KEY = "srj_watchlist_v2";
function getWatch() { return JSON.parse(localStorage.getItem(WATCH_KEY) || "[]"); }
function saveWatch(a) { localStorage.setItem(WATCH_KEY, JSON.stringify(a)); }
function removeWatch(s) { saveWatch(getWatch().filter(x => x !== s)); loadAll(); }

async function renderWatchlist(quotes) {
  const g = qs("#watchlistContainer");
  const list = getWatch();
  if (!list.length) { g.innerHTML = `<div class="tile empty-msg">Add stocks to your watchlist from any stock page.</div>`; return; }

  // Fetch any missing watchlist quotes
  const missing = list.filter(s => !quotes[s]);
  if (missing.length) {
    const extra = await batchQuotes(missing);
    Object.assign(quotes, extra);
  }

  g.innerHTML = list.map(s => {
    const q = quotes[s];
    const ch = q && q.pc ? ((q.c - q.pc) / q.pc) * 100 : 0;
    return `
      <div class="tile">
        <div class="stock-sym clickable" onclick="goStock('${s}')">${s}</div>
        <div class="stock-price">${fmt(q?.c)}</div>
        <div class="stock-change ${ch >= 0 ? 'pos' : 'neg'}">${ch >= 0 ? '+' : ''}${ch.toFixed(2)}%</div>
        <button class="remove-btn" onclick="removeWatch('${s}')">Remove</button>
      </div>`;
  }).join("");
}

/* ── NEWS ── */
async function renderNews() {
  try {
    // Try multiple symbols for diverse news
    const symbols = ["AAPL", "MSFT", "TSLA", "NVDA"];
    let allNews = [];
    for (const sym of symbols) {
      try {
        const r = await fetch(`${API}/news?symbol=${sym}`);
        const data = await r.json();
        if (Array.isArray(data)) allNews = allNews.concat(data);
      } catch {}
    }
    // Deduplicate by headline and sort by date
    const seen = new Set();
    allNews = allNews.filter(n => {
      if (seen.has(n.headline)) return false;
      seen.add(n.headline);
      return true;
    }).sort((a, b) => (b.datetime || 0) - (a.datetime || 0));

    if (!allNews.length) { qs("#newsGrid").innerHTML = "<p style='color:#666'>News temporarily unavailable.</p>"; return; }
    qs("#newsGrid").innerHTML = allNews.slice(0, 8).map(n => `
      <a href="${n.url}" target="_blank" rel="noopener" class="news-card">
        ${n.image ? `<img src="${n.image}" class="news-img" alt="${n.headline}" loading="lazy" />` : ''}
        <div class="news-body">
          <div class="news-title">${n.headline}</div>
          <div class="news-source">${n.source} · ${new Date(n.datetime * 1000).toLocaleDateString()}</div>
          <div class="news-desc">${(n.summary || "").slice(0, 120)}...</div>
        </div>
      </a>
    `).join("");
  } catch {
    qs("#newsGrid").innerHTML = "<p>News temporarily unavailable.</p>";
  }
}

/* ── MAIN LOAD ── */
let allQuotes = {};

async function loadAll() {
  updateMarketStatus();

  // Batch ALL quotes in parallel
  const allSymbols = [
    ...INDICES.map(i => i.sym),
    ...TRENDING,
    ...SECTORS.map(s => s.sym),
    ...EXTRA,
    ...getWatch(),
  ];
  const unique = [...new Set(allSymbols)];
  allQuotes = await batchQuotes(unique);

  renderIndices(allQuotes);
  renderTrending(allQuotes);
  renderGainersLosers(allQuotes);
  renderSectors(allQuotes);
  renderWatchlist(allQuotes);
  renderNews();
}

/* ── INIT ── */
window.addEventListener("DOMContentLoaded", () => {
  bindSearch();
  loadAll();

  // Auto-refresh every 30 seconds
  setInterval(() => {
    updateMarketStatus();
    loadAll();
  }, 30000);
});
