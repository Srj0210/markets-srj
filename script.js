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

/* =====================================================
   🔥 TASK 1 — GLOBAL SEARCH FIX (Auto Exchange Detection)
   ===================================================== */

/* ---- Search API (Finnhub-style symbol lookup) ---- */
async function searchSymbol(query) {
    try {
        const res = await fetch(`${API}/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();

        if (!data || !data.result || data.result.length === 0) {
            return null;
        }

        // Rank best matches
        const results = data.result.sort((a, b) => {
            const rankA =
                (a.symbol.includes("NYSE") || a.symbol.includes("NASDAQ")) ? 0 :
                (a.description.toLowerCase().includes(query.toLowerCase()) ? 1 : 2);

            const rankB =
                (b.symbol.includes("NYSE") || b.symbol.includes("NASDAQ")) ? 0 :
                (b.description.toLowerCase().includes(query.toLowerCase()) ? 1 : 2);

            return rankA - rankB;
        });

        return results[0]; // return best match
    } catch (e) {
        console.error("Search failed:", e);
        return null;
    }
}

/* ---- Smart Search Redirect ---- */
async function doSearch(query) {
    if (!query) {
        alert("Type stock name or symbol");
        return;
    }

    const match = await searchSymbol(query);

    if (!match) {
        alert(`No stock found for "${query}". Try symbols like AAPL, TSLA, BMW.DE`);
        return;
    }

    const symbol = match.symbol;

    // Final safety check
    if (!symbol || symbol.trim() === "" || symbol === "0") {
        alert("Symbol not supported or malformed.");
        return;
    }

    // Redirect to stock page with correct symbol
    window.location = `stock.html?symbol=${encodeURIComponent(symbol)}`;
}

/* ---- Bind Search Input ---- */
function bindSearch() {
    const input = qs("#searchInput");
    const btn = qs("#searchBtn");

    btn.onclick = () => doSearch(input.value.trim());
    input.addEventListener("keydown", e => {
        if (e.key === "Enter") doSearch(input.value.trim());
    });
}

/* ===================================================== */


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

/* ---------- TRENDING ---------- */
const TRENDING = ["AAPL", "MSFT", "TSLA", "META", "AMZN", "NVDA"];

async function renderTrending() {
    const grid = qs("#trendingGrid");
    grid.innerHTML = "<div>Loading...</div>";

    let html = "";

    for (const s of TRENDING) {
        const q = await getQuote(s);

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

/* ---------- WATCHLIST ---------- */

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
            <div class="trending-price">${fmt(q?.c)}</div>
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

/* ---------- INITIALIZE PAGE ---------- */

window.addEventListener("DOMContentLoaded", async () => {
    bindSearch();            // Updated smart global search
    renderIndices();
    renderTrending();
    renderWatchlist();
    renderNews();
});