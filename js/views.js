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
            
            ${product.sale_product ? `
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
                <p class="product-price">${priceText} ${product.sale_product ? `<span class="original-price">${product.full_price}₽</span>` : ''}</p>
            </div>
        `;
    } else if (currentView === 'list') {
        card.innerHTML = `
            ${overlayElements}
            <img src="${image}" alt="${title}" loading="lazy" />
            <div>
                <h4>${title}</h4>
                <p class="list_text_card">${description}</p>
                <p class="product-price">${priceText} ${product.sale_product ? `<span class="original-price">${product.full_price}₽</span>` : ''}</p>
            </div>
        `;
    } else {
        card.innerHTML = `
            <h4>${title} <p class="product-price">${priceText} ${product.sale_product ? `<span class="original-price">${product.full_price}₽</span>` : ''}</p></h4>
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