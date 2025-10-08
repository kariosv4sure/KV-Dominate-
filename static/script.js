// --- Utility: Smooth Animation for Numbers ---
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

// --- Fetch Top 10 Crypto Data ---
async function fetchCrypto() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1"
    );
    const data = await res.json();
    const section = document.getElementById("crypto-section");

    section.innerHTML = data
      .map((coin) => {
        const price =
          coin.current_price < 0.01
            ? coin.current_price.toPrecision(6)
            : coin.current_price.toLocaleString();

        const color = coin.price_change_percentage_24h >= 0 ? "green" : "red";
        const glow =
          color === "green"
            ? "shadow-green-500/30 animate-pulse"
            : "shadow-red-500/30 animate-pulse";

        return `
        <div class="crypto-card bg-black/40 p-4 rounded-xl shadow-lg transition-all duration-300 ${glow}">
          <div class="flex items-center space-x-3 mb-2">
            <img src="${coin.image}" alt="${coin.name}" class="w-8 h-8 rounded-full border border-gray-700">
            <h4 class="text-xl font-bold text-orange-400">${coin.name}</h4>
            <span class="text-gray-400 uppercase text-sm">(${coin.symbol})</span>
          </div>
          <p class="coin-price text-gray-300">💰 $${price}</p>
          <p class="text-${color}-400 font-semibold transition-all duration-500">
            ${coin.price_change_percentage_24h.toFixed(2)}%
          </p>
        </div>
      `;
      })
      .join("");

    // Add fade-in animation
    document.querySelectorAll(".crypto-card").forEach((card) => {
      card.style.animation = "fadeIn 0.7s ease";
    });
  } catch (e) {
    console.error("Error loading crypto data:", e);
  }
}

// --- Fetch Latest Crypto News ---
async function fetchNews() {
  try {
    const res = await fetch("https://api.coinstats.app/public/v1/news?skip=0&limit=6");
    const data = await res.json();
    const section = document.getElementById("news-section");

    if (!data.news || data.news.length === 0) {
      section.innerHTML = "<p>No news available right now.</p>";
      return;
    }

    section.innerHTML = data.news
      .map(
        (n) => `
        <div class="bg-black/30 p-4 rounded-lg hover:bg-black/50 transition">
          <a href="${n.link}" target="_blank" class="text-orange-400 font-semibold hover:underline">
            ${n.title}
          </a>
          <p class="text-gray-500 text-sm mt-1">${n.source} • ${new Date(
          n.feedDate
        ).toLocaleDateString()}</p>
        </div>
      `
      )
      .join("");
  } catch (e) {
    console.error("Error loading news:", e);
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

// --- Search Term OR Coin ---
async function searchTerm() {
  const query = document.getElementById("termInput").value.trim().toLowerCase();
  if (!query) return alert("Enter a term or coin!");

  const definitionEl = document.getElementById("definition");
  const coinSection = document.getElementById("coin-result");

  definitionEl.innerText = "";
  coinSection.classList.add("hidden");

  // --- Try dictionary term ---
  try {
    const termRes = await fetch(`${window.location.origin}/term/${query}`);
    const termData = await termRes.json();

    if (termData.definition !== "No definition found.") {
      definitionEl.innerText = termData.definition;
      return;
    }
  } catch (err) {
    console.error("Error fetching term:", err);
  }

  // --- Try CoinGecko Directly ---
  try {
    const possibleIds = [query];
    if (coinMap[query]) possibleIds.unshift(coinMap[query]);

    let data = null;
    for (const id of possibleIds) {
      const res = await fetch(`https://api.coingecko.com/api/v3/coins/${id}`);
      const json = await res.json();
      if (!json.error) {
        data = json;
        break;
      }
    }

    if (!data) {
      alert("❌ No term or coin found! Try 'bitcoin', 'xrp', 'ada', 'solana', etc.");
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

// --- Auto Refresh every 30 seconds ---
setInterval(fetchCrypto, 30000);

// --- Initial Load ---
fetchCrypto();
fetchNews();

// --- Small Animation CSS Inject ---
const style = document.createElement("style");
style.textContent = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
document.head.appendChild(style);

// --- Real-Time Live Price Updates using Binance WebSocket ---
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
    const message = JSON.parse(event.data);
    const ticker = message.data;
    const symbol = ticker.s.replace("USDT", "").toLowerCase();
    const price = parseFloat(ticker.c);

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
          const percent = parseFloat(ticker.P);
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
    console.warn("Live price connection closed. Reconnecting...");
    setTimeout(startLivePrices, 5000);
  };
}

startLivePrices();
