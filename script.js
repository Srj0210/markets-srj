/* ============================================
   SRJahir Markets — Global Search (S1)
   ============================================ */

const API = "https://autumn-band-75e8.surajmaitra1996.workers.dev";

const qs  = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

/* ------------------------------
   FETCH SEARCH RESULTS
   ------------------------------ */
async function searchSymbols(q) {
    if (!q) return [];

    const res = await fetch(`${API}/search?query=${encodeURIComponent(q)}`);
    const data = await res.json();

    return data.result || [];
}

/* ------------------------------
   SHOW SUGGESTIONS (S1)
   ------------------------------ */
function showSuggestions(list) {
    const box = qs("#suggestBox");
    box.innerHTML = "";

    if (!list.length) {
        box.style.display = "none";
        return;
    }

    box.style.display = "block";

    list.forEach(item => {
        const div = document.createElement("div");
        div.className = "s-item";

        const logo = document.createElement("img");
        logo.className = "s-logo";
        logo.src = `https://finnhub.io/api/logo?symbol=${item.symbol}`;

        const info = document.createElement("div");
        info.innerHTML = `
            <div class="s-symbol">${item.symbol}</div>
            <div class="s-name">${item.description}</div>
        `;

        div.appendChild(logo);
        div.appendChild(info);

        div.onclick = () => {
            location.href = `stock.html?symbol=${item.symbol}`;
        };

        box.appendChild(div);
    });
}

/* ------------------------------
   BIND SEARCH
   ------------------------------ */
function bindSearch() {
    const input = qs("#searchInput");
    input.addEventListener("input", async () => {
        const q = input.value.trim();
        if (!q) return showSuggestions([]);

        const list = await searchSymbols(q);
        showSuggestions(list.slice(0, 6));
    });

    // Close on click outside
    document.addEventListener("click", e => {
        if (!qs(".search-wrapper").contains(e.target)) {
            qs("#suggestBox").style.display = "none";
        }
    });
}

/* ------------------------------
   LIVE DATA RENDERERS (unchanged)
   ------------------------------ */

/* utilities */
function fmt(n){return Number(n).toLocaleString("en-US")}

/* WATCHLIST */
const WATCH_KEY = "srj_watchlist_v2";
function getWatchlist(){return JSON.parse(localStorage.getItem(WATCH_KEY)||"[]")}
function saveWatchlist(a){localStorage.setItem(WATCH_KEY,JSON.stringify(a))}
function removeWatch(s){let l=getWatchlist().filter(x=>x!==s);saveWatchlist(l);renderWatchlist()}

/* Quote fetcher */
async function getQuote(sym){
    try{
        const r=await fetch(`${API}/quote?symbol=${sym}`);
        return await r.json();
    }catch{return null}
}

/* Many render functions (indices, trending, watchlist, news) SAME AS BEFORE */

/* ------------------------------
   INITIALIZE PAGE
   ------------------------------ */
window.addEventListener("DOMContentLoaded", () => {
    bindSearch();
    renderIndices();
    renderTrending();
    renderWatchlist();
    renderNews();
});