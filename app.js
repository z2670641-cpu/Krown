const tg = window.Telegram?.WebApp;
tg?.expand();
tg?.ready();

// 👑 ТВОИ ID (для доступа к админке)
const ADMIN_IDS = [8678582128, 8403172681, 8918951833];
const USER_ID = tg?.initDataUnsafe?.user?.id || 0;

// Базовые товары (если в памяти телефона пусто)
const DEFAULT_PRODUCTS = [
    { id: 1, name: "Rick and Morty BAD TRIP", price: 17, cat: "Жидкости", img: "https://picsum.photos/seed/vape1/200" },
    { id: 2, name: "Монашка x XOTSPOT", price: 17, cat: "Жидкости", img: "https://picsum.photos/seed/vape2/200" },
    { id: 3, name: "Никобустер 20%", price: 5, cat: "Никобустеры", img: "https://picsum.photos/seed/vape3/200" },
    { id: 4, name: "Rick and Morty x CATCWILL", price: 20, cat: "Жидкости", img: "https://picsum.photos/seed/vape4/200" }
];

// Загружаем товары из памяти телефона (или ставим базовые)
let products = JSON.parse(localStorage.getItem('krown_products')) || DEFAULT_PRODUCTS;
let cart = JSON.parse(localStorage.getItem('krown_cart_' + USER_ID) || "{}");
let currentCat = "Все";
let searchQuery = "";
const categories = ["Все", "Испарители", "Жидкости", "Поды", "Картриджи", "Баки", "Снюс", "Никобустеры"];

// === ПРОФИЛЬ ===
const user = tg?.initDataUnsafe?.user;
if (user) {
    document.getElementById('user-name').textContent = user.first_name || "Пользователь";
    document.getElementById('user-tag').textContent = user.username ? `@${user.username}` : 'Нет юзернейма';
    document.getElementById('user-id').textContent = user.id;
    if (ADMIN_IDS.includes(USER_ID)) {
        document.getElementById('admin-panel-btn').style.display = 'block';
    }
} else {
    document.getElementById('user-name').textContent = "Гость";
    document.getElementById('user-tag').textContent = "@guest";
    document.getElementById('user-id').textContent = "000000";
}

// === АДМИНКА (Работает прямо в телефоне) ===
function openAdminPanel() {
    let action = prompt("👑 ПАНЕЛЬ АДМИНИСТРАТОРА\n\n1 - Добавить товар\n2 - Очистить все товары");
    
    if (action === "1") {
        let name = prompt("Название товара:");
        if(!name) return;
        let price = prompt("Цена (число):");
        let cat = prompt("Категория (Жидкости/Поды/Никобустеры...):");
        let img = prompt("Ссылка на картинку (URL):");
        
        // Создаем новый товар и добавляем в список
        const newProduct = { id: Date.now(), name: name, price: Number(price), cat: cat, img: img };
        products.push(newProduct);
        
        // Сохраняем в память телефона
        localStorage.setItem('krown_products', JSON.stringify(products));
        tg?.showAlert("✅ Товар добавлен в магазин!");
        renderProducts();
    }
    
    if (action === "2") {
        if(confirm("Удалить все товары и вернуть базовые?")) {
            localStorage.removeItem('krown_products');
            products = DEFAULT_PRODUCTS;
            renderProducts();
            tg?.showAlert("✅ Товары сброшены.");
        }
    }
}

// === РЕНДЕР ===
function renderCategories() {
    document.getElementById('categories').innerHTML = categories.map(c => 
        `<button class="cat-btn ${c === currentCat ? 'active' : ''}" onclick="setCategory('${c}')">${c}</button>`
    ).join('');
}

function setCategory(cat) {
    currentCat = cat; renderCategories(); renderProducts(); tg?.HapticFeedback?.impactOccurred("light");
}

function renderProducts() {
    searchQuery = document.getElementById('search-input').value.toLowerCase();
    const grid = document.getElementById('products-grid');
    const filtered = products.filter(p => {
        const matchCat = currentCat === "Все" || p.cat === currentCat;
        const matchSearch = p.name.toLowerCase().includes(searchQuery);
        return matchCat && matchSearch;
    });

    grid.innerHTML = filtered.map(p => `
        <div class="product-card">
            <span class="product-tag">${p.cat}</span>
            <img src="${p.img}" alt="${p.name}" loading="lazy">
            <div class="product-info">
                <div class="product-title">${p.name}</div>
                <div class="product-footer">
                    <div class="product-price" onclick="addToCart(${p.id})">${p.price} Br</div>
                </div>
            </div>
        </div>
    `).join('');
}

// === НАВИГАЦИЯ ===
function switchPage(pageId, el = null) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (el) el.classList.add('active');
    else {
        const navs = document.querySelectorAll('.nav-item');
        if(pageId === 'cart') navs[1].classList.add('active');
        if(pageId === 'profile') navs[2].classList.add('active');
        if(pageId === 'assortment') navs[0].classList.add('active');
    }
    if (pageId === 'cart') renderCart();
    tg?.HapticFeedback?.impactOccurred("light");
}

// === КОРЗИНА ===
function addToCart(id) {
    cart[id] = (cart[id] || 0) + 1; saveCart(); tg?.HapticFeedback?.notificationOccurred("success");
}
function changeQty(id, delta) {
    cart[id] += delta; if (cart[id] <= 0) delete cart[id]; saveCart(); renderCart();
}
function saveCart() {
    localStorage.setItem('krown_cart_' + USER_ID, JSON.stringify(cart)); updateCartCounters();
}
function updateCartCounters() {
    const count = Object.values(cart).reduce((a, b) => a + b, 0);
    const badge = document.getElementById('nav-cart-count');
    badge.textContent = count;
    badge.style.display = count === 0 ? 'none' : 'block';
}
function renderCart() {
    const container = document.getElementById('cart-container');
    const bottom = document.getElementById('cart-bottom');
    const ids = Object.keys(cart);
    if (ids.length === 0) {
        container.innerHTML = `<div class="cart-empty">Корзина пуста</div>`;
        bottom.style.display = 'none'; return;
    }
    let total = 0;
    container.innerHTML = ids.map(id => {
        const p = products.find(x => x.id == id);
        if(!p) return "";
        total += p.price * cart[id];
        return `
            <div class="cart-item">
                <img src="${p.img}">
                <div class="cart-item-info">
                    <div class="cart-item-title">${p.name}</div>
                    <div class="cart-item-price">${p.price} Br</div>
                </div>
                <div class="cart-item-actions">
                    <button onclick="changeQty(${id}, -1)">−</button>
                    <span>${cart[id]}</span>
                    <button onclick="changeQty(${id}, 1)">+</button>
                </div>
            </div>
        `;
    }).join('');
    document.getElementById('cart-total').textContent = total;
    bottom.style.display = 'flex';
}

// === ОФОРМЛЕНИЕ (Отправка боту) ===
function checkout() {
    if (Object.keys(cart).length === 0) return;
    const orderItems = Object.keys(cart).map(id => {
        const p = products.find(x => x.id == id);
        return { name: p.name, qty: cart[id], price: p.price };
    });
    const total = orderItems.reduce((s, i) => s + i.price * i.qty, 0);
    
    // Отправляем заказ боту
    if (tg?.sendData) { tg.sendData(JSON.stringify({ order: orderItems, total: total })); }
    
    cart = {}; saveCart(); renderCart(); switchPage('assortment');
    tg?.showAlert("✅ Заказ оформлен! Менеджер свяжется с вами.");
}

// ЗАМЕНИ НА ЮЗЕРНЕЙМ МЕНЕДЖЕРА
function openManager() { tg?.openTelegramLink("https://t.me/твой_менеджер"); }

// === СТАРТ ===
renderCategories();
renderProducts();
updateCartCounters();
