// Инициализация приложения
document.addEventListener("DOMContentLoaded", async() => {
    setupEventListeners();
    await loadInitialData();
    updateActiveTab();
    renderProducts();
});

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
    elements.container.addEventListener("click", (e) => {
        const card = e.target.closest(".product-card");
        if (card && !isLoading) {
            const index = Array.from(card.parentElement.children).indexOf(card);
            const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
            const product = filteredProducts[startIdx + index];
            showDetails(product);
        }
    });
}