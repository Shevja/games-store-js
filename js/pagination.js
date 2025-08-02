function filterProducts() {
    filteredProducts = allProducts.filter(product => {
        const matchesType = product.type === currentType;
        const matchesSearch = currentSearchQuery.length < 3 ||
            (product.title && product.title.toLowerCase().includes(currentSearchQuery.toLowerCase()));
        return matchesType && matchesSearch;
    });

    updatePagination(filteredProducts.length);
}

function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
    elements.pageInfo.textContent = `Страница ${currentPage} из ${totalPages}`;
    elements.prevPage.disabled = currentPage <= 1;
    elements.nextPage.disabled = currentPage >= totalPages;
}