const API_BASE = "https://api.xbox-rent.ru/api-sale";
const ITEMS_PER_PAGE = 50;
const INITIAL_LOAD_LIMIT = 50;
const SWIPE_CLOSE_THRESHOLD = 125;   // сколько нужно протянуть вниз, чтобы закрыть модальное окно
const SWIPE_START_ZONE = 125;        // верхняя область, где можно начинать свайп

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
    closeModal: document.getElementById("closeModal"),
    cartCount: document.getElementById("cartCount"),
    cartTotal: document.getElementById("cartTotal"),
    cartItems: document.getElementById("cartItems"),
    checkoutBtn: document.getElementById("checkoutBtn"),
    clearCart: document.getElementById("clearCart"),
    dlcBtn: document.getElementById("dlcBtn"),
    dlcCount: document.getElementById("dlcCount"),
    gamesBtn: document.getElementById("gamesBtn"),
    gamesCount: document.getElementById("gamesCount"),
    modal: document.getElementById("modal"),
    modalContent: document.getElementById("modalContent"),
    modalBody: document.getElementById("modalBody"),
    modalOverlay: document.getElementById("modalOverlay"),
    nextPage: document.getElementById("nextPage"),
    paginationContainer: document.getElementById("pagination"),
    pageInfo: document.getElementById("pageInfo"),
    prevPage: document.getElementById("prevPage"),
    searchInput: document.getElementById("searchInput"),
    viewCards: document.getElementById("viewCards"),
    viewList: document.getElementById("viewList"),
    viewText: document.getElementById("viewText"),
};