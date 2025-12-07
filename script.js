/* ============================================
   SRJahir Markets — Trading Dashboard Logic
   LIVE DATA from Hybrid Cloudflare API
   ============================================ */

const API = "https://autumn-band-75e8.surajmaitra1996.workers.dev";

/* ---------- UTILITIES ---------- */
const qs  = sel => document.querySelector(sel);
const qsa = sel => Array.from(document.querySelectorAll(sel));

function createEl(tag, cls, txt) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (txt) el.textContent = txt;
    return el;
}

function fmt(n) {
    if (n === undefined || n === null) return "—";
    return Number(n).toLocaleString("en-US");
}

/* ---------- SEARCH ---------- */
function bindSearch() {
    const input = qs("#searchInput");
    const btn = qs("#searchBtn");

    btn.onclick = () => goSearch(input.value.trim());
    input.addEventListener("keydown", e => {
        if (e.key === "Enter") goSearch(input.value.trim());
    });
}

function goSearch(q) {
    if (!q) return alert("Enter stock symbol");
    window.location = `stock.html?symbol=${q.toUpperCase()}`;
}

/* ---------- WATCHLIST ---------- */
const WATCH_KEY = "srj_watchlist_v2";

function getWatchlist() {
    try {
        return JSON.parse(localStorage.getItem(WATCH_KEY)) || [];
    } catch {
        return [];
    }
}

function saveWatchlist(list) {
    localStorage.setItem(WATCH_KEY, JSON.stringify(list));
}

function addWatch(symbol) {
    const list = getWatchlist();
    if (!list.includes(symbol)) {
        list.push(symbol);
        saveWatchlist(list);
        renderWatchlist();
    }
}

function removeWatch(symbol) {
    let list = getWatchlist();
    list = list.filter(s => s !== symbol);
    saveWatchlist(list);
    renderWatchlist();
}

/* ---------- LIVE DATA FETCHERS ---------- */

async function getQuote(symbol) {
    try {
        const res = await fetch(`${API}/quote?symbol=${symbol}`);
        return await res.json();
    } catch (e) {
        console.warn("quote error", symbol, e);
        return null;
    }
}

async function getNews() {
    try {
        const res = await fetch(`${API}/news?symbol=AAPL`); 
        return await res.json();
    } catch {
        return [];
    }
}

async function getProfile(symbol) {
    try {
        const res = await fetch(`${API}/profile?symbol=${symbol}`);
        return await res.json();
    } catch (e) {
        return {};
    }
}

async function getSparkline(symbol) {
    try {
        const res = await fetch(
            `${API}/candles?symbol=${symbol}&interval=1d&range=1m`
        );
        const data = await res.json();
        return data.candles || [];
    } catch {
        return [];
    }
}

/* ---------- INDICES ---------- */
const INDICES = [
    { name: "S&P 500", sym: "SPY" },
    { name: "NASDAQ", sym: "QQQ" },
    { name: "Dow Jones", sym: "DIA" },
    { name: "Nifty 50", sym: "^NSEI" },
    { name: "Sensex", sym: "^BSESN" },
    { name: "FTSE 100", sym: "^FTSE" }
];

async function renderIndices() {
    const grid = qs("#indicesGrid");
    grid.innerHTML = "<div>Loading...</div>";

    let html = "";

    for (const idx of INDICES) {
        const q = await getQuote(idx.sym);
        if (!q || !q.c) {
            html += `
            <div class="tile">
                <div class="index-name">${idx.name}</div>
                <div class="index-price">—</div>
                <div class="index-change">—</div>
            </div>`;
            continue;
        }

        const price = q.c;
        const change = ((q.c - q.pc) / q.pc) * 100;
        const cls = change >= 0 ? "pos" : "neg";

        html += `
        <div class="tile">
          <div class="index-name">${idx.name}</div>
          <div class="index-price">${fmt(price)}</div>
          <div class="index-change ${cls}">${change.toFixed(2)}%</div>
        </div>`;
    }

    grid.innerHTML = html;
}

/* ---------- TRENDING STOCKS ---------- */
const TRENDING = ["AAPL", "MSFT", "TSLA", "META", "AMZN", "NVDA"];

async function renderTrending() {
    const grid = qs("#trendingGrid");
    grid.innerHTML = "<div>Loading...</div>";

    let html = "";

    for (const s of TRENDING) {
        const q = await getQuote(s);
        const candles = await getSparkline(s);

        let change = 0;
        if (q && q.c && q.pc) {
            change = ((q.c - q.pc) / q.pc) * 100;
        }

        const cls = change >= 0 ? "pos" : "neg";

        html += `
        <div class="tile trending-tile" onclick="openStock('${s}')">
            <div class="trending-symbol">${s}</div>
            <div class="trending-price">${fmt(q?.c)}</div>
            <div class="${cls}">${change.toFixed(2)}%</div>
        </div>`;
    }

    grid.innerHTML = html;
}

function openStock(sym) {
    window.location = `stock.html?symbol=${sym}`;
}

/* ---------- WATCHLIST RENDER ---------- */

async function renderWatchlist() {
    const grid = qs("#watchlistContainer");
    const list = getWatchlist();

    if (list.length === 0) {
        grid.innerHTML = `<div class="tile">Nothing in watchlist</div>`;
        return;
    }

    let html = "";

    for (const s of list) {
        const q = await getQuote(s);
        let change = 0;
        if (q && q.c && q.pc) {
            change = ((q.c - q.pc) / q.pc) * 100;
        }

        const cls = change >= 0 ? "pos" : "neg";

        html += `
        <div class="tile watch-tile">
            <div class="trending-symbol">${s}</div>
            <div class="trending-price">${fmt(q.c)}</div>
            <div class="${cls}">${change.toFixed(2)}%</div>

            <button class="remove-btn" onclick="removeWatch('${s}')">Remove</button>
        </div>`;
    }

    grid.innerHTML = html;
}

/* ---------- NEWS ---------- */
async function renderNews() {
    const grid = qs("#newsGrid");
    grid.innerHTML = "<div>Loading news...</div>";

    const news = await getNews();

    if (!news || !Array.isArray(news) || news.length === 0) {
        grid.innerHTML = "<div>No news available</div>";
        return;
    }

    grid.innerHTML = news.slice(0, 12).map(n => `
      <div class="news-card">
        <div class="news-title">${n.headline || "News"}</div>
        <div class="news-time">${n.datetime ? new Date(n.datetime * 1000).toLocaleString() : ""}</div>
        <div class="news-desc">${n.summary?.slice(0, 140) || ""}...</div>
      </div>
    `).join("");
}

/* ---------- MAIN INIT ---------- */

window.addEventListener("DOMContentLoaded", async () => {
    bindSearch();
    renderIndices();
    renderTrending();
    renderWatchlist();
    renderNews();
});
