const API_BASE = "https://api.xbox-rent.ru/api-sale";
const ITEMS_PER_PAGE = 50;
const INITIAL_LOAD_LIMIT = 50;

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