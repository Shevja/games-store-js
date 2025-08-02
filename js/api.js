// Модифицированные функции загрузки
async function loadAllGames() {
    if (gamesLoaded) return;

    try {
        showLoader();

        // 1. Проверяем кеш
        const cachedData = getCachedData();
        if (cachedData && cachedData.games) {
            dataCache.games = cachedData.games.filter(game =>
                game.prices && game.prices.key && game.prices.key.price > 0
            );
            allProducts = [...allProducts, ...dataCache.games.map(item => ({...item, type: 'games' }))];
            elements.gamesCount.textContent = dataCache.games.length;
            gamesLoaded = true;

            if (currentType === 'games') {
                filterProducts();
                renderProducts();
            }

            // Если кеш свежий, не загружаем заново
            if (!isCacheExpired(cachedData.timestamp)) {
                hideLoader();
                return;
            }
        }

        // 2. Загрузка новых данных, если кеш устарел или отсутствует
        const batchSize = 40;
        let allGames = [];

        const idsResponse = await fetch(`${API_BASE}/games/sales/?limit=1000&offset=0`);
        const idsData = await idsResponse.json();

        if (!idsData.results || idsData.results.length === 0) {
            gamesLoaded = true;
            return;
        }

        const validIds = idsData.results
            .filter(item => item.prices && item.prices.key && item.prices.key.price > 0)
            .map(item => item.product_id);

        const batches = [];
        for (let i = 0; i < validIds.length; i += batchSize) {
            batches.push(validIds.slice(i, i + batchSize));
        }

        for (const batch of batches) {
            const batchPromises = batch.map(id =>
                fetch(`${API_BASE}/game_id/${id}`)
                .then(res => res.json())
                .catch(() => null)
            );

            const batchResults = await Promise.all(batchPromises);
            const validGames = batchResults.filter(game =>
                game && game.prices && game.prices.key && game.prices.key.price > 0
            );

            allGames = [...allGames, ...validGames];
            dataCache.games = allGames;
            allProducts = [...allProducts, ...validGames.map(item => ({...item, type: 'games' }))];
            elements.gamesCount.textContent = allGames.length;

            if (batch === batches[0]) { // Первая пачка
                filterProducts();
                renderProducts();
            }
        }

        gamesLoaded = true;
        filterProducts();
        renderProducts();

        // Сохраняем в кеш
        saveDataToCache({
            games: dataCache.games,
            dlc: dataCache.dlc,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error("Games load error:", error);
    } finally {
        hideLoader();
    }
}

async function loadAllDLC() {
    if (dlcLoaded) return;

    try {
        showLoader();

        // Проверяем кеш
        const cachedData = getCachedData();
        if (cachedData && cachedData.dlc) {
            dataCache.dlc = cachedData.dlc.filter(item =>
                item.prices && item.prices.key && item.prices.key.price > 0
            );
            allProducts = [...allProducts, ...dataCache.dlc.map(item => ({...item, type: 'dlc' }))];
            elements.dlcCount.textContent = dataCache.dlc.length;
            dlcLoaded = true;

            if (currentType === 'dlc') {
                filterProducts();
                renderProducts();
            }

            if (!isCacheExpired(cachedData.timestamp)) {
                hideLoader();
                return;
            }
        }

        // Загрузка новых данных
        const response = await fetch(`${API_BASE}/games/dlc`);
        const data = await response.json();

        const dlcItems = Array.isArray(data) ? data : (data && data.results || []);
        const validDLC = dlcItems.filter(item =>
            item.prices && item.prices.key && item.prices.key.price > 0
        );

        dataCache.dlc = validDLC;
        allProducts = [...allProducts, ...validDLC.map(item => ({...item, type: 'dlc' }))];
        elements.dlcCount.textContent = validDLC.length;
        dlcLoaded = true;

        if (currentType === 'dlc') {
            filterProducts();
            renderProducts();
        }

        // Обновляем кеш
        const currentCache = getCachedData() || {};
        saveDataToCache({
            ...currentCache,
            dlc: dataCache.dlc,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error("DLC load error:", error);
    } finally {
        hideLoader();
    }
}

// Вспомогательные функции для работы с кешем
function getCachedData() {
    const cachedData = localStorage.getItem(CACHE_KEY);
    return cachedData ? JSON.parse(cachedData) : null;
}

function saveDataToCache(data) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

function isCacheExpired(timestamp) {
    if (!timestamp) return true;
    const hoursDiff = (Date.now() - timestamp) / (1000 * 60 * 60);
    return hoursDiff > CACHE_EXPIRY_HOURS;
}

// Модифицированная функция начальной загрузки
async function loadInitialData() {
    try {
        showLoader();

        // Проверяем кеш
        const cachedData = getCachedData();
        if (cachedData && !isCacheExpired(cachedData.timestamp)) {
            if (cachedData.games) {
                dataCache.games = cachedData.games;
                allProducts = [...allProducts, ...dataCache.games.map(item => ({...item, type: 'games' }))];
                elements.gamesCount.textContent = dataCache.games.length;
                gamesLoaded = true;
            }
            if (cachedData.dlc) {
                dataCache.dlc = cachedData.dlc;
                allProducts = [...allProducts, ...dataCache.dlc.map(item => ({...item, type: 'dlc' }))];
                elements.dlcCount.textContent = dataCache.dlc.length;
                dlcLoaded = true;
            }

            filterProducts();
            renderProducts();
            hideLoader();

            // Загружаем свежие данные в фоне
            setTimeout(() => {
                Promise.all([loadAllGames(), loadAllDLC()]).catch(console.error);
            }, 1000);

            return;
        }

        // Если кеш устарел или отсутствует, загружаем сразу
        await Promise.all([loadAllGames(), loadAllDLC()]);
    } catch (error) {
        console.error("Initial load error:", error);
        showError();
    } finally {
        hideLoader();
    }
}