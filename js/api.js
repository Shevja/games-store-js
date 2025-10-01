async function loadGames(page = 1) {
    try {
        showLoader();
        const offset = (page - 1) * ITEMS_PER_PAGE;
        const response = await fetch(`${API_BASE}/sales/?offset=${offset}&limit=${ITEMS_PER_PAGE}`);
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

        elements.gamesCount.textContent = `(${data.count || 0})`;

        // Скрываем элементы пагинации для DLC если была скрыта
        elements.paginationContainer.style.display = '';

        // Обновляем пагинацию
        updatePagination(data.count, page);

        // Рендерим продукты
        renderProducts();
    } catch (error) {
        console.error("Games load error:", error);
    }
}

const DLC_ITEMS_LIMIT = 50; // Максимальное количество DLC, которое можно запросить

async function loadDLC() {
    try {
        showLoader();
        // Для DLC используем только limit, так как endpoint не поддерживает offset
        const response = await fetch(`${API_BASE}/sales/dlc?limit=${DLC_ITEMS_LIMIT}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Обработка данных DLC (без пагинации)
        const dlcItems = Array.isArray(data.results) ? data.results : [];
        dataCache.dlc = dlcItems.map(item => ({
            ...item,
            type: 'dlc',
            title: item.title || "DLC",
            image: item.image || (item.screenshots && item.screenshots[0]) || 'img/placeholder-dlc.jpg'
        }));

        allProducts = dataCache.dlc;
        elements.dlcCount.textContent = `(${dlcItems.length})`;

        // Скрываем элементы пагинации для DLC
        elements.paginationContainer.style.display = 'none';

        renderProducts();
    } catch (error) {
        console.error("DLC load error:", error);
        showError("Не удалось загрузить DLC");
        allProducts = [];
        renderProducts();
    } finally {
        hideLoader();
    }
}

async function loadInitialData() {
    try {
        showLoader();
        if (currentType === 'dlc') {
            await loadDLC();
        } else {
            await loadGames(1);
        }
    } catch (error) {
        console.error("Initial load error:", error);
        showError("Не удалось загрузить данные");
    } finally {
        hideLoader();
    }
}