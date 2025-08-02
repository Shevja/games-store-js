function showLoader() {
    elements.container.innerHTML = '<div class="loader-container"><div class="loader"></div></div>';
}

function hideLoader() {
    const loader = elements.container.querySelector('.loader-container');
    if (loader) loader.remove();
}

function showError() {
    elements.container.innerHTML = `
        <div class="error">
            <p>Не удалось загрузить товары. Попробуйте позже.</p>
            <button onclick="location.reload()">Обновить</button>
        </div>
    `;
}

function getProductPrice(product) {
    if (!product.prices) return "—";

    const prices = [];
    const priceTypes = ['key', 'u_acc', 'new_acc'];

    priceTypes.forEach(type => {
        if (product.prices[type] != null && product.prices[type].price != null) {
            prices.push(product.prices[type].price);
        }
    });

    return prices.length > 0 ? Math.min(...prices) : "—";
}

function truncateDescription(desc, length = 100) {
    return desc && desc.length > length ? desc.substring(0, length) + '...' : desc;
}

function canPlayMP4() {
    const video = document.createElement('video');
    return !!video.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
}