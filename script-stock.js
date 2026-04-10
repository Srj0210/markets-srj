/* ===============================================
   SRJahir Markets — Stock Detail v3.0
   TradingView-Style Professional Charts
   =============================================== */
const API = "https://autumn-band-75e8.surajmaitra1996.workers.dev";
const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));
const fmt = n => n ? Number(n).toLocaleString("en-US", {minimumFractionDigits:2, maximumFractionDigits:2}) : "—";
const params = new URLSearchParams(location.search);
const SYMBOL = (params.get("symbol") || "AAPL").toUpperCase();

const WATCH_KEY = "srj_watchlist_v2";
function getWatch() { return JSON.parse(localStorage.getItem(WATCH_KEY) || "[]"); }
function saveWatch(list) { localStorage.setItem(WATCH_KEY, JSON.stringify(list)); }
function toggleWatch() {
  const list = getWatch();
  if (list.includes(SYMBOL)) saveWatch(list.filter(x => x !== SYMBOL));
  else { list.push(SYMBOL); saveWatch(list); }
  updateWatchBtn();
}
function updateWatchBtn() {
  const btn = qs("#watchBtn");
  if (btn) btn.textContent = getWatch().includes(SYMBOL) ? "★ Watching" : "☆ Watch";
}

async function getQuote() { try { return await (await fetch(`${API}/quote?symbol=${SYMBOL}`)).json(); } catch { return {}; } }
async function getProfile() { try { return await (await fetch(`${API}/profile?symbol=${SYMBOL}`)).json(); } catch { return {}; } }
async function getNews() { try { return await (await fetch(`${API}/news?symbol=${SYMBOL}`)).json(); } catch { return []; } }
async function getCandles(range) {
  const now = Math.floor(Date.now() / 1000);
  let from, resolution;
  switch(range) {
    case "1D": from = now - 86400; resolution = "5"; break;
    case "1W": from = now - 7*86400; resolution = "15"; break;
    case "1M": from = now - 30*86400; resolution = "60"; break;
    case "6M": from = now - 180*86400; resolution = "D"; break;
    case "1Y": from = now - 365*86400; resolution = "D"; break;
    case "5Y": from = now - 5*365*86400; resolution = "W"; break;
    default: from = now - 30*86400; resolution = "60";
  }
  try {
    const res = await fetch(`${API}/candles?symbol=${SYMBOL}&resolution=${resolution}&from=${from}&to=${now}`);
    const data = await res.json();
    if (data.candles && Array.isArray(data.candles))
      return data.candles.map(c => ({ time: c.t > 1e10 ? c.t/1000 : c.t, open:c.o, high:c.h, low:c.l, close:c.c, volume:c.v||0 }));
    if (data.s === "ok" && data.t)
      return data.t.map((t,i) => ({ time:t, open:data.o[i], high:data.h[i], low:data.l[i], close:data.c[i], volume:data.v?.[i]||0 }));
    if (Array.isArray(data))
      return data.map(c => ({ time: c.t > 1e10 ? c.t/1000 : c.t, open:c.o, high:c.h, low:c.l, close:c.c, volume:c.v||0 }));
    return [];
  } catch { return []; }
}

async function loadHeader() {
  const [prof, q] = await Promise.all([getProfile(), getQuote()]);
  qs("#stockName").textContent = prof.name || SYMBOL;
  qs("#stockSymbol").textContent = SYMBOL + (prof.exchange ? ` · ${prof.exchange}` : "");
  if (q.c) {
    const change = ((q.c - q.pc) / q.pc) * 100;
    const diff = q.c - q.pc;
    qs("#stockPrice").textContent = "$" + fmt(q.c);
    qs("#stockChange").textContent = `${diff>=0?"+":""}${diff.toFixed(2)} (${change>=0?"+":""}${change.toFixed(2)}%)`;
    qs("#stockChange").classList.add(change >= 0 ? "pos" : "neg");
    document.title = `${SYMBOL} $${fmt(q.c)} ${change>=0?"+":""}${change.toFixed(2)}% — SRJahir Markets`;
  }
}

/* ══════════════════════════════════════════════════
   PROFESSIONAL CHART
   ══════════════════════════════════════════════════ */
let chart, candleSeries, areaSeries, volumeSeries;
let currentType = "area";

function initChart() {
  const container = qs("#chart");
  container.innerHTML = "";
  chart = LightweightCharts.createChart(container, {
    width: container.clientWidth, height: 420,
    layout: { background:{type:"solid",color:"#0c0f17"}, textColor:"#6b7280", fontSize:11, fontFamily:"Inter,sans-serif" },
    grid: { vertLines:{color:"rgba(255,255,255,0.025)"}, horzLines:{color:"rgba(255,255,255,0.025)"} },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,
      vertLine: { width:1, color:"rgba(59,130,246,0.5)", style:LightweightCharts.LineStyle.Dashed, labelBackgroundColor:"#1d4ed8" },
      horzLine: { width:1, color:"rgba(59,130,246,0.5)", style:LightweightCharts.LineStyle.Dashed, labelBackgroundColor:"#1d4ed8" },
    },
    timeScale: { borderColor:"rgba(255,255,255,0.06)", timeVisible:true, secondsVisible:false, rightOffset:5, barSpacing:6, fixLeftEdge:true, fixRightEdge:true },
    rightPriceScale: { borderColor:"rgba(255,255,255,0.06)", scaleMargins:{top:0.08,bottom:0.22} },
    watermark: { visible:true, fontSize:52, horzAlign:"center", vertAlign:"center", color:"rgba(255,255,255,0.025)", text:SYMBOL },
    handleScroll: { vertTouchDrag:false },
  });

  candleSeries = chart.addCandlestickSeries({
    upColor:"#22c55e", downColor:"#ef4444", borderUpColor:"#22c55e", borderDownColor:"#ef4444",
    wickUpColor:"#4ade80", wickDownColor:"#f87171", visible:false,
  });
  areaSeries = chart.addAreaSeries({
    topColor:"rgba(37,99,235,0.45)", bottomColor:"rgba(37,99,235,0.01)", lineColor:"#3b82f6", lineWidth:2,
    crosshairMarkerVisible:true, crosshairMarkerRadius:5, crosshairMarkerBorderColor:"#3b82f6", crosshairMarkerBackgroundColor:"#fff", visible:true,
  });
  volumeSeries = chart.addHistogramSeries({
    priceFormat:{type:"volume"}, priceScaleId:"vol",
  });
  chart.priceScale("vol").applyOptions({ scaleMargins:{top:0.82,bottom:0} });

  window.addEventListener("resize", () => chart.applyOptions({width:container.clientWidth}));

  // Tooltip legend
  const legend = document.createElement("div");
  legend.id = "chartLegend";
  legend.style.cssText = "position:absolute;top:10px;left:14px;z-index:10;font-size:12px;color:#6b7280;pointer-events:none;font-family:Inter,sans-serif;";
  container.style.position = "relative";
  container.appendChild(legend);

  chart.subscribeCrosshairMove(param => {
    if (!param.time || !param.seriesData) { legend.innerHTML = ""; return; }
    if (currentType === "candle") {
      const d = param.seriesData.get(candleSeries);
      if (d) {
        const c = d.close >= d.open ? "#22c55e" : "#ef4444";
        legend.innerHTML = `<span style="color:${c}">O</span> <b>${d.open?.toFixed(2)}</b> <span style="color:${c};margin-left:6px">H</span> <b>${d.high?.toFixed(2)}</b> <span style="color:${c};margin-left:6px">L</span> <b>${d.low?.toFixed(2)}</b> <span style="color:${c};margin-left:6px">C</span> <b>${d.close?.toFixed(2)}</b>`;
      }
    } else {
      const d = param.seriesData.get(areaSeries);
      if (d) legend.innerHTML = `<b style="color:#3b82f6;font-size:15px">$${d.value?.toFixed(2)}</b>`;
    }
  });
}

async function loadChart(range = "1M") {
  const raw = await getCandles(range);
  if (!raw.length) {
    qs("#chart").innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:420px;color:#555;font-size:14px;flex-direction:column"><div style="font-size:36px;margin-bottom:8px">📊</div><div>Chart data unavailable</div><div style="font-size:12px;color:#444;margin-top:4px">Market may be closed</div></div>`;
    return;
  }
  raw.sort((a,b) => a.time - b.time);
  const seen = new Set();
  const candles = raw.filter(c => { if(seen.has(c.time))return false; seen.add(c.time); return c.open && c.close; });
  const lineData = candles.map(c => ({time:c.time, value:c.close}));
  const volData = candles.map(c => ({ time:c.time, value:c.volume, color: c.close>=c.open ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)" }));

  candleSeries.setData(candles);
  areaSeries.setData(lineData);
  volumeSeries.setData(volData);
  chart.timeScale().fitContent();
}

function setChartType(type) {
  currentType = type;
  candleSeries.applyOptions({visible: type==="candle"});
  areaSeries.applyOptions({visible: type==="area"});
  qsa(".type-btn").forEach(b => b.classList.toggle("active", b.dataset.type === type));
}

function bindChartControls() {
  qsa(".range").forEach(btn => {
    btn.onclick = () => {
      qsa(".range").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      initChart(); // reinit for clean state
      setChartType(currentType);
      loadChart(btn.dataset.range);
    };
  });
  qsa(".type-btn").forEach(btn => { btn.onclick = () => setChartType(btn.dataset.type); });
}

async function loadFundamentals() {
  const [p, q] = await Promise.all([getProfile(), getQuote()]);
  const row = (l, v) => `<li><span style="color:#6b7280">${l}</span><strong style="float:right">${v||"—"}</strong></li>`;
  qs("#fundList").innerHTML =
    row("Market Cap", p.marketCapitalization ? "$"+(p.marketCapitalization/1000).toFixed(1)+"B" : "—") +
    row("Exchange", p.exchange) + row("Industry", p.finnhubIndustry) + row("IPO Date", p.ipo) +
    row("Country", p.country) + row("Day High", q.h ? "$"+fmt(q.h) : "—") +
    row("Day Low", q.l ? "$"+fmt(q.l) : "—") + row("Prev Close", q.pc ? "$"+fmt(q.pc) : "—") +
    row("Open", q.o ? "$"+fmt(q.o) : "—");
}

async function loadRelatedNews() {
  const c = qs("#relatedNews");
  const news = await getNews();
  if (!news.length) { c.innerHTML = '<p style="color:#555;font-size:14px">No recent news.</p>'; return; }
  c.innerHTML = news.slice(0,6).map(n => `
    <a href="${n.url}" target="_blank" rel="noopener" style="display:block;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);text-decoration:none;color:inherit">
      <div style="font-size:14px;font-weight:600;line-height:1.4;color:#e6e6e6">${n.headline}</div>
      <div style="font-size:11px;color:#555;margin-top:4px">${n.source} · ${new Date(n.datetime*1000).toLocaleDateString()}</div>
    </a>`).join("");
}

window.addEventListener("DOMContentLoaded", async () => {
  updateWatchBtn();
  qs("#watchBtn").onclick = toggleWatch;
  await loadHeader();
  initChart();
  bindChartControls();
  loadChart("1M");
  loadFundamentals();
  loadRelatedNews();
});
