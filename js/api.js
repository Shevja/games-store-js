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