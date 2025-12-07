/* ============================================
   SRJahir Markets — Working Stable Version
   ============================================ */

const API = "https://autumn-band-75e8.surajmaitra1996.workers.dev";

const qs  = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

function fmt(n){
  if(!n && n!==0) return "—";
  return Number(n).toLocaleString("en-US");
}

/* ----------------------------
   Search Suggestion (SAFE)
----------------------------- */

async function searchSymbols(q){
    if(!q) return [];
    try{
        const res = await fetch(`${API}/search?query=${q}`);
        const data = await res.json();
        return data.result?.slice(0,5) || [];
    }catch{
        return [];
    }
}

function showSuggest(list){
    const box = qs("#suggestBox");
    if(!list.length){
        box.style.display = "none";
        return;
    }
    box.style.display = "block";
    box.innerHTML = list.map(s => `
      <div class="s-item" onclick="goStock('${s.symbol}')">
        <div class="s-symbol">${s.symbol}</div>
        <div class="s-name">${s.description}</div>
      </div>
    `).join("");
}

function bindSearch(){
    const i = qs("#searchInput");

    i.addEventListener("input", async () => {
        const q = i.value.trim();
        if(!q){ showSuggest([]); return; }

        const data = await searchSymbols(q);
        showSuggest(data);
    });

    document.addEventListener("click", e => {
        if(!qs(".search-wrapper").contains(e.target)){
            qs("#suggestBox").style.display = "none";
        }
    });
}

function goStock(sym){
    location.href = `stock.html?symbol=${sym}`;
}

/* ----------------------------
   INDICES
----------------------------- */

const INDICES = [
  {name:"S&P 500", sym:"SPY"},
  {name:"NASDAQ", sym:"QQQ"},
  {name:"Dow Jones", sym:"DIA"},
  {name:"Nifty 50", sym:"^NSEI"},
  {name:"Sensex", sym:"^BSESN"},
  {name:"FTSE 100", sym:"^FTSE"}
];

async function getQuote(symbol){
    try{
        const r = await fetch(`${API}/quote?symbol=${symbol}`);
        return await r.json();
    }catch{
        return null;
    }
}

async function renderIndices(){
    const g = qs("#indicesGrid");
    let html = "";

    for(const i of INDICES){
        const q = await getQuote(i.sym);
        if(!q || !q.c){
            html += `
              <div class="tile">
                <div>${i.name}</div>
                <div>—</div>
                <div>—</div>
              </div>`;
            continue;
        }

        const ch = ((q.c - q.pc)/q.pc)*100;
        html += `
          <div class="tile">
            <div>${i.name}</div>
            <div>${fmt(q.c)}</div>
            <div class="${ch>=0?'pos':'neg'}">${ch.toFixed(2)}%</div>
          </div>`;
    }

    g.innerHTML = html;
}

/* ----------------------------
   TRENDING
----------------------------- */

const TRENDING = ["AAPL","MSFT","TSLA","META","AMZN","NVDA"];

async function renderTrending(){
    const g = qs("#trendingGrid");
    let html = "";

    for(const s of TRENDING){
        const q = await getQuote(s);
        const ch = q && q.pc ? ((q.c-q.pc)/q.pc)*100 : 0;

        html += `
          <div class="tile" onclick="goStock('${s}')">
            <div>${s}</div>
            <div>${fmt(q?.c)}</div>
            <div class="${ch>=0?'pos':'neg'}">${ch.toFixed(2)}%</div>
          </div>`;
    }

    g.innerHTML = html;
}

/* ----------------------------
   WATCHLIST
----------------------------- */

const WATCH_KEY = "srj_watchlist_v2";
function getWatch(){return JSON.parse(localStorage.getItem(WATCH_KEY)||"[]")}
function saveWatch(a){localStorage.setItem(WATCH_KEY,JSON.stringify(a))}
function removeWatch(s){
    saveWatch(getWatch().filter(x=>x!==s));
    renderWatchlist();
}

async function renderWatchlist(){
    const g = qs("#watchlistContainer");
    const list = getWatch();

    if(list.length===0){
        g.innerHTML = `<div class="tile">Nothing in watchlist</div>`;
        return;
    }

    let html = "";
    for(const s of list){
        const q = await getQuote(s);
        const ch = q && q.pc ? ((q.c-q.pc)/q.pc)*100 : 0;

        html += `
          <div class="tile">
            <div>${s}</div>
            <div>${fmt(q?.c)}</div>
            <div class="${ch>=0?'pos':'neg'}">${ch.toFixed(2)}%</div>
            <button class="remove-btn" onclick="removeWatch('${s}')">Remove</button>
          </div>`;
    }

    g.innerHTML = html;
}

/* ----------------------------
   NEWS
----------------------------- */

async function renderNews(){
    try{
        const r = await fetch(`${API}/news?symbol=AAPL`);
        const data = await r.json();

        qs("#newsGrid").innerHTML = data.slice(0,10).map(n=>`
          <div class="news-card">
            <div class="news-title">${n.headline}</div>
            <div class="news-desc">${n.summary.slice(0,120)}...</div>
          </div>
        `).join("");

    }catch{
        qs("#newsGrid").innerHTML = "News unavailable";
    }
}

/* ----------------------------
   INIT
----------------------------- */

window.addEventListener("DOMContentLoaded",()=>{
    bindSearch();
    renderIndices();
    renderTrending();
    renderWatchlist();
    renderNews();
});