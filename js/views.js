// Функция для получения минимальной цены продукта
function getProductPrice(product) {
    try {
        // Проверяем наличие объекта prices
        if (!product || !product.prices || typeof product.prices !== 'object') {
            return "—";
        }

        // Собираем все цены, исключая невалидные
        const validPrices = [];

        // Проверяем каждый тип цены
        const priceTypes = ['key', 'u_acc', 'new_acc'];
        priceTypes.forEach(type => {
            if (product.prices[type] &&
                typeof product.prices[type].price === 'number' &&
                product.prices[type].price > 0) {
                validPrices.push(product.prices[type].price);
            }
        });

        // Если нет валидных цен
        if (validPrices.length === 0) {
            return "—";
        }

        // Находим минимальную цену
        const minPrice = Math.min(...validPrices);
        return minPrice.toLocaleString('ru-RU');
    } catch (error) {
        console.error("Ошибка при получении цены:", error);
        return "—";
    }
}

function renderProducts() {
    if (isLoading) {
        showLoader();
        return;
    }

    elements.container.innerHTML = "";

    // Проверяем, есть ли товары для отображения
    if (!allProducts || allProducts.length === 0) {
        elements.container.innerHTML = currentSearchQuery.length >= 3 ?
            `<p class="no-results">По запросу "${currentSearchQuery}" ничего не найдено</p>` :
            '<p class="no-results">Товары не найдены</p>';
        hideLoader();
        return;
    }

    const productsWrapper = document.createElement("div");
    productsWrapper.className = `products-${currentView}`;

    // Рендерим товары (теперь allProducts содержит только текущую страницу)
    allProducts.forEach(product => {
        try {
            const price = getProductPrice(product);
            if (product && product.title && (product.image || (product.screenshots && product.screenshots[0]))) {
                const card = createProductCard(product, price);
                productsWrapper.appendChild(card);
            }
        } catch (error) {
            console.error("Ошибка при создании карточки товара:", error);
        }
    });

    elements.container.appendChild(productsWrapper);
    hideLoader();
}

function createProductCard(product, price) {
    const card = document.createElement("div");
    card.className = "product-card";

    // Проверяем наличие русской озвучки
    const hasRussianVoice = product.interface_ru &&
        (product.interface_ru.includes('русск') ||
            product.interface_ru.includes('russian') ||
            product.interface_ru.toLowerCase().includes('рус'));

    const priceText = price !== "—" ? `От ${price} ₽` : "Цена не указана";
    const title = product.title || "Без названия";
    const image = product.image || "img/placeholder.jpg";
    const description = product.short_description || truncateDescription(product.description) || "Описание отсутствует";

    // Элементы для отображения поверх карточки
    const overlayElements = `
        ${hasRussianVoice ? `
            <div class="voice-flag">
                <img src="img/ru.svg" alt="Русская озвучка" title="Русская озвучка">
            </div>
        ` : ''}
        
        ${product.sale_product && product.prices.key.discounted_percentage ? `
            <div class="discount-badge">
                -${product.prices.key.discounted_percentage}%
            </div>
        ` : ''}
    `;

    if (currentView === 'grid') {
        card.innerHTML = `
            ${overlayElements}
            <img src="${image}" alt="${title}" loading="lazy" />
            <div>
                <h4>${title}</h4>
                <p class="product-price">${priceText} ${product.sale_product ? `<span class="original-price">${product.prices.full_price}₽</span>` : ''}</p>
            </div>
        `;
    } else if (currentView === 'list') {
        card.innerHTML = `
            ${overlayElements}
            <img src="${image}" alt="${title}" loading="lazy" />
            <div>
                <h4>${title}</h4>
                <p class="list_text_card">${description}</p>
                <p class="product-price">${priceText} ${product.sale_product ? `<span class="original-price">${product.prices.full_price}₽</span>` : ''}</p>
            </div>
        `;
    } else {
        card.innerHTML = `
            <h4>${title}</h4>
            <p class="product-price">${priceText} ${product.sale_product ? `<span class="original-price">${product.prices.full_price}₽</span>` : ''}</p>
        `;
    }

    card.addEventListener("click", () => showDetails(product));
    return card;
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