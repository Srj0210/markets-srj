/* Main client JS for SRJahir Markets (homepage + stock page) */
/* IMPORTANT: You can replace API_KEY with your new key if needed */
const API_KEY = "9H6LDA4TXT9Q6VO4"; // <= your key (visible on frontend)
const AV_BASE = "https://www.alphavantage.co/query";
const NEWS_FN = "NEWS_SENTIMENT"; // Alpha Vantage news endpoint name

/* Utilities */
function qs(sel){return document.querySelector(sel)}
function qsa(sel){return Array.from(document.querySelectorAll(sel))}
function setText(sel, txt){const el=qs(sel); if(el) el.textContent=txt}

/* Date */
(function setDates(){
  const now = new Date();
  const opts = { year:'numeric', month:'short', day:'numeric' };
  const dateStr = now.toLocaleDateString(undefined, opts);
  setText('#edition-date', dateStr);
  setText('#foot-date', dateStr);
})();

/* THEME TOGGLE (light/dark simple by toggling body class) */
(function themeSetup(){
  const btn = qs('#theme-toggle');
  if(!btn) return;
  const saved = localStorage.getItem('siteTheme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  btn.onclick = () => {
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', cur);
    localStorage.setItem('siteTheme', cur);
  }
})();

/* WATCHLIST (localStorage) */
const WATCH_KEY = 'srj_watchlist';
function getWatch(){ try { return JSON.parse(localStorage.getItem(WATCH_KEY)||'[]') } catch(e){return []} }
function saveWatch(arr){ localStorage.setItem(WATCH_KEY, JSON.stringify(arr)) }
function addToWatch(sym){
  const list = getWatch();
  if(!list.includes(sym)) list.push(sym);
  saveWatch(list);
  renderWatch();
}
function removeFromWatch(sym){
  let list = getWatch();
  list = list.filter(s=>s!==sym);
  saveWatch(list);
  renderWatch();
}
function renderWatch(){
  const container = qs('#watchlist');
  if(!container) return;
  const list = getWatch();
  container.innerHTML = list.length ? list.map(s=>`<li>${s} <button data-sym="${s}" class="remove-watch">Remove</button></li>`).join('') : '<li class="small-muted">No items. Add from search.</li>';
  qsa('.remove-watch').forEach(btn=>btn.onclick=e=>{
    const s = e.target.dataset.sym;
    removeFromWatch(s);
  });
}

/* SEARCH */
function bindSearch(){
  const input = qs('#searchInput');
  const btn = qs('#searchBtn');
  if(!input || !btn) return;
  btn.onclick = () => doSearch(input.value.trim());
  input.addEventListener('keydown', (e)=>{ if(e.key==='Enter') doSearch(input.value.trim()) });
}

/* Basic search: Alpha Vantage SYMBOL_SEARCH */
async function doSearch(q){
  if(!q) return alert('Type symbol or company');
  const url = `${AV_BASE}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(q)}&apikey=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const matches = data.bestMatches||[];
  // show top match or list
  if(matches.length===0) return alert('No matches found');
  const top = matches[0];
  const symbol = top['1. symbol'];
  // open stock page
  window.location = `stock.html?symbol=${encodeURIComponent(symbol)}`;
}

/* Indices to show (common indices + some mapped symbols for AlphaVantage where applicable) */
const INDICES = [
  {id:'S&P 500', sym:'^GSPC', source:'GLOBAL'},
  {id:'NASDAQ', sym:'^IXIC', source:'GLOBAL'},
  {id:'DOW JONES', sym:'^DJI', source:'GLOBAL'},
  {id:'FTSE 100', sym:'^FTSE', source:'GLOBAL'},
  {id:'NIKKEI', sym:'^N225', source:'GLOBAL'},
  {id:'NIFTY 50', sym:'^NSEI', source:'GLOBAL'},
  {id:'SENSEX', sym:'^BSESN', source:'GLOBAL'},
];

/* Because Alpha Vantage doesn't provide global indices via GLOBAL_QUOTE for caret symbols reliably,
   we'll fetch S&P/NASDAQ via sample tickers or use a fallback. For simplicity, this demo uses some
   representative ETFs where possible. */
const INDEX_SYMBOL_MAP = {
  '^GSPC':'^GSPC', '^IXIC':'^IXIC', '^DJI':'^DJI', '^FTSE':'^FTSE', '^N225':'^N225', '^NSEI':'^NSEI', '^BSESN':'^BSESN'
};

/* Fetch a global quote (AlphaVantage GLOBAL_QUOTE) */
async function fetchGlobalQuote(symbol){
  // Use GLOBAL_QUOTE
  const url = `${AV_BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data['Global Quote'] || null;
}

/* Render indices table */
async function renderIndices(){
  const tbody = qs('#indicesTable tbody');
  if(!tbody) return;
  tbody.innerHTML = '<tr><td colspan="3">Loading indices…</td></tr>';
  // We'll attempt to fetch for a few known ETFs to approximate indices for free API; fallback to static if fails
  const rows = [];
  for(const ind of INDICES){
    try{
      // Try to map to a USD ETF for reliable data (e.g., S&P -> SPY)
      let sym = ind.sym;
      // mapping quick fallback
      if(ind.id==='S&P 500') sym='SPY';
      if(ind.id==='NASDAQ') sym='QQQ';
      if(ind.id==='DOW JONES') sym='DIA';
      if(ind.id==='FTSE 100') sym='ISF.L';
      if(ind.id==='NIKKEI') sym='^N225';
      if(ind.id==='NIFTY 50') sym='^NSEI';
      if(ind.id==='SENSEX') sym='^BSESN';
      const q = await fetchGlobalQuote(sym);
      if(q){
        const price = parseFloat(q['05. price']).toFixed(2);
        const chg = parseFloat(q['10. change percent']||0).toFixed(2);
        rows.push(`<tr><td>${ind.id}</td><td>${price}</td><td class="${chg>=0?'pos':'neg'}">${chg}%</td></tr>`);
      } else {
        rows.push(`<tr><td>${ind.id}</td><td>—</td><td>—</td></tr>`);
      }
    } catch(e){
      rows.push(`<tr><td>${ind.id}</td><td>—</td><td>—</td></tr>`);
    }
  }
  tbody.innerHTML = rows.join('');
}

/* Market mini cards (sample tickers) */
const SAMPLE_TICKS = ['AAPL','MSFT','AMZN','TSLA','GOOGL','NVDA','META','BABA'];
async function renderMarketCards(){
  const wrap = qs('#marketCards');
  if(!wrap) return;
  const html = SAMPLE_TICKS.map(s=>`<div class="market-card"><strong>${s}</strong> <span class="small-muted" id="mini-${s}">Loading…</span> <button data-sym="${s}" class="open-stock btn-ghost">Open</button></div>`).join('');
  wrap.innerHTML = html;
  qsa('.open-stock').forEach(b=>{
    b.onclick=e=>{ const s = e.target.dataset.sym; window.location=`stock.html?symbol=${encodeURIComponent(s)}`; }
  });

  // fetch mini prices
  for(const s of SAMPLE_TICKS){
    try{
      const q = await fetchGlobalQuote(s);
      if(q){
        const price = parseFloat(q['05. price']).toFixed(2);
        const chg = parseFloat(q['10. change percent']||0).toFixed(2);
        const el = qs(`#mini-${s}`);
        if(el) el.textContent = `${price} ${chg>=0?'+':''}${chg}%`;
      }
    } catch(e){}
  }
}

/* Breaking ticker & news (AlphaVantage NEWS_SENTIMENT) */
async function fetchNews(){
  // Use Alpha Vantage NEWS_SENTIMENT (free but limited)
  try {
    const url = `${AV_BASE}?function=${NEWS_FN}&apikey=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const items = data.feed || data.items || [];
    // render top 6
    const newsGrid = qs('#newsGrid');
    if(newsGrid){
      newsGrid.innerHTML = items.slice(0,6).map(it=>{
        const title = it.title || it.headline || it.summary || 'News';
        const time = it.time_published ? new Date(it.time_published).toLocaleString() : '';
        const summary = it.summary ? it.summary.substring(0,180) : '';
        return `<div class="news-item"><div><h4>${title}</h4><div class="small-muted">${time}</div><p>${summary}</p></div></div>`;
      }).join('');
    }
    // ticker
    const ticker = qs('#breakingTicker');
    if(ticker){
      const tick = items.slice(0,8).map(it => it.title||it.headline).filter(Boolean).join(' • ');
      ticker.textContent = tick || 'Market headlines will appear here.';
    }
    // top lists
    const gainers = qs('#gainersList');
    const losers = qs('#losersList');
    if(gainers) gainers.innerHTML = items.slice(0,5).map(it => `<li>${it.title||it.headline}</li>`).join('');
    if(losers) losers.innerHTML = items.slice(5,10).map(it => `<li>${it.title||it.headline}</li>`).join('');
  } catch(e){
    console.warn('news fetch fail', e);
  }
}

/* On load */
window.addEventListener('DOMContentLoaded', async ()=>{
  renderWatch();
  bindSearch();
  renderIndices();
  renderMarketCards();
  fetchNews();

  // open handlers (delegation)
  document.body.addEventListener('click', e=>{
    if(e.target.matches('.mini-open') || e.target.matches('.open-stock')) return;
  });
});
