/* ===============================================
   SRJahir Markets — Stock Detail Page Logic
   =============================================== */

const API = "https://autumn-band-75e8.surajmaitra1996.workers.dev";

const qs  = s => document.querySelector(s);
const fmt = n => Number(n).toLocaleString("en-US");

/* -------- GET URL SYMBOL -------- */
const params = new URLSearchParams(location.search);
const SYMBOL = (params.get("symbol") || "").toUpperCase();

/* -------- WATCHLIST -------- */
const WATCH_KEY = "srj_watchlist_v2";

function getWatch() {
  return JSON.parse(localStorage.getItem(WATCH_KEY) || "[]");
}
function saveWatch(d) {
  localStorage.setItem(WATCH_KEY, JSON.stringify(d));
}
function toggleWatch() {
  const list = getWatch();
  if (list.includes(SYMBOL)) {
    saveWatch(list.filter(s => s !== SYMBOL));
  } else {
    list.push(SYMBOL);
    saveWatch(list);
  }
  updateWatchBtn();
}
function updateWatchBtn() {
  const btn = qs("#watchBtn");
  const list = getWatch();
  btn.textContent = list.includes(SYMBOL) ? "★ Watching" : "☆ Watch";
}

/* -------- API CALLS -------- */

async function getQuote() {
  const res = await fetch(`${API}/quote?symbol=${SYMBOL}`);
  return await res.json();
}

async function getProfile() {
  const res = await fetch(`${API}/profile?symbol=${SYMBOL}`);
  return await res.json();
}

async function getNews() {
  const res = await fetch(`${API}/news?symbol=${SYMBOL}`);
  return await res.json();
}

async function getCandles(range) {
  let interval = "1d";
  let r = "1m";

  if (range === "1W") r = "1m";
  if (range === "1M") r = "1m";
  if (range === "6M") r = "6m";
  if (range === "1Y") r = "1y";
  if (range === "5Y") r = "5y";

  const res = await fetch(
    `${API}/candles?symbol=${SYMBOL}&interval=${interval}&range=${r}`
  );

  return await res.json();
}

/* -------- RENDER MAIN PRICE -------- */

async function loadHeader() {
  const profile = await getProfile();
  const q = await getQuote();

  qs("#stockName").textContent = profile.name || SYMBOL;
  qs("#stockSymbol").textContent = SYMBOL;

  const price = q.c;
  const change = ((q.c - q.pc) / q.pc) * 100;

  qs("#stockPrice").textContent = fmt(price);
  qs("#stockChange").textContent = change.toFixed(2) + "%";
  qs("#stockChange").classList.add(change >= 0 ? "pos" : "neg");
}

/* -------- TRADINGVIEW CHART -------- */

let chart, candleSeries, lineSeries;

function initChart() {
  chart = LightweightCharts.createChart(qs("#chart"), {
    layout: {
      background: { color: "#0c0f17" },
      textColor: "#d1d1d1",
    },
    grid: {
      vertLines: { color: "rgba(255,255,255,0.04)" },
      horzLines: { color: "rgba(255,255,255,0.04)" },
    },
    timeScale: { borderColor: "#333" },
    priceScale: { borderColor: "#333" },
  });

  candleSeries = chart.addCandlestickSeries({
    upColor: "#26d37d",
    downColor: "#ff4d4d",
    borderVisible: false,
    wickUpColor: "#26d37d",
    wickDownColor: "#ff4d4d"
  });

  lineSeries = chart.addLineSeries({
    color: "#4da3ff",
    lineWidth: 2
  });

  lineSeries.applyOptions({ visible: true });
  candleSeries.applyOptions({ visible: false });
}

async function loadChart(range = "1M") {
  const data = await getCandles(range);

  if (!data || !data.candles) return;

  const candles = data.candles.map(c => ({
    time: c.t / 1000,
    open: c.o,
    high: c.h,
    low: c.l,
    close: c.c
  }));

  const line = candles.map(c => ({
    time: c.time,
    value: c.close
  }));

  candleSeries.setData(candles);
  lineSeries.setData(line);
}

/* -------- CHART CONTROLS -------- */

function bindChartControls() {
  qsa(".range").forEach(btn => {
    btn.onclick = () => {
      qsa(".range").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      loadChart(btn.dataset.range);
    };
  });

  qsa("input[name='ctype']").forEach(r => {
    r.onchange = () => {
      const type = qs("input[name='ctype']:checked").value;

      if (type === "line") {
        lineSeries.applyOptions({ visible: true });
        candleSeries.applyOptions({ visible: false });
      } else {
        lineSeries.applyOptions({ visible: false });
        candleSeries.applyOptions({ visible: true });
      }
    };
  });
}

/* -------- FUNDAMENTALS -------- */

async function loadFundamentals() {
  const p = await getProfile();
  const list = qs("#fundList");

  list.innerHTML = `
    <li>Market Cap: ${fmt(p.marketCapitalization)}</li>
    <li>Exchange: ${p.exchange || "—"}</li>
    <li>Industry: ${p.finnhubIndustry || "—"}</li>
    <li>IPO Date: ${p.ipo || "—"}</li>
    <li>Country: ${p.country || "—"}</li>
  `;
}

/* -------- RELATED NEWS -------- */

async function loadRelatedNews() {
  const container = qs("#relatedNews");
  const news = await getNews();

  if (!news || news.length === 0) {
    container.innerHTML = "<div>No news available</div>";
    return;
  }

  container.innerHTML = news.slice(0, 8).map(n => `
    <div class="news-card">
      <div class="news-title">${n.headline}</div>
      <div class="news-time">${new Date(n.datetime * 1000).toLocaleString()}</div>
      <div class="news-desc">${n.summary?.slice(0,140) || ""}...</div>
    </div>
  `).join("");
}

/* -------- INIT -------- */

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
