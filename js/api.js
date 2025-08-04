async function loadGames(page = 1) {
    try {
        const offset = (page - 1) * ITEMS_PER_PAGE;
        const response = await fetch(`${API_BASE}/games/sales/?offset=${offset}&limit=${ITEMS_PER_PAGE}`);
        const data = await response.json();

        // Сохраняем данные пагинации
        dataCache.pagination = {
            count: data.count,
            next: data.next,
            previous: data.previous
        };

        // Обновляем продукты
        dataCache.games = data.results || [];
        allProducts = dataCache.games.map(item => ({...item, type: 'games' }));

        elements.gamesCount.textContent = data.count || 0;

        // Обновляем пагинацию
        updatePagination(data.count, page);

        // Рендерим продукты
        renderProducts();
    } catch (error) {
        console.error("Games load error:", error);
    }
}

async function loadDLC(page = 1) {
    try {
        const offset = (page - 1) * ITEMS_PER_PAGE;
        const response = await fetch(`${API_BASE}/games/dlc/?offset=${offset}&limit=${ITEMS_PER_PAGE}`);
        const data = await response.json();

        // Сохраняем данные пагинации
        dataCache.pagination = {
            count: data.count,
            next: data.next,
            previous: data.previous
        };

        // Обработка разных форматов ответа
        const dlcItems = Array.isArray(data.results) ? data.results : [];
        dataCache.dlc = dlcItems;
        allProducts = dlcItems.map(item => ({...item, type: 'dlc' }));

        elements.dlcCount.textContent = data.count || 0;

        // Обновляем пагинацию
        updatePagination(data.count, page);

        // Рендерим продукты
        renderProducts();
    } catch (error) {
        console.error("DLC load error:", error);
    }
}

async function loadInitialData() {
    try {
        showLoader();
        await loadGames(1); // Загружаем первую страницу игр
        hideLoader();
    } catch (error) {
        console.error("Initial load error:", error);
        showError();
    } finally {
        hideLoader();
    }
}