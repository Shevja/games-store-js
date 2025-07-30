const API_BASE = "https://api.xbox-rent.ru/api-sale";
const ITEMS_PER_PAGE = 12;
const INITIAL_LOAD_LIMIT = 24; // Первоначальная загрузка меньше товаров для скорости

// Глобальные переменные
let allProducts = [];
let filteredProducts = [];
let cart = [];
let currentPage = 1;
let currentView = 'grid';
let currentType = 'games';
let currentSearchQuery = '';
let isLoading = false;
let gamesLoaded = false;
let dlcLoaded = false;

// Кэш для хранения загруженных данных
const dataCache = {
    games: [],
    dlc: []
};

// DOM элементы
const elements = {
    container: document.getElementById("productsContainer"),
    modal: document.getElementById("modal"),
    modalBody: document.getElementById("modalBody"),
    closeModal: document.getElementById("closeModal"),
    modalOverlay: document.getElementById("modalOverlay"),
    cartCount: document.getElementById("cartCount"),
    cartTotal: document.getElementById("cartTotal"),
    pageInfo: document.getElementById("pageInfo"),
    gamesBtn: document.getElementById("gamesBtn"),
    dlcBtn: document.getElementById("dlcBtn"),
    gamesCount: document.getElementById("gamesCount"),
    dlcCount: document.getElementById("dlcCount"),
    searchInput: document.getElementById("searchInput"),
    prevPage: document.getElementById("prevPage"),
    nextPage: document.getElementById("nextPage"),
    viewCards: document.getElementById("viewCards"),
    viewList: document.getElementById("viewList"),
    viewText: document.getElementById("viewText"),
    cartItems: document.getElementById("cartItems"),
    checkoutBtn: document.getElementById("checkoutBtn"),
    clearCart: document.getElementById("clearCart")
};

// Инициализация приложения
document.addEventListener("DOMContentLoaded", async() => {
    setupEventListeners();
    await loadInitialData();
    updateActiveTab();
    renderProducts();
});

async function loadInitialData() {
    try {
        showLoader();

        // Параллельная загрузка первых данных
        await Promise.all([
            loadGames(true),
            loadDLC(true)
        ]);

        filterProducts();
    } catch (error) {
        console.error("Initial load error:", error);
        showError();
    } finally {
        hideLoader();
    }
}

async function loadGames(isInitialLoad = false) {
    if (gamesLoaded) return;

    try {
        const limit = isInitialLoad ? INITIAL_LOAD_LIMIT : 1000;
        const response = await fetch(`${API_BASE}/games/sales/?limit=${limit}`);
        const data = await response.json();

        dataCache.games = data.results || [];
        allProducts = [...allProducts, ...dataCache.games.map(item => ({...item, type: 'games' }))];

        elements.gamesCount.textContent = dataCache.games.length;
        gamesLoaded = isInitialLoad; // Полная загрузка только если не initial

        // Если это не первоначальная загрузка, обновляем отображение
        if (!isInitialLoad && currentType === 'games') {
            filterProducts();
            renderProducts();
        }
    } catch (error) {
        console.error("Games load error:", error);
    }
}

async function loadDLC(isInitialLoad = false) {
    if (dlcLoaded) return;

    try {
        const response = await fetch(`${API_BASE}/games/dlc`);
        const data = await response.json();

        // Обработка разных форматов ответа
        const dlcItems = Array.isArray(data) ? data : (data && data.results || []);
        dataCache.dlc = dlcItems;
        allProducts = [...allProducts, ...dataCache.dlc.map(item => ({...item, type: 'dlc' }))];

        elements.dlcCount.textContent = dlcItems.length;
        dlcLoaded = true;

        if (!isInitialLoad && currentType === 'dlc') {
            filterProducts();
            renderProducts();
        }
    } catch (error) {
        console.error("DLC load error:", error);
    }
}

function filterProducts() {
    filteredProducts = allProducts.filter(product => {
        const matchesType = product.type === currentType;
        const matchesSearch = currentSearchQuery.length < 3 ||
            (product.title && product.title.toLowerCase().includes(currentSearchQuery.toLowerCase()));
        return matchesType && matchesSearch;
    });

    updatePagination(filteredProducts.length);
}

function renderProducts() {
    if (isLoading) return;

    elements.container.innerHTML = "";

    if (filteredProducts.length === 0) {
        elements.container.innerHTML = currentSearchQuery.length >= 3 ?
            `<p>По запросу "${currentSearchQuery}" ничего не найдено</p>` :
            "<p>Ничего не найдено</p>";
        return;
    }

    const productsWrapper = document.createElement("div");
    productsWrapper.className = `products-${currentView}`;

    // Виртуализация - рендерим только нужные элементы
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, filteredProducts.length);

    for (let i = startIdx; i < endIdx; i++) {
        const product = filteredProducts[i];
        const price = getProductPrice(product);
        const card = createProductCard(product, price);
        productsWrapper.appendChild(card);
    }

    elements.container.appendChild(productsWrapper);
}

function createProductCard(product, price) {
    const card = document.createElement("div");
    card.className = "product-card";

    const priceText = price !== "—" ? `От ${price} ₽` : "Цена не указана";
    const title = product.title || "Без названия";
    const image = product.image || "img/placeholder.jpg";
    const description = product.short_description || truncateDescription(product.description) || "Описание отсутствует";

    if (currentView === 'grid') {
        card.innerHTML = `
            <img src="${image}" alt="${title}" loading="lazy" />
            <h4>${title}</h4>
            <p class="product-price">${priceText}</p>
        `;
    } else if (currentView === 'list') {
        card.innerHTML = `
            <img src="${image}" alt="${title}" loading="lazy" />
            <div>
                <h4>${title}</h4>
                <p>${description}</p>
                <p class="product-price">${priceText}</p>
            </div>
        `;
    } else {
        card.innerHTML = `
            <h4>${title} <span class="product-price">${price !== "—" ? price + " ₽" : "—"}</span></h4>
        `;
    }

    card.addEventListener("click", () => showDetails(product));
    return card;
}

function setupEventListeners() {
    // Переключатели вкладок
    elements.gamesBtn.addEventListener("click", async() => {
        if (currentType === 'games') return;

        currentType = 'games';
        currentPage = 1;
        currentSearchQuery = '';
        elements.searchInput.value = '';

        if (!gamesLoaded) {
            showLoader();
            await loadGames();
            hideLoader();
        }

        updateActiveTab();
        filterProducts();
        renderProducts();
    });

    elements.dlcBtn.addEventListener("click", async() => {
        if (currentType === 'dlc') return;

        currentType = 'dlc';
        currentPage = 1;
        currentSearchQuery = '';
        elements.searchInput.value = '';

        if (!dlcLoaded) {
            showLoader();
            await loadDLC();
            hideLoader();
        }

        updateActiveTab();
        filterProducts();
        renderProducts();
    });

    // Поиск
    let searchTimer;
    elements.searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimer);
        currentSearchQuery = e.target.value.trim();

        searchTimer = setTimeout(() => {
            filterProducts();
            renderProducts();
        }, 300);
    });

    // Пагинация
    elements.prevPage.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderProducts();
            updatePagination(filteredProducts.length);
        }
    });

    elements.nextPage.addEventListener("click", () => {
        const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
        if (currentPage < totalPages) {
            currentPage++;
            renderProducts();
            updatePagination(filteredProducts.length);
        }
    });

    // Виды отображения
    elements.viewCards.addEventListener("click", () => {
        currentView = 'grid';
        renderProducts();
        updateViewButtons('viewCards');
    });

    elements.viewList.addEventListener("click", () => {
        currentView = 'list';
        renderProducts();
        updateViewButtons('viewList');
    });

    elements.viewText.addEventListener("click", () => {
        currentView = 'text';
        renderProducts();
        updateViewButtons('viewText');
    });

    // Корзина
    elements.checkoutBtn.addEventListener("click", checkout);
    elements.clearCart.addEventListener("click", clearCart);

    // Модальное окно
    elements.closeModal.addEventListener("click", closeModalWindow);
    elements.modalOverlay.addEventListener("click", closeModalWindow);
}

function updateActiveTab() {
    elements.gamesBtn.classList.toggle('active', currentType === 'games');
    elements.dlcBtn.classList.toggle('active', currentType === 'dlc');
}

function updateViewButtons(activeId) {
    ['viewCards', 'viewList', 'viewText'].forEach(id => {
        const btn = document.getElementById(id);
        btn.classList.toggle('active', id === activeId);
    });
}

function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
    elements.pageInfo.textContent = `Страница ${currentPage} из ${totalPages}`;
    elements.prevPage.disabled = currentPage <= 1;
    elements.nextPage.disabled = currentPage >= totalPages;
}

async function showDetails(product) {
    if (isLoading) return;
    isLoading = true;
    showLoader();
    openModalWindow();

    try {
        // Проверяем кэш перед загрузкой
        if (!product.description || !product.prices) {
            const response = await fetch(`${API_BASE}/game_id/${product.product_id}`);
            product = await response.json();
        }

        const prices = product.prices || {};
        const keyPrice = (prices.key && prices.key.price !== undefined && prices.key.price !== null) ? prices.key.price : 876;
        const uAccPrice = (prices.u_acc && prices.u_acc.price !== undefined && prices.u_acc.price !== null) ? prices.u_acc.price : 650;
        const newAccPrice = (prices.new_acc && prices.new_acc.price !== undefined && prices.new_acc.price !== null) ? prices.new_acc.price : 549;

        renderModalContent(product, keyPrice, uAccPrice, newAccPrice);
    } catch (error) {
        console.error("Details error:", error);
        elements.modalBody.innerHTML = `<p>Ошибка загрузки данных: ${error.message}</p>`;
    } finally {
        isLoading = false;
        hideLoader();
    }
}

function renderModalContent(product, keyPrice, uAccPrice, newAccPrice) {
    // Форматируем даты
    const releaseDate = product.release_date ? new Date(product.release_date).toLocaleDateString('ru-RU') : 'Не указана';
    const endSaleDate = product.end_date_sale ? new Date(product.end_date_sale).toLocaleDateString('ru-RU') : 'Не ограничена';

    // Создаем блок с мета-информацией
    const metaInfo = [];
    if (product.developer) metaInfo.push(`<div><strong>Разработчик:</strong> ${product.developer}</div>`);
    if (product.publisher) metaInfo.push(`<div><strong>Издатель:</strong> ${product.publisher}</div>`);
    if (releaseDate) metaInfo.push(`<div><strong>Дата выхода:</strong> ${releaseDate}</div>`);
    if (product.categories && product.categories.length) {
        metaInfo.push(`<div><strong>Жанры:</strong> ${product.categories.join(', ')}</div>`);
    }
    if (product.capabilities) metaInfo.push(`<div><strong>Возможности:</strong> ${product.capabilities}</div>`);

    // Создаем блок с языковой информацией
    const langInfo = [];
    if (product.voice_acting) langInfo.push(`<div><strong>Озвучка:</strong> ${product.voice_acting}</div>`);
    if (product.interface_ru) langInfo.push(`<div><strong>Интерфейс:</strong> ${product.interface_ru}</div>`);
    if (product.subtitles) langInfo.push(`<div><strong>Субтитры:</strong> ${product.subtitles}</div>`);

    // Создаем блок с системными требованиями
    const systemInfo = [];
    if (product.compatibility) systemInfo.push(`<div><strong>Совместимость:</strong> ${product.compatibility}</div>`);
    if (product.size) systemInfo.push(`<div><strong>Размер:</strong> ${(product.size / 1024).toFixed(1)} GB</div>`);

    // Слайдер для скриншотов
    let screenshotsSlider = '';
    if (product.screenshots && product.screenshots.length) {
        screenshotsSlider = `
        <div class="media-section">
            <h3>Скриншоты (${product.screenshots.length})</h3>
            <div class="screenshots-slider">
                <div class="slides-container">
                    ${product.screenshots.map(img => `
                        <div class="slide">
                            <img src="${img}" loading="lazy" alt="Скриншот игры" />
                        </div>
                    `).join('')}
                </div>
                <button class="slider-nav prev"><i class="fas fa-chevron-left"></i></button>
                <button class="slider-nav next"><i class="fas fa-chevron-right"></i></button>
                <div class="slider-dots"></div>
            </div>
        </div>`;
    }
    
    // Видео
    let videosContent = '';
    if (product.videos && product.videos.length) {
        videosContent = `
        <div class="media-section">
            <h3>Видео</h3>
            <div class="videos-grid">
                ${product.videos.map(video => `
                    <div class="video-wrapper">
                        <iframe src="${video}" frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen></iframe>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }
    
    // Описание с кнопкой "Подробнее"
    const descriptionId = `desc-${Date.now()}`;
    const descriptionContent = `
        <div class="description-section">
            <h3>Описание</h3>
            <div class="description-content" id="${descriptionId}">
                <p>${product.description || 'Описание отсутствует'}</p>
            </div>
            <button class="read-more-btn" data-target="${descriptionId}">Подробнее</button>
        </div>
    `;
    
    // Формируем HTML
    elements.modalBody.innerHTML = `
        <div class="modal-header">
            <div class="game-cover">
                <img src="${product.image || 'img/placeholder.jpg'}" loading="lazy" alt="Обложка игры" />
                ${product.sale_product ? `<div class="discount-badge">-${product.sale_product}%</div>` : ''}
            </div>
            <div class="game-header-info">
                <h2>${product.title || 'Без названия'}</h2>
                <div class="game-meta">${metaInfo.join('')}</div>
                <div class="game-actions">
                    <div class="price-display">
                        <span class="final-price">${keyPrice}₽</span>
                        ${product.sale_product ? `<span class="original-price">${Math.round(keyPrice * 100 / (100 - product.sale_product))}₽</span>` : ''}
                    </div>
                    <div class="sale-info">Акция действует до: ${endSaleDate}</div>
                </div>
            </div>
        </div>
        
        <div class="modal-content-grid">
            <div class="main-content">
                ${descriptionContent}
                ${screenshotsSlider}
                ${videosContent}
            </div>
            
            <div class="sidebar">
                <div class="info-block">
                    <h3>Языковая информация</h3>
                    ${langInfo.join('')}
                </div>
                
                <div class="info-block">
                    <h3>Системные требования</h3>
                    ${systemInfo.join('')}
                </div>
                
                <div class="purchase-options">
                    <h3>Варианты покупки</h3>
                    <div class="price-option selected" data-price="${keyPrice}">
                        <input type="radio" name="priceOption" id="option1" checked>
                        <label for="option1">
                            <span class="option-title">Ключ активации</span>
                            <span class="option-price">${keyPrice}₽</span>
                            <span class="option-desc">Мгновенная доставка на email</span>
                        </label>
                    </div>
                    <div class="price-option" data-price="${uAccPrice}">
                        <input type="radio" name="priceOption" id="option2">
                        <label for="option2">
                            <span class="option-title">На ваш аккаунт</span>
                            <span class="option-price">${uAccPrice}₽</span>
                            <span class="option-desc">Привязка к вашему аккаунту Xbox</span>
                        </label>
                    </div>
                    <div class="price-option" data-price="${newAccPrice}">
                        <input type="radio" name="priceOption" id="option3">
                        <label for="option3">
                            <span class="option-title">На новый аккаунт</span>
                            <span class="option-price">${newAccPrice}₽</span>
                            <span class="option-desc">Полный доступ к новому аккаунту</span>
                        </label>
                    </div>
                    
                    <button class="buy-button" id="modalBuyButton">
                        <i class="fas fa-shopping-cart"></i> Купить за ${keyPrice}₽
                    </button>
                    
                    <div class="secure-info">
                        <i class="fas fa-shield-alt"></i> Безопасная оплата и гарантия возврата
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Инициализация слайдера
    if (product.screenshots && product.screenshots.length > 1) {
        initSlider();
    }
    
    // Инициализация кнопки "Подробнее"
    initReadMoreButton(descriptionId);
    
    // Обработчик для кнопки покупки (чтобы предотвратить скачивание)
    document.getElementById('modalBuyButton').addEventListener('click', function(e) {
        e.preventDefault();
        addToCart(product.product_id, product.title || 'Без названия', keyPrice);
    });
    
    setupPriceOptionHandlers(product, keyPrice, uAccPrice, newAccPrice);
}

function initSlider() {
    const slider = document.querySelector('.screenshots-slider');
    const slidesContainer = slider.querySelector('.slides-container');
    const slides = slider.querySelectorAll('.slide');
    const dotsContainer = slider.querySelector('.slider-dots');
    const prevBtn = slider.querySelector('.prev');
    const nextBtn = slider.querySelector('.next');
    
    let currentSlide = 0;
    const slideCount = slides.length;
    
    // Создаем точки навигации
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });
    
    // Функция переключения слайда
    function goToSlide(index) {
        if (index < 0) index = slideCount - 1;
        if (index >= slideCount) index = 0;
        
        slidesContainer.style.transform = `translateX(-${index * 100}%)`;
        currentSlide = index;
        
        // Обновляем активную точку
        slider.querySelectorAll('.dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
        });
    }
    
    // Навигационные кнопки
    prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
    nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));
    
    // Автопрокрутка (опционально)
    let slideInterval = setInterval(() => goToSlide(currentSlide + 1), 5000);
    
    // Остановка автопрокрутки при наведении
    slider.addEventListener('mouseenter', () => clearInterval(slideInterval));
    slider.addEventListener('mouseleave', () => {
        slideInterval = setInterval(() => goToSlide(currentSlide + 1), 5000);
    });
}

function initReadMoreButton(descId) {
    const descContainer = document.getElementById(descId);
    const btn = document.querySelector(`[data-target="${descId}"]`);
    
    // Проверяем, нужно ли показывать кнопку
    descContainer.style.maxHeight = '9em'; // Примерно 9 строк текста
    descContainer.style.overflow = 'hidden';
    descContainer.style.transition = 'max-height 0.3s ease';
    
    // Если контент не превышает максимальную высоту, скрываем кнопку
    if (descContainer.scrollHeight <= descContainer.clientHeight) {
        btn.style.display = 'none';
        return;
    }
    
    btn.addEventListener('click', function() {
        if (descContainer.style.maxHeight === '9em') {
            descContainer.style.maxHeight = descContainer.scrollHeight + 'px';
            btn.textContent = 'Свернуть';
        } else {
            descContainer.style.maxHeight = '9em';
            btn.textContent = 'Подробнее';
        }
    });
}

function setupPriceOptionHandlers(product, keyPrice, uAccPrice, newAccPrice) {
    document.querySelectorAll('.price-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.price-option').forEach(el => el.classList.remove('selected'));
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
    elements.modal.classList.remove("hidden");
    elements.modal.classList.add("active");
}

function closeModalWindow() {
    document.body.style.overflow = 'auto';
    elements.modal.classList.add("hidden");
    elements.modal.classList.remove("active");
}

// Корзина
function addToCart(id, title, price) {
    cart.push({ id, title, price });
    updateCartUI();
    closeModalWindow();
}

function updateCartUI() {
    elements.cartItems.innerHTML = cart.map((item, index) => `
        <li>
            ${item.title} - ${item.price}₽
            <span class="remove-item" onclick="removeFromCart(${index})"><i class="fas fa-times"></i></span>
        </li>
    `).join("");

    elements.cartCount.textContent = cart.length;
    elements.cartTotal.textContent = cart.reduce((sum, item) => sum + item.price, 0);
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
    elements.container.innerHTML = '<div class="loader-container"><div class="loader"></div></div>';
}

function hideLoader() {
    const loader = elements.container.querySelector('.loader-container');
    if (loader) loader.remove();
}

function showError() {
    elements.container.innerHTML = `
        <div class="error">
            <p>Не удалось загрузить товары. Попробуйте позже.</p>
            <button onclick="location.reload()">Обновить</button>
        </div>
    `;
}

function getProductPrice(product) {
    if (!product.prices) return "—";

    const prices = [];
    const priceTypes = ['key', 'u_acc', 'new_acc'];

    priceTypes.forEach(type => {
        if (product.prices[type] != null && product.prices[type].price != null) {
            prices.push(product.prices[type].price);
        }
    });

    return prices.length > 0 ? Math.min(...prices) : "—";
}

function truncateDescription(desc, length = 100) {
    return desc && desc.length > length ? desc.substring(0, length) + '...' : desc;
}

// Глобальные функции
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;