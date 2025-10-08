// Fetch Top 10 Crypto Data
async function fetchCrypto() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1"
    );
    const data = await res.json();
    const section = document.getElementById("crypto-section");

    section.innerHTML = data
      .map(
        (coin) => `
      <div class="bg-black/40 p-4 rounded-xl shadow-lg hover:scale-105 transition">
        <h4 class="text-xl font-bold text-orange-400">${coin.name}</h4>
        <p class="text-gray-300">💰 $${coin.current_price.toLocaleString()}</p>
        <p class="text-${
          coin.price_change_percentage_24h >= 0 ? "green" : "red"
        }-400 font-semibold">
          ${coin.price_change_percentage_24h.toFixed(2)}%
        </p>
      </div>
    `
      )
      .join("");
  } catch (e) {
    console.error("Error loading crypto data:", e);
  }
}

// Fetch Latest Crypto News
async function fetchNews() {
  try {
    const res = await fetch(
      "https://cryptopanic.com/api/v1/posts/?auth_token=demo&public=true"
    );
    const data = await res.json();
    const section = document.getElementById("news-section");

    if (!data.results) {
      section.innerHTML = "<p>No news available right now.</p>";
      return;
    }

    section.innerHTML = data.results
      .slice(0, 5)
      .map(
        (n) => `
      <div class="bg-black/30 p-4 rounded-lg hover:bg-black/50 transition">
        <a href="${n.url}" target="_blank" class="text-orange-400 font-semibold hover:underline">
          ${n.title}
        </a>
      </div>
    `
      )
      .join("");
  } catch (e) {
    console.error("Error loading news:", e);
  }
}

// Search Term OR Coin
async function searchTerm() {
  const query = document.getElementById("termInput").value.trim().toLowerCase();
  if (!query) return alert("Enter a term or coin!");

  const definitionEl = document.getElementById("definition");
  const coinSection = document.getElementById("coin-result");

  definitionEl.innerText = "";
  coinSection.classList.add("hidden");

  // 1️⃣ Try dictionary term first
  try {
    const termRes = await fetch(`${window.location.origin}/term/${query}`);
    const termData = await termRes.json();

    if (termData.definition !== "No definition found.") {
      definitionEl.innerText = termData.definition;
      return; // stop here if found as term
    }
  } catch (err) {
    console.error("Error fetching term:", err);
  }

  // 2️⃣ Try coin
  try {
    const coinRes = await fetch(`${window.location.origin}/crypto/${query}`);
    const coinData = await coinRes.json();

    if (coinData.error) {
      alert(
        "No term or coin found! 🔍\nTip: Search coins like 'xrp' for Ripple, 'ada' for Cardano, 'btc' for Bitcoin."
      );
      return;
    }

    document.getElementById("coin-name").textContent = coinData.name;
    document.getElementById("coin-symbol").textContent = `(${coinData.symbol})`;
    document.getElementById("coin-price").textContent = `💰 $${coinData.price.toLocaleString()}`;
    document.getElementById("coin-rank").textContent = `Rank: #${coinData.rank}`;
    coinSection.classList.remove("hidden");
  } catch (err) {
    console.error("Error fetching coin:", err);
    alert("Error fetching coin data.");
  }
}

// Initial Load
fetchCrypto();
fetchNews();
