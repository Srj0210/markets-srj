/* ===============================================
   SRJahir Markets — Stock Detail Logic (v2)
   =============================================== */

const API = "https://autumn-band-75e8.surajmaitra1996.workers.dev";
const qs = s => document.querySelector(s);
const fmt = n => Number(n).toLocaleString("en-US");

const params = new URLSearchParams(location.search);
const SYMBOL = (params.get("symbol") || "").toUpperCase();

/* ------------------------------
   WATCHLIST
   ------------------------------ */
const WATCH_KEY = "srj_watchlist_v2";

function getWatch(){return JSON.parse(localStorage.getItem(WATCH_KEY)||"[]")}
function saveWatch(a){localStorage.setItem(WATCH_KEY,JSON.stringify(a))}
function toggleWatch(){
  let l=getWatch();
  if(l.includes(SYMBOL)) l=l.filter(x=>x!==SYMBOL);
  else l.push(SYMBOL);
  saveWatch(l);
  updateWatchBtn();
}
function updateWatchBtn(){
  const btn=qs("#watchBtn");
  const l=getWatch();
  btn.textContent = l.includes(SYMBOL) ? "★ Watching" : "☆ Watch";
}

/* ------------------------------
   API CALLS
   ------------------------------ */

async function getQuote(){
  const r=await fetch(`${API}/quote?symbol=${SYMBOL}`);
  return await r.json();
}
async function getProfile(){
  const r=await fetch(`${API}/profile?symbol=${SYMBOL}`);
  return await r.json();
}
async function getNews(){
  const r=await fetch(`${API}/news?symbol=${SYMBOL}`);
  return await r.json();
}
async function getCandles(range){
  let interval="1d", r="1m";

  if(range==="1W") r="1m";
  if(range==="1M") r="1m";
  if(range==="6M") r="6m";
  if(range==="1Y") r="1y";
  if(range==="5Y") r="5y";

  const res=await fetch(`${API}/candles?symbol=${SYMBOL}&interval=${interval}&range=${r}`);
  return await res.json();
}

/* ------------------------------
   HEADER
   ------------------------------ */

async function loadHeader(){
  const p=await getProfile();
  const q=await getQuote();

  qs("#stockName").textContent = p.name || SYMBOL;
  qs("#stockSymbol").textContent = SYMBOL;

  const price = q.c;
  const change = ((q.c - q.pc) / q.pc) * 100;

  qs("#stockPrice").textContent = fmt(price);
  qs("#stockChange").textContent = change.toFixed(2)+"%";
  qs("#stockChange").classList.add(change>=0?"pos":"neg");
}

/* ------------------------------
   CHART
   ------------------------------ */

let chart, candleSeries, lineSeries;

function initChart(){
  chart = LightweightCharts.createChart(qs("#chart"), {
    layout:{ background:{color:"#0b0e15"}, textColor:"#d1d1d1" },
    grid: {
      vertLines:{color:"rgba(255,255,255,0.04)"},
      horzLines:{color:"rgba(255,255,255,0.04)"}
    },
    timeScale:{borderColor:"#333"},
    priceScale:{borderColor:"#333"},
  });

  candleSeries = chart.addCandlestickSeries({
    upColor:"#25d97a", downColor:"#ff4b4b",
    wickUpColor:"#25d97a", wickDownColor:"#ff4b4b",
    borderVisible:false
  });

  lineSeries = chart.addLineSeries({
    color:"#4da3ff", lineWidth:2
  });
}

async function loadChart(range="1M"){
  const d=await getCandles(range);
  if(!d || !d.candles) return;

  const candles = d.candles.map(c=>({
    time: c.t/1000,
    open: c.o, high:c.h, low:c.l, close:c.c
  }));

  const line = candles.map(c=>({ time:c.time, value:c.close }));

  candleSeries.setData(candles);
  lineSeries.setData(line);
}

/* Controls */
function bindChartControls(){
  qsa(".range").forEach(b=>{
    b.onclick=()=>{
      qsa(".range").forEach(x=>x.classList.remove("active"));
      b.classList.add("active");
      loadChart(b.dataset.range);
    };
  });

  qsa("input[name='ctype']").forEach(r=>{
    r.onchange=()=>{
      const t=qs("input[name='ctype']:checked").value;
      if(t==="line"){
        lineSeries.applyOptions({visible:true});
        candleSeries.applyOptions({visible:false});
      }else{
        lineSeries.applyOptions({visible:false});
        candleSeries.applyOptions({visible:true});
      }
    };
  });
}

/* ------------------------------
   FUNDAMENTALS
   ------------------------------ */

async function loadFundamentals(){
  const p=await getProfile();
  qs("#fundList").innerHTML = `
    <li>Market Cap: ${fmt(p.marketCapitalization)}</li>
    <li>Exchange: ${p.exchange}</li>
    <li>Industry: ${p.finnhubIndustry}</li>
    <li>IPO Date: ${p.ipo}</li>
    <li>Country: ${p.country}</li>
  `;
}

/* ------------------------------
   NEWS
   ------------------------------ */

async function loadRelatedNews(){
  const n=await getNews();
  const box=qs("#relatedNews");

  if(!n || !n.length){
    box.innerHTML="<div>No news available</div>";
    return;
  }

  box.innerHTML = n.slice(0,8).map(a=>`
    <div class="news-card">
      <div class="news-title">${a.headline}</div>
      <div class="news-time">${new Date(a.datetime*1000).toLocaleString()}</div>
      <div class="news-desc">${a.summary?.slice(0,140)||""}...</div>
    </div>
  `).join("");
}

/* ------------------------------
   INIT
   ------------------------------ */

window.addEventListener("DOMContentLoaded", async ()=>{
  updateWatchBtn();
  qs("#watchBtn").onclick=toggleWatch;

  await loadHeader();
  initChart();
  bindChartControls();
  loadChart("1M");

  loadFundamentals();
  loadRelatedNews();
});