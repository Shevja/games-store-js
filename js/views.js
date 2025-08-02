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

    const priceText = price !== "—" ? `От ${price} ₽` : "Цена не указана";
    const title = product.title || "Без названия";
    const image = product.image || "img/placeholder.jpg";
    const description = product.short_description || truncateDescription(product.description) || "Описание отсутствует";

    if (currentView === 'grid') {
        card.innerHTML = `
          
            <img src="${image}" alt="${title}" loading="lazy" />
            <div>
            <h4>${title}</h4>
            <p class="product-price">${priceText}</p>
              </div>
        `;
    } else if (currentView === 'list') {
        card.innerHTML = `
            <img src="${image}" alt="${title}" loading="lazy" />
            <div>
                <h4>${title}</h4>
                <p>${description}</p>
                <p class="product-price">${priceText}</p>
            </div>
        `;
    } else {
        card.innerHTML = `
           <h4>${title} <span class="product-price">${price !== "—" ? price + " ₽" : "—"}</span></h4>
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