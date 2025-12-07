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
        const res = await fetch(
