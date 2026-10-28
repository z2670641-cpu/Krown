import sqlite3

DB_NAME = "krown.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, first_name TEXT, is_banned INTEGER DEFAULT 0)''')
    c.execute('''CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, price INTEGER, cat TEXT, img TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS promos (code TEXT PRIMARY KEY, discount INTEGER, uses_left INTEGER)''')
    c.execute('''CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, items TEXT, total INTEGER, status TEXT DEFAULT 'new')''')
    
    c.execute("SELECT COUNT(*) FROM products")
    if c.fetchone()[0] == 0:
        c.execute("INSERT INTO products (name, price, cat, img) VALUES (?, ?, ?, ?)", ("Rick and Morty BAD TRIP", 17, "Жидкости", "https://picsum.photos/seed/vape1/200"))
        c.execute("INSERT INTO products (name, price, cat, img) VALUES (?, ?, ?, ?)", ("Никобустер 20%", 5, "Никобустеры", "https://picsum.photos/seed/vape3/200"))
    
    conn.commit()
    conn.close()

def get_products():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT id, name, price, cat, img FROM products")
    prods = [{"id": r[0], "name": r[1], "price": r[2], "cat": r[3], "img": r[4]} for r in c.fetchall()]
    conn.close()
    return prods

def add_product(name, price, cat, img):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("INSERT INTO products (name, price, cat, img) VALUES (?, ?, ?, ?)", (name, price, cat, img))
    conn.commit()
    conn.close()

def create_promo(code, discount, uses):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("INSERT OR REPLACE INTO promos (code, discount, uses_left) VALUES (?, ?, ?)", (code, discount, uses))
    conn.commit()
    conn.close()

def check_user_ban(user_id):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT is_banned FROM users WHERE id = ?", (user_id,))
    res = c.fetchone()
    conn.close()
    return res[0] == 1 if res else False

def ban_user(user_id, ban_status):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("INSERT OR IGNORE INTO users (id) VALUES (?)", (user_id,))
    c.execute("UPDATE users SET is_banned = ? WHERE id = ?", (1 if ban_status else 0, user_id))
    conn.commit()
    conn.close()

init_db()
