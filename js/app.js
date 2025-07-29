const API_BASE = "http://51.250.47.210:8085/api-sale";
const itemsPerPage = 12;

// Глобальные переменные
let allProducts = []; // Все товары для поиска
let filteredProducts = []; // Отфильтрованные товары
let cart = [];
let currentPage = 1;
let currentView = 'grid';
let currentType = 'games';
let currentSearchQuery = '';
let isLoading = false;

// DOM элементы
const container = document.getElementById("productsContainer");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal");
const modalOverlay = document.getElementById("modalOverlay");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const pageInfo = document.getElementById("pageInfo");
const gamesBtn = document.getElementById("gamesBtn");
const dlcBtn = document.getElementById("dlcBtn");
const gamesCountEl = document.getElementById("gamesCount");
const dlcCountEl = document.getElementById("dlcCount");
const searchInput = document.getElementById("searchInput");

// Инициализация приложения
document.addEventListener("DOMContentLoaded", async() => {
    await loadAllProducts();
    initApp();
});

async function loadAllProducts() {
    try {
        showLoader();

        // Загружаем все игры и дополнения
        const [gamesRes, dlcRes] = await Promise.all([
            fetch(`${API_BASE}/games/sales/?limit=1000`),
            fetch(`${API_BASE}/games/dlc/?limit=1000`)
        ]);

        const gamesData = await gamesRes.json();
        const dlcData = await dlcRes.json();

        // Сохраняем все товары с указанием типа
        allProducts = [
            ...(gamesData.results || []).map(item => ({...item, type: 'games' })),
            ...(dlcData.results || []).map(item => ({...item, type: 'dlc' }))
        ];

        // Обновляем счетчики
        gamesCountEl.textContent = (gamesData.results || []).length;
        dlcCountEl.textContent = (dlcData.results || []).length;

        // Первоначальная загрузка
        filterProducts();
    } catch (error) {
        console.error("Ошибка загрузки всех товаров:", error);
        container.innerHTML = `<p>Ошибка загрузки данных: ${error.message}</p>`;
    }
}

function initApp() {
    updateActiveTab();
    renderProducts();
    setupEventListeners();
}

// Фильтрация товаров по текущему типу и поисковому запросу
function filterProducts() {
    filteredProducts = allProducts.filter(product => {
        const matchesType = product.type === currentType;
        const matchesSearch = currentSearchQuery.length < 3 ||
            (product.title && product.title.toLowerCase().includes(currentSearchQuery.toLowerCase()));
        return matchesType && matchesSearch;
    });

    updatePagination(filteredProducts.length);
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Переключатель игр/дополнений
    gamesBtn.addEventListener("click", () => {
        currentType = 'games';
        currentPage = 1;
        currentSearchQuery = '';
        searchInput.value = '';
        updateActiveTab();
        filterProducts();
        renderProducts();
    });

    dlcBtn.addEventListener("click", () => {
        currentType = 'dlc';
        currentPage = 1;
        currentSearchQuery = '';
        searchInput.value = '';
        updateActiveTab();
        filterProducts();
        renderProducts();
    });

    // Поиск
    setupSearch();

    // Корзина
    document.getElementById("checkoutBtn").addEventListener("click", checkout);
    document.getElementById("clearCart").addEventListener("click", clearCart);

    // Модальное окно
    closeModal.addEventListener("click", closeModalWindow);
    modalOverlay.addEventListener("click", closeModalWindow);

    // Пагинация
    setupPagination();

    // Варианты отображения
    setupViewOptions();
}

// Обновление активной вкладки
function updateActiveTab() {
    gamesBtn.classList.toggle('active', currentType === 'games');
    dlcBtn.classList.toggle('active', currentType === 'dlc');
}

// Поиск товаров
function setupSearch() {
    let searchTimer;

    searchInput.addEventListener("input", e => {
        clearTimeout(searchTimer);
        currentSearchQuery = e.target.value.trim();

        searchTimer = setTimeout(() => {
            currentPage = 1;
            filterProducts();
            renderProducts();
        }, 500);
    });

    document.getElementById("searchBtn").addEventListener("click", () => {
        currentPage = 1;
        filterProducts();
        renderProducts();
    });
}

// Отображение товаров
function renderProducts() {
    if (isLoading) return;

    container.innerHTML = "";

    if (filteredProducts.length === 0) {
        container.innerHTML = currentSearchQuery.length >= 3 ?
            `<p>По запросу "${currentSearchQuery}" ничего не найдено</p>` :
            "<p>Ничего не найдено</p>";
        return;
    }

    const productsWrapper = document.createElement("div");
    productsWrapper.className = `products-${currentView}`;

    // Применяем пагинацию
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIdx, endIdx);

    paginatedProducts.forEach(product => {
        const price = getProductPrice(product);
        const card = createProductCard(product, price);
        productsWrapper.appendChild(card);
    });

    container.appendChild(productsWrapper);
}

function createProductCard(product, price) {
    const card = document.createElement("div");
    card.className = "product-card";

    const priceText = price !== "—" ? `От ${price} ₽` : "Цена не указана";
    const title = product.title || "Без названия";
    const image = product.image || "img/placeholder.jpg";
    const description = product.short_description || truncateDescription(product.description) || "Описание отсутствует";
    const developer = product.developer || "Неизвестно";
    const publisher = product.publisher || "Неизвестно";

    if (currentView === 'grid') {
        card.innerHTML = `
            <img src="${image}" alt="${title}" />
            <h4>${title}</h4>
            <p class="product-price">${priceText}</p>
        `;
    } else if (currentView === 'list') {
        card.innerHTML = `
            <img src="${image}" alt="${title}" />
            <div>
                <h4>${title}</h4>
                <p>${description}</p>
                <p class="product-price">${priceText}</p>
            </div>
        `;
    } else {
        card.innerHTML = `
            <h4>${title} <span class="product-price">${price !== "—" ? price + " ₽" : "—"}</span></h4>
            <p>${developer} • ${publisher}</p>
        `;
    }

    card.addEventListener("click", () => showDetails(product));
    return card;
}

function getProductPrice(product) {
    if (!product.prices) return "—";

    const prices = [];

    // Проверяем все возможные варианты цен
    if (product.prices.key && product.prices.key.price !== undefined && product.prices.key.price !== null) {
        prices.push(product.prices.key.price);
    }
    if (product.prices.u_acc && product.prices.u_acc.price !== undefined && product.prices.u_acc.price !== null) {
        prices.push(product.prices.u_acc.price);
    }
    if (product.prices.new_acc && product.prices.new_acc.price !== undefined && product.prices.new_acc.price !== null) {
        prices.push(product.prices.new_acc.price);
    }

    return prices.length > 0 ? Math.min(...prices) : "—";
}

function truncateDescription(desc, length = 100) {
    return desc && desc.length > length ? desc.substring(0, length) + '...' : desc;
}

// Варианты отображения
function setupViewOptions() {
    document.getElementById("viewCards").addEventListener("click", () => {
        currentView = 'grid';
        updateView();
        toggleActiveViewButtons('viewCards');
    });

    document.getElementById("viewList").addEventListener("click", () => {
        currentView = 'list';
        updateView();
        toggleActiveViewButtons('viewList');
    });

    document.getElementById("viewText").addEventListener("click", () => {
        currentView = 'text';
        updateView();
        toggleActiveViewButtons('viewText');
    });
}

function updateView() {
    renderProducts();
}

function toggleActiveViewButtons(activeId) {
    ['viewCards', 'viewList', 'viewText'].forEach(id => {
        const btn = document.getElementById(id);
        if (id === activeId) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

// Пагинация
function setupPagination() {
    document.getElementById("prevPage").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderProducts();
            updatePagination(filteredProducts.length);
        }
    });

    document.getElementById("nextPage").addEventListener("click", () => {
        const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderProducts();
            updatePagination(filteredProducts.length);
        }
    });
}

function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const prevBtn = document.getElementById("prevPage");
    const nextBtn = document.getElementById("nextPage");

    pageInfo.textContent = `Страница ${currentPage} из ${totalPages}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
}

// Модальное окно
async function showDetails(product) {
    if (isLoading) return;
    isLoading = true;
    showLoader();
    openModalWindow();

    try {
        // Догружаем полные данные, если нужно
        if (!product.description || !product.prices) {
            const response = await fetch(`${API_BASE}/game_id/${product.product_id}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            product = await response.json();
        }

        const keyPrice = getSafePrice(product.prices, 'key', 876);
        const uAccPrice = getSafePrice(product.prices, 'u_acc', 650);
        const newAccPrice = getSafePrice(product.prices, 'new_acc', 549);

        renderModalContent(product, keyPrice, uAccPrice, newAccPrice);
    } catch (error) {
        console.error("Ошибка загрузки деталей:", error);
        modalBody.innerHTML = `<p>Ошибка загрузки данных: ${error.message}</p>`;
    } finally {
        isLoading = false;
    }
}

function getSafePrice(prices, priceType, defaultValue) {
    return (prices && prices[priceType] && prices[priceType].price !== undefined && prices[priceType].price !== null) ?
        prices[priceType].price :
        defaultValue;
}

function renderModalContent(product, keyPrice, uAccPrice, newAccPrice) {
    modalBody.innerHTML = `
        <h2>${product.title || 'Без названия'}</h2>
        <img src="${product.image || 'img/placeholder.jpg'}" style="width:100%; border-radius:8px; margin:10px 0;" />
        <p>${product.description || 'Описание отсутствует'}</p>
        <p><strong>Разработчик:</strong> ${product.developer || 'Неизвестно'}</p>
        <p><strong>Издатель:</strong> ${product.publisher || 'Неизвестно'}</p>
        <p><strong>Дата выхода:</strong> ${product.release_date || 'Неизвестно'}</p>
        
        <div class="price-options">
            <h3>Варианты покупки</h3>
            <div class="price-option selected" data-price="${keyPrice}">
                <input type="radio" name="priceOption" id="option1" checked>
                <label for="option1">Ключ - ${keyPrice}₽</label>
            </div>
            <div class="price-option" data-price="${uAccPrice}">
                <input type="radio" name="priceOption" id="option2">
                <label for="option2">На ваш аккаунт - ${uAccPrice}₽</label>
            </div>
            <div class="price-option" data-price="${newAccPrice}">
                <input type="radio" name="priceOption" id="option3">
                <label for="option3">На новый аккаунт - ${newAccPrice}₽</label>
            </div>
        </div>
        
        <button class="buy-button" onclick="addToCart('${product.product_id}', '${product.title || 'Без названия'}', ${keyPrice})">
            Купить за ${keyPrice}₽
        </button>
    `;

    setupPriceOptionHandlers(product, keyPrice, uAccPrice, newAccPrice);
}

function setupPriceOptionHandlers(product, keyPrice, uAccPrice, newAccPrice) {
    document.querySelectorAll('.price-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.price-option').forEach(el => {
                el.classList.remove('selected');
            });
            this.classList.add('selected');

            const price = this.dataset.price;
            const btn = document.querySelector('.buy-button');
            btn.textContent = `Купить за ${price}₽`;
            btn.onclick = () => addToCart(product.product_id, product.title || 'Без названия', parseInt(price));
        });
    });
}

function openModalWindow() {
    document.body.style.overflow = 'hidden';
    modal.classList.remove("hidden");
    modal.classList.add("active");
}

function closeModalWindow() {
    document.body.style.overflow = 'auto';
    modal.classList.add("hidden");
    modal.classList.remove("active");
}

// Корзина
function addToCart(id, title, price) {
    cart.push({ id, title, price });
    updateCartUI();
    closeModalWindow();
}

function updateCartUI() {
    const cartList = document.getElementById("cartItems");
    cartList.innerHTML = cart.map((item, index) => `
        <li>
            ${item.title} - ${item.price}₽
            <span class="remove-item" onclick="removeFromCart(${index})"><i class="fas fa-times"></i></span>
        </li>
    `).join("");

    cartCount.textContent = cart.length;
    cartTotal.textContent = cart.reduce((sum, item) => sum + item.price, 0);
}

function removeFromCart(index) {
    if (index >= 0 && index < cart.length) {
        cart.splice(index, 1);
        updateCartUI();
    }
}

function clearCart() {
    cart = [];
    updateCartUI();
}

function checkout() {
    if (cart.length === 0) {
        alert("Корзина пуста");
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    alert(`Заказ на ${cart.length} товаров на сумму ${total}₽ отправлен!`);
    cart = [];
    updateCartUI();
}

// Вспомогательные функции
function showLoader() {
    container.innerHTML = '<div class="loader-container"><div class="loader"></div></div>';
}

// Глобальные функции
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;