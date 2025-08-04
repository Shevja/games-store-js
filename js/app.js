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

        updateActiveTab();
        await loadGames(currentPage);
    });

    elements.dlcBtn.addEventListener("click", async() => {
        if (currentType === 'dlc') return;

        currentType = 'dlc';
        currentPage = 1;
        currentSearchQuery = '';
        elements.searchInput.value = '';

        updateActiveTab();
        await loadDLC(currentPage);
    });

    // Поиск
    let searchTimer;
    elements.searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimer);
        currentSearchQuery = e.target.value.trim();

        searchTimer = setTimeout(() => {
            // Если API поддерживает поиск, можно добавить параметр search
            loadDataForCurrentType(1);
        }, 300);
    });

    // Пагинация
    elements.prevPage.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            loadDataForCurrentType(currentPage);
        }
    });

    elements.nextPage.addEventListener("click", () => {
        const totalPages = Math.ceil((dataCache.pagination && dataCache.pagination.count ? dataCache.pagination.count : 0) / ITEMS_PER_PAGE);
        if (currentPage < totalPages) {
            currentPage++;
            loadDataForCurrentType(currentPage);
        }
    });

    // Новая функция для загрузки данных в зависимости от текущего типа
    async function loadDataForCurrentType(page) {
        showLoader();
        try {
            if (currentType === 'games') {
                await loadGames(page);
            } else {
                await loadDLC(page);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            hideLoader();
        }
    }

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
            const product = allProducts[index]; // Теперь allProducts содержит только текущую страницу
            if (product) {
                showDetails(product);
            }
        }
    });
}