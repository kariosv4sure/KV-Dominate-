// === KV LABS Crypto Dashboard Script ===
// Futuristic | Resilient | Powered by KV LABS ⚡

// --- Utility: Smooth Animated Numbers ---
function animateNumber(element, start, end, duration = 800) {
  const startTime = performance.now();
  const step = (currentTime) => {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const value = start + (end - start) * progress;
    element.textContent = `💰 $${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    })}`;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// --- Smart Fetch Wrapper (CORS-Safe + Retry) ---
async function safeFetch(url, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        mode: "cors",
        headers: { "User-Agent": "Mozilla/5.0 (KVLABS)" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`⚠️ Fetch attempt ${i + 1} failed for ${url}:`, err.message);
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

// --- Fetch Top 10 Crypto Data ---
async function fetchCrypto() {
  try {
    const data = await safeFetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1"
    );
    const section = document.getElementById("crypto-section");

    section.innerHTML = data
      .map((coin) => {
        const price =
          coin.current_price < 0.01
            ? coin.current_price.toPrecision(8)
            : coin.current_price.toLocaleString();

        const color = coin.price_change_percentage_24h >= 0 ? "green" : "red";
        const glow =
          color === "green"
            ? "shadow-green-500/30 animate-pulse"
            : "shadow-red-500/30 animate-pulse";

        return `
        <div class="crypto-card bg-black/40 p-4 rounded-xl shadow-lg transition-all duration-300 ${glow} opacity-0 translate-y-4">
          <div class="flex items-center space-x-3 mb-2">
            <img src="${coin.image}" alt="${coin.name}" class="w-8 h-8 rounded-full border border-gray-700">
            <h4 class="text-xl font-bold text-orange-400">${coin.name}</h4>
            <span class="text-gray-400 uppercase text-sm">(${coin.symbol})</span>
          </div>
          <p class="coin-price text-gray-300">💰 $${price}</p>
          <p class="text-${color}-400 font-semibold transition-all duration-500">
            ${coin.price_change_percentage_24h.toFixed(2)}%
          </p>
        </div>`;
      })
      .join("");

    // Fade-in animation
    setTimeout(() => {
      document
        .querySelectorAll(".crypto-card")
        .forEach((el, i) =>
          setTimeout(() => {
            el.classList.remove("opacity-0", "translate-y-4");
          }, i * 100)
        );
    }, 100);
  } catch (e) {
    console.error("Error loading crypto data:", e);
  }
}

// --- Smart Multi-Fallback News Fetcher ---
async function fetchNews() {
  const section = document.getElementById("news-section");
  section.innerHTML = "<p class='text-gray-400'>⏳ Loading crypto news...</p>";

  const sources = [
    {
      name: "Reddit",
      url: "https://www.reddit.com/r/cryptocurrency/top.json?limit=8&t=day",
      parse: (data) =>
        data?.data?.children?.map((n) => ({
          title: n.data.title,
          url: "https://reddit.com" + n.data.permalink,
          source: "Reddit",
          date: new Date(n.data.created_utc * 1000).toLocaleDateString(),
          image:
            n.data.thumbnail?.startsWith("http") && n.data.thumbnail.length > 10
              ? n.data.thumbnail
              : "https://www.redditinc.com/assets/images/site/reddit-logo.png",
        })),
    },
    {
      name: "CoinTelegraph",
      url: "https://api.rss2json.com/v1/api.json?rss_url=https://cointelegraph.com/rss",
      parse: (data) =>
        data?.items?.slice(0, 8).map((n) => ({
          title: n.title,
          url: n.link,
          source: "CoinTelegraph",
          date: new Date(n.pubDate).toLocaleDateString(),
          image: n.thumbnail || "https://cointelegraph.com/favicon-32x32.png",
        })),
    },
    {
      name: "Decrypt",
      url: "https://api.rss2json.com/v1/api.json?rss_url=https://decrypt.co/feed",
      parse: (data) =>
        data?.items?.slice(0, 8).map((n) => ({
          title: n.title,
          url: n.link,
          source: "Decrypt",
          date: new Date(n.pubDate).toLocaleDateString(),
          image:
            n.thumbnail ||
            "https://static.decrypt.co/wp-content/uploads/2020/03/decrypt-favicon.png",
        })),
    },
    {
      name: "CoinDesk",
      url: "https://api.rss2json.com/v1/api.json?rss_url=https://www.coindesk.com/arc/outboundfeeds/rss/",
      parse: (data) =>
        data?.items?.slice(0, 8).map((n) => ({
          title: n.title,
          url: n.link,
          source: "CoinDesk",
          date: new Date(n.pubDate).toLocaleDateString(),
          image: n.thumbnail || "https://www.coindesk.com/favicon.ico",
        })),
    },
  ];

  for (const src of sources) {
    try {
      const data = await safeFetch(src.url);
      const articles = src.parse(data);

      if (!articles || !articles.length) throw new Error("No articles");

      section.innerHTML = articles
        .map(
          (n) => `
          <div class="news-card bg-black/30 rounded-xl p-4 mb-3 hover:bg-black/50 transition border border-gray-800 opacity-0 translate-y-3">
            <div class="flex items-center space-x-3">
              <img src="${n.image}" alt="news" class="w-16 h-16 rounded-lg object-cover border border-gray-700">
              <div>
                <a href="${n.url}" target="_blank" class="text-orange-400 font-semibold hover:underline">
                  ${n.title}
                </a>
                <p class="text-gray-500 text-sm mt-1">${n.source} • ${n.date}</p>
              </div>
            </div>
          </div>`
        )
        .join("");

      // Animate fade-in
      setTimeout(() => {
        document
          .querySelectorAll(".news-card")
          .forEach((el, i) =>
            setTimeout(() => {
              el.classList.remove("opacity-0", "translate-y-3");
            }, i * 100)
          );
      }, 100);

      localStorage.setItem("lastNews", section.innerHTML); // offline cache
      console.log(`✅ Loaded crypto news from ${src.name}`);
      return;
    } catch (err) {
      console.warn(`⚠️ ${src.name} failed:`, err.message);
    }
  }

  const cached = localStorage.getItem("lastNews");
  if (cached) {
    section.innerHTML = cached;
    console.log("🕓 Showing cached news from last load.");
  } else {
    section.innerHTML =
      "<p class='text-red-500'>🚨 Couldn't load any news sources. Try again later.</p>";
  }
}

// --- Coin Symbol → CoinGecko ID ---
const coinMap = {
  btc: "bitcoin",
  eth: "ethereum",
  xrp: "ripple",
  ada: "cardano",
  bnb: "binancecoin",
  sol: "solana",
  doge: "dogecoin",
  trx: "tron",
  matic: "polygon",
  avax: "avalanche-2",
  dot: "polkadot",
  shib: "shiba-inu",
  ltc: "litecoin",
  link: "chainlink",
  ton: "the-open-network",
  pepe: "pepe",
  op: "optimism",
  sui: "sui",
  apt: "aptos",
  arb: "arbitrum",
};

// --- Search Term or Coin ---
async function searchTerm() {
  const query = document.getElementById("termInput").value.trim().toLowerCase();
  if (!query) return alert("Enter a term or coin!");

  const definitionEl = document.getElementById("definition");
  const coinSection = document.getElementById("coin-result");

  definitionEl.innerText = "";
  coinSection.classList.add("hidden");

  try {
    const possibleIds = [query];
    if (coinMap[query]) possibleIds.unshift(coinMap[query]);

    let data = null;
    for (const id of possibleIds) {
      const res = await safeFetch(`https://api.coingecko.com/api/v3/coins/${id}`);
      if (!res.error) {
        data = res;
        break;
      }
    }

    if (!data) {
      alert("❌ No term or coin found! Try 'bitcoin', 'xrp', 'solana', etc.");
      return;
    }

    const price =
      data.market_data.current_price.usd < 0.01
        ? data.market_data.current_price.usd.toPrecision(8)
        : data.market_data.current_price.usd.toLocaleString();

    document.getElementById("coin-name").textContent = data.name;
    document.getElementById("coin-symbol").textContent = `(${data.symbol.toUpperCase()})`;
    document.getElementById("coin-price").textContent = `💰 $${price}`;
    document.getElementById("coin-rank").textContent = `Rank: #${data.market_cap_rank}`;
    coinSection.classList.remove("hidden");
  } catch (err) {
    console.error("Error fetching coin:", err);
    alert("Couldn't fetch coin data. Try again later.");
  }
}

// --- Auto Refresh ---
setInterval(fetchCrypto, 30000);
setInterval(fetchNews, 120000);

// --- Initial Load ---
fetchCrypto();
fetchNews();

// --- Live Prices via Binance WebSocket ---
function startLivePrices() {
  const trackedSymbols = [
    "BTCUSDT",
    "ETHUSDT",
    "BNBUSDT",
    "XRPUSDT",
    "SOLUSDT",
    "DOGEUSDT",
    "ADAUSDT",
    "PEPEUSDT",
    "SHIBUSDT",
    "TRXUSDT",
  ];

  const streamUrl = `wss://stream.binance.com:9443/stream?streams=${trackedSymbols
    .map((s) => s.toLowerCase() + "@ticker")
    .join("/")}`;

  const ws = new WebSocket(streamUrl);

  ws.onmessage = (event) => {
    const { data } = JSON.parse(event.data);
    const symbol = data.s.replace("USDT", "").toLowerCase();
    const price = parseFloat(data.c);

    document.querySelectorAll(".crypto-card").forEach((card) => {
      const nameEl = card.querySelector("h4");
      if (!nameEl) return;

      if (nameEl.textContent.toLowerCase().includes(symbol)) {
        const priceEl = card.querySelector(".coin-price");
        const changeEl = card.querySelector("p.text-green-400, p.text-red-400");

        if (priceEl) {
          const oldPrice = parseFloat(priceEl.textContent.replace(/[^\d.-]/g, ""));
          const direction = price > oldPrice ? "up" : "down";

          card.style.boxShadow =
            direction === "up"
              ? "0 0 20px rgba(0,255,100,0.4)"
              : "0 0 20px rgba(255,0,80,0.4)";
          setTimeout(() => (card.style.boxShadow = ""), 500);

          animateNumber(priceEl, oldPrice, price);
        }

        if (changeEl) {
          const percent = parseFloat(data.P);
          changeEl.textContent = `${percent.toFixed(2)}%`;
          changeEl.className =
            percent >= 0
              ? "text-green-400 font-semibold transition-all duration-500"
              : "text-red-400 font-semibold transition-all duration-500";
        }
      }
    });
  };

  ws.onclose = () => {
    console.warn("🔁 Live price connection closed. Reconnecting...");
    setTimeout(startLivePrices, 5000);
  };
}

startLivePrices();

// --- Footer Credit ---
document.addEventListener("DOMContentLoaded", () => {
  const footer = document.createElement("footer");
  footer.innerHTML = `
    <div class="text-center text-gray-500 text-sm mt-6 mb-2">
      ⚡ Powered by <span class="text-orange-400 font-semibold">KV LABS</span> — Built for the Future
    </div>`;
  document.body.appendChild(footer);
});
