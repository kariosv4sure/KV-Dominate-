from flask import Flask, render_template, request, redirect, session, url_for, jsonify
import json, os, requests

app = Flask(__name__)
app.secret_key = "kv_secret_key"

BRAIN_FILE = "karios_brain.json"
USER_FILE = "users.json"

# --- Initialize files if not found
if not os.path.exists(BRAIN_FILE):
    with open(BRAIN_FILE, "w") as f:
        json.dump({
            "bitcoin": "Bitcoin is a decentralized digital currency.",
            "wallet": "A crypto wallet stores your private keys securely.",
            "blockchain": "A distributed ledger technology for recording transactions.",
            "defi": "Decentralized finance — financial systems built on blockchain.",
            "nft": "Non-fungible token — unique digital asset verified on a blockchain."
        }, f)

if not os.path.exists(USER_FILE):
    with open(USER_FILE, "w") as f:
        json.dump({}, f)

# --- Load data
with open(BRAIN_FILE, "r") as f:
    brain = json.load(f)

with open(USER_FILE, "r") as f:
    users = json.load(f)

# --- Save users persistently
def save_users():
    with open(USER_FILE, "w") as f:
        json.dump(users, f)

# --- Homepage
@app.route('/')
def index():
    return render_template('index.html')

# --- Register
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if username in users:
            return "❌ User already exists!"
        users[username] = password
        save_users()
        return redirect(url_for('login'))
    return render_template('register.html')

# --- Login
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if users.get(username) == password:
            session['user'] = username
            return redirect(url_for('dashboard'))
        return "❌ Invalid username or password!"
    return render_template('login.html')

# --- Dashboard
@app.route('/dashboard')
def dashboard():
    if 'user' not in session:
        return redirect(url_for('login'))
    return render_template('dashboard.html', user=session['user'])

# --- Logout
@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('index'))

# --- Dictionary term lookup
@app.route('/term/<word>')
def get_term(word):
    word = word.lower()
    if word in brain:
        return jsonify({"term": word, "definition": brain[word]})
    else:
        return jsonify({"term": word, "definition": "No definition found."})

# --- Crypto price lookup (CoinGecko)
@app.route('/crypto/<coin>')
def crypto_info(coin):
    coin_id = coin.lower().replace(" ", "-")  # convert spaces to dashes
    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}"
    try:
        res = requests.get(url)
        data = res.json()
        if "error" in data:
            return jsonify({"error": "Coin not found"})
        info = {
            "name": data.get("name", "Unknown"),
            "symbol": data.get("symbol", "N/A").upper(),
            "price": data["market_data"]["current_price"]["usd"],
            "rank": data["market_cap_rank"]
        }
        return jsonify(info)
    except Exception as e:
        return jsonify({"error": "Failed to fetch coin data", "details": str(e)})

# --- API for all terms
@app.route('/all_terms')
def all_terms():
    return jsonify(list(brain.keys()))

# --- Add new term
@app.route('/add_term', methods=['POST'])
def add_term():
    data = request.get_json()
    term = data.get('term', '').lower()
    definition = data.get('definition', '')
    if term and definition:
        brain[term] = definition
        with open(BRAIN_FILE, "w") as f:
            json.dump(brain, f)
        return jsonify({"message": f"✅ Added {term} to dictionary!"})
    return jsonify({"error": "Missing term or definition"})

# --- Run App
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
