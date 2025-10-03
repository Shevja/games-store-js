let isSoundEnabled = true;
let destroySwipeClose = null;

function openModalWindow() {
    document.body.style.overflow = 'hidden';
    elements.modal.classList.remove("hidden");
    elements.modal.classList.add("active");
}

function closeModalWindow() {
    document.body.style.overflow = 'auto';
    elements.modal.classList.add("hidden");
    elements.modal.classList.remove("active");

    if (destroySwipeClose) {
        destroySwipeClose();
        destroySwipeClose = null;
    }

    // Останавливаем все видео при закрытии модального окна
    document.querySelectorAll('video').forEach(video => {
        video.pause();
    });

    if (elements.container.innerHTML === "") {
        renderProducts();
    }
}

function initModalSwipe() {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    let isGrabHeader = false;

    const modalContent = elements.modalContent;
    const modalBody = elements.modalBody;

    function handleTouchStart(e) {
        const touchY = e.touches[0].clientY;
        isGrabHeader = touchY - modalContent.getBoundingClientRect().top <= SWIPE_START_ZONE;

        // если есть скролл внутри body, значит не закрываем модалку
        if (!isGrabHeader && modalBody.scrollTop > 0) return;

        startY = e.touches[0].clientY;
        currentY = startY;
        isDragging = true;

        modalContent.style.transition = 'none';
    }

    function handleTouchMove(e) {
        if (!isDragging) return;

        currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        if (diff > 0) {
            // тянем вниз, блокируем скролл внутри
            modalBody.style.overflow = 'hidden';
            modalContent.style.transform = `translateY(${diff}px)`;
        } else {
            // жест вверх, не блокируем скролл
            modalBody.style.overflow = '';
        }
    }

    function handleTouchEnd() {
        if (!isDragging) return;
        isDragging = false;

        const diff = currentY - startY;
        modalContent.style.transition = 'transform .3s ease';
        modalBody.style.overflow = ''; // возвращаем скролл

        if (diff > SWIPE_CLOSE_THRESHOLD) {
            modalContent.style.transform = 'translateY(100%)';

            modalContent.addEventListener('transitionend', function cleanup() {
                modalContent.style.transform = '';
                modalContent.removeEventListener('transitionend', cleanup);
            });

            closeModalWindow();
        } else {
            modalContent.style.transform = '';
        }
    }

    function updateSwipeState() {
        const isMobile = window.matchMedia("(max-width: 768px)").matches;

        modalContent.removeEventListener('touchstart', handleTouchStart);
        modalContent.removeEventListener('touchmove', handleTouchMove);
        modalContent.removeEventListener('touchend', handleTouchEnd);

        if (isMobile) {
            modalContent.addEventListener('touchstart', handleTouchStart, {passive: true});
            modalContent.addEventListener('touchmove', handleTouchMove, {passive: false}); // важно! false
            modalContent.addEventListener('touchend', handleTouchEnd);
        }
    }

    updateSwipeState();
    window.addEventListener('resize', updateSwipeState);

    return () => {
        modalContent.removeEventListener('touchstart', handleTouchStart);
        modalContent.removeEventListener('touchmove', handleTouchMove);
        modalContent.removeEventListener('touchend', handleTouchEnd);
        window.removeEventListener('resize', updateSwipeState);
    };
}

async function showDetails(product) {
    if (isLoading) return;
    isLoading = true;
    showLoader();
    openModalWindow();
    destroySwipeClose = initModalSwipe()

    try {
        // Проверяем, что product содержит необходимые данные
        if (!product || !product.product_id) {
            throw new Error("Неверные данные продукта");
        }

        // Всегда загружаем полные данные по продукту
        const response = await fetch(`${API_BASE}/games/game_id/${product.product_id}`);
        const fullProductData = await response.json();

        if (!fullProductData) {
            throw new Error("Не удалось загрузить данные продукта");
        }

        // Проверяем наличие обязательных полей
        if (!fullProductData.prices) {
            fullProductData.prices = {
                key: {price: 0},
                u_acc: {price: 0},
                new_acc: {price: 0}
            };
        }

        const prices = fullProductData.prices;
        const keyPrice = (prices && prices.key && prices.key.price !== undefined) ? prices.key.price : 0;
        const uAccPrice = (prices && prices.u_acc && prices.u_acc.price !== undefined) ? prices.u_acc.price : 0;
        const newAccPrice = (prices && prices.new_acc && prices.new_acc.price !== undefined) ? prices.new_acc.price : 0;

        // Добавляем fallback для описания
        if (!fullProductData.description) {
            fullProductData.description = "Описание отсутствует";
        }

        renderModalContent(fullProductData, keyPrice, uAccPrice, newAccPrice);
    } catch (error) {
        console.error("Details error:", error);
        elements.modalBody.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Ошибка загрузки данных: ${error.message}</p>
                <button class="retry-button" onclick="showDetails(${JSON.stringify(product).replace(/"/g, '&quot;')})">
                    Попробовать снова
                </button>
            </div>
        `;
    } finally {
        isLoading = false;
        hideLoader();
    }
}

function renderModalContent(product, keyPrice, uAccPrice, newAccPrice) {
    // Форматируем даты
    const releaseDate = product.release_date ? new Date(product.release_date).toLocaleDateString('ru-RU') : 'Не указана';
    const endSaleDate = product.end_date_sale ? new Date(product.end_date_sale).toLocaleDateString('ru-RU') : 'Не ограничена';

    // Создаем блок с мета-информацией
    const metaInfo = [];

    // Основная информация
    if (product.compatibility) metaInfo.push(`<div><strong>Совместимость:</strong> ${product.compatibility}</div>`);
    if (product.categories && product.categories.length) {
        metaInfo.push(`<div><strong>Жанры:</strong> ${product.categories.join(', ')}</div>`);
    }
    if (releaseDate) metaInfo.push(`<div><strong>Дата выхода:</strong> ${releaseDate}</div>`);

    // Функция для форматирования языковых значений
    function formatLanguageValue(value, type) {
        if (!value) return value;
        const val = value.toLowerCase();

        const hasRussian = val.includes('рус') || val.includes('russian');
        const hasEnglish = val.includes('англ') || val.includes('english');
        let result = [];
        if (hasRussian) result.push(`Русс <img src="img/ru.svg" alt="Русская озвучка" title="Русская озвучка">`);
        if (hasEnglish) result.push(`Англ <img src="img/en.webp" alt="Русская озвучка" title="Русская озвучка">`);
        return result.join(' и ');
    }

    // Добавляем информацию о языках
    if (product.voice_acting) metaInfo.push(`<div><strong>Озвучка:</strong> ${formatLanguageValue(product.voice_acting, 'voice')}</div>`);
    if (product.interface_ru) metaInfo.push(`<div><strong>Интерфейс:</strong> ${formatLanguageValue(product.interface_ru, 'interface')}</div>`);
    if (product.subtitles) metaInfo.push(`<div><strong>Субтитры:</strong> ${formatLanguageValue(product.subtitles, 'subtitles')}</div>`);
    if (product.developer) metaInfo.push(`<div><strong>Разработчик:</strong> ${product.developer}</div>`);
    if (product.publisher) metaInfo.push(`<div><strong>Издатель:</strong> ${product.publisher}</div>`);
    if (product.capabilities) metaInfo.push(`<div><strong>Возможности:</strong> ${product.capabilities}</div>`);

    // Скриншоты
    let screenshotsContent = '';
    if (product.screenshots && product.screenshots.length) {
        screenshotsContent = `
        <div class="media-section">
            <div class="screenshots-list">
                ${product.screenshots.map(img => `
                    <div class="screenshot-item">
                        <img src="${img}" loading="lazy" alt="Скриншот игры" onclick="openFullscreenImage('${img}')" />
                    </div>
                `).join('')}
            </div>
        </div>`;
    }

    // Видео
    let videosContent = '';
    if (product.videos && product.videos.length) {
        videosContent = `
        <div class="media-section">
            <div class="videos-grid">
                ${product.videos.map((video, index) => {
            const videoId = `video-${Date.now()}-${index}`;
            const isHLS = video.endsWith('.m3u8');
            return `
                    <div class="video-wrapper">
                        <video id="${videoId}" controls preload="metadata" 
                            poster="${product.image || 'img/placeholder.jpg'}"
                            style="width:100%; background:#000;">
                            ${!isHLS ? `<source src="${video}" type="video/mp4">` : ''}
                            Ваш браузер не поддерживает видео.
                        </video>
                        ${isHLS ? `
                        <script>
                            (function() {
                                const video = document.getElementById('${videoId}');
                                if(Hls.isSupported()) {
                                    const hls = new Hls();
                                    hls.loadSource('${video}');
                                    hls.attachMedia(video);
                                    video.addEventListener('click', function() {
                                        video.play().catch(e => console.log('Play error:', e));
                                    });
                                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                                    video.src = '${video}';
                                }
                            })();
                        </script>
                        ` : ''}
                    </div>`;
        }).join('')}
            </div>
        </div>`;
    }

    // Описание
    const descriptionId = `desc-${Date.now()}`;
    const descriptionContent = `
        <div class="description-content" id="${descriptionId}">
            <p>${product.description || 'Описание отсутствует'}</p>
        </div>
    `;

    // Game header info
    const gameHeaderInfo = `
        <div class="game-header-info">
            <div class="game-meta">${metaInfo.join('')}</div>
        </div>
    `;

    // Определяем мобильное устройство
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const firstVideo = product.videos && product.videos.length > 0 ? product.videos[0] : null;
    const isHLS = firstVideo && firstVideo.endsWith('.m3u8');
    let isSoundEnabled = localStorage.getItem('videoSoundEnabled') !== 'false';

    // Проверяем наличие русской озвучки
    const hasRussianVoice = product.interface_ru &&
        (product.interface_ru.includes('русск') ||
            product.interface_ru.includes('russian') ||
            product.interface_ru.toLowerCase().includes('рус'));

    // Проверяем совместимость с Xbox Series X/S
    const isXboxSeriesCompatible = product.compatibility &&
        (product.compatibility.includes('Xbox Series') ||
            product.compatibility.includes('XSX') ||
            product.compatibility.includes('XSS'));

    // Создаем массив доступных цен
    const availablePrices = [];
    if (keyPrice > 0) availablePrices.push({
        type: 'key',
        price: keyPrice,
        title: 'Ключ активации',
        desc: 'Мгновенная доставка на email',
        discounted: product.sale_product ? product.prices.key.discounted_percentage : null
    });
    if (uAccPrice > 0) availablePrices.push({
        type: 'u_acc',
        price: uAccPrice,
        title: 'На ваш аккаунт',
        desc: 'Привязка к вашему аккаунту Xbox',
        discounted: product.sale_product && product.prices.u_acc ? product.prices.u_acc.discounted_percentage : null
    });
    if (newAccPrice > 0) availablePrices.push({
        type: 'new_acc',
        price: newAccPrice,
        title: 'На новый аккаунт',
        desc: 'Полный доступ к новому аккаунту',
        discounted: product.sale_product && product.prices.new_acc ? product.prices.new_acc.discounted_percentage : null
    });

    // Находим минимальную цену
    const minPrice = availablePrices.length > 0 ?
        Math.min(...availablePrices.map(p => p.price)) :
        null;

    let priceOptionsHTML = `
        <div class="purchase-variants">
            ${availablePrices.map((priceObj, index) => {
        const isMinPrice = priceObj.price === minPrice;
        const discountPercentage = product.prices[priceObj.type].discounted_percentage;
        const hasDiscount = discountPercentage > 0;

        const priceDisplay = hasDiscount ? `
                    <div class="variant-price-wrapper">
                        <span class="variant-price">${priceObj.price}₽</span>
                        <span class="variant-discount">-${discountPercentage}%</span>
                    </div>
                ` : `
                    <div class="variant-price-wrapper">
                        <span class="variant-price">${priceObj.price}₽</span>
                    </div>
                `;

        return `
                    <button class="variant-btn ${isMinPrice ? 'selected' : ''}" 
                            data-price="${priceObj.price}" 
                            data-type="${priceObj.type}">
                        <span class="variant-title">${priceObj.title}</span>
                        ${priceDisplay}
                    </button>
                `;
    }).join('')}
        </div>
    `;

    // Если нет доступных вариантов
    if (availablePrices.length === 0) {
        priceOptionsHTML = '<div class="no-prices-message">Нет доступных вариантов покупки</div>';
    }

    // Обновляем блок с ценой
    const coverPriceHTML = minPrice ? `
        <div class="cover-price">
            <span class="final-price"><span class="ot_price">от</span>${minPrice}₽</span>
            ${product.sale_product ? `<span class="original-price">${product.prices.full_price}₽</span>` : ''}
        </div>
    ` : '';

    // Создаём HTML для элементов поверх обложки
    const overlayElements = `
    <div class="bottom_left">
        ${hasRussianVoice ? `
            <div class="voice-flag">
                <img src="img/ru.svg" alt="Русская озвучка" title="Русская озвучка">
            </div>
        ` : ''}
        ${isXboxSeriesCompatible ? '' : `
            <div class="xbox-icon">
                <img src="img/xs.svg" alt="Xbox Series X/S" title="Не совместимо с Xbox Series X/S">
            </div>
        `}
    </div>
    ${coverPriceHTML}
    `;

    // Создаем медиа-контент
    let mediaContent = '';
    if (isMobile && firstVideo) {
        mediaContent = `
            <div class="mobile-video-container">
                <video autoplay loop ${isSoundEnabled ? '' : 'muted'} playsinline
                    poster="${product.image || (product.screenshots && product.screenshots[0]) || 'img/placeholder.jpg'}"
                    class="game-cover">
                    ${!isHLS ? `<source src="${firstVideo}" type="video/mp4">` : ''}
                    Ваш браузер не поддерживает видео.
                </video>
                ${overlayElements}
                <button class="sound-toggle ${isSoundEnabled ? 'sound-on' : 'sound-off'}">
                    <i class="fas fa-volume-${isSoundEnabled ? 'up' : 'mute'}"></i>
                </button>
            </div>
        `;
    } else {
        const fallbackImage = (product.screenshots && product.screenshots.length > 0)
            ? product.screenshots[0]
            : 'img/placeholder.jpg';

        mediaContent = `
            <div class="game-cover-container">
                <img src="${fallbackImage}" 
                     loading="lazy" 
                     alt="Обложка игры" 
                     class="game-cover" 
                     onclick="openFullscreenImage('${fallbackImage}')"/>
                ${overlayElements}
            </div>
        `;
    }

    // Создаём табы
    const tabsContent = `
        <div class="modal-tabs">
            <button class="tab-button active" data-tab="about">Об игре</button>
            <button class="tab-button" data-tab="description">Описание</button>
            ${product.screenshots && product.screenshots.length ? '<button class="tab-button" data-tab="screenshots">Скриншоты</button>' : ''}
            ${product.videos && product.videos.length ? '<button class="tab-button" data-tab="videos">Видео</button>' : ''}
        </div>
    `;

    // Вставляем HTML вариантов покупки
    const purchaseOptionsHTML = `
        <div class="purchase-options">
            ${priceOptionsHTML}
        </div>
    `;

    const gameTitleWrapper = `
        <div class="game-title-wrapper">
            <div class="game_title_img">
                <img src="${product.image || (product.screenshots && product.screenshots[0]) || 'img/placeholder.jpg'}" 
                     class="game-thumbnail"
                     onclick="openFullscreenImage('${product.image || (product.screenshots && product.screenshots[0]) || 'img/placeholder.jpg'}')"/>
            </div>
            <div class="game_title_info">
                <h2>${product.title || 'Без названия'}</h2>
                <div class="sale-info"><span class="icon_modal"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" width="1em" height="1em" class="TagIcon-module__icon___idvrW TagIcon-module__primaryIcon___kF7Ys ProductTags-module__salesTagIcon___YZ-rE Icon-module__icon___6ICyA"><path d="M1024 0h896v896L896 1920 0 1024 1024 0zm448 624q36 0 68-14t56-38 38-56 14-68q0-36-14-68t-38-56-56-38-68-14q-36 0-68 14t-56 38-38 56-14 68q0 36 14 68t38 56 56 38 68 14z"></path></svg></span>Скидка действует до: ${endSaleDate}</div>
            </div>
        </div>
    `

    // Формируем HTML
    elements.modalBody.innerHTML = `
        <div class="modal-header">
            <div class="game-cover-container">
                ${mediaContent}
                ${product.prices.key.discounted_percentage ? `<div class="discount-badge">Скидка ${product.prices.key.discounted_percentage}%</div>` : ''}
            </div>
        </div>
        ${tabsContent}
        <div class="modal_info_content">
            <div class="modal-content-grid">
                <div class="main-content">
                    <div>
                        ${gameTitleWrapper}
                        ${purchaseOptionsHTML}
                    </div>
                    
                    <div class="tab-content about-tab active">
                        ${gameHeaderInfo}
                    </div>
                    
                    <div class="tab-content description-tab">
                        ${descriptionContent}
                    </div>
                    
                    ${product.screenshots && product.screenshots.length ? `
                    <div class="tab-content screenshots-tab">
                        ${screenshotsContent}
                    </div>
                    ` : ''}
                    
                    ${product.videos && product.videos.length ? `
                    <div class="tab-content videos-tab">
                        ${videosContent}
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
        <div class="buy-button__wrapper">
            <button class="buy-button" id="modalBuyButton">
                ${availablePrices.length > 0 ? `Выберите вариант покупки` : 'Нет доступных вариантов'}
            </button>
        </div>
    `;

    // Добавляем обработчики для табов
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            document.querySelector(`.${button.dataset.tab}-tab`).classList.add('active');
        });
    });

    // Инициализация кнопки "Подробнее" для описания
    if (product.description) {
        const descContainer = document.getElementById(descriptionId);
        if (descContainer) {
            descContainer.style.maxHeight = 'none';
            descContainer.style.overflow = 'visible';
        }
    }

    // initGameMetaReadMore();
    initVideoPlayers();

    // Обработчик для кнопки покупки
    let selectedPurchaseOption = null

    if (availablePrices.length > 0) {
        document.querySelectorAll('.variant-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');

                const price = this.dataset.price;
                const buyBtn = document.getElementById('modalBuyButton');
                buyBtn.innerHTML = `<i class="fas fa-shopping-cart"></i> Добавить в корзину за ${price}₽`;
                buyBtn.disabled = false;

                selectedPurchaseOption = {
                    type: this.dataset.type,
                    price: price
                };
            });
        });

        document.getElementById('modalBuyButton').addEventListener('click', function (e) {
            e.preventDefault();

            if (!selectedPurchaseOption) {
                showNotification('Пожалуйста, выберите вариант покупки');
                return;
            }

            addToCart(
                product.product_id,
                product.title || 'Без названия',
                parseInt(selectedPurchaseOption.price),
                selectedPurchaseOption.type
            );
        });
    }
}

function openFullscreenImage(src) {
    const fullscreenDiv = document.createElement('div');
    fullscreenDiv.className = 'fullscreen-image';
    fullscreenDiv.innerHTML = `
        <img src="${src}" class="fullscreen-image-content">
        <button class="close-fullscreen">&times;</button>
    `;
    document.body.appendChild(fullscreenDiv);

    fullscreenDiv.querySelector('.close-fullscreen').addEventListener('click', () => {
        document.body.removeChild(fullscreenDiv);
    });

    fullscreenDiv.addEventListener('click', (e) => {
        if (e.target === fullscreenDiv) {
            document.body.removeChild(fullscreenDiv);
        }
    });
}

function initVideoPlayers() {
    const soundToggle = document.querySelector('.sound-toggle');
    if (soundToggle) {
        soundToggle.addEventListener('click', function () {
            isSoundEnabled = !isSoundEnabled;

            document.querySelectorAll('video').forEach(video => {
                video.muted = !isSoundEnabled;
            });

            this.classList.toggle('sound-on', isSoundEnabled);
            this.classList.toggle('sound-off', !isSoundEnabled);
            this.innerHTML = `<i class="fas fa-volume-${isSoundEnabled ? 'up' : 'mute'}"></i>`;

            localStorage.setItem('videoSoundEnabled', isSoundEnabled);
        });
    }

    document.querySelectorAll('video').forEach(video => {
        video.muted = !isSoundEnabled;

        const wrapper = video.closest('.video-wrapper');
        if (wrapper) {
            video.addEventListener('play', () => {
                wrapper.classList.add('playing');
            });

            video.addEventListener('pause', () => {
                wrapper.classList.remove('playing');
            });

            video.addEventListener('click', function (e) {
                if (video.paused) {
                    video.play().catch(e => console.log('Play error:', e));
                } else {
                    video.pause();
                }
            });
        }
    });
}

function initGameMetaReadMore() {
    document.querySelectorAll('.game-meta').forEach(meta => {
        meta.dataset.originalHeight = meta.scrollHeight;

        if (meta.scrollHeight <= 70) {
            meta.style.removeProperty('overflow');
            return;
        }

        meta.classList.add('collapsible-meta');
        meta.style.maxHeight = '70px';
        meta.style.overflow = 'hidden';
        meta.style.transition = 'max-height 0.3s ease';
        meta.style.position = 'relative';
        meta.style.cursor = 'pointer';

        const btn = document.createElement('button');
        btn.className = 'read-more-btn';
        btn.innerHTML = `Ещё`;

        meta.insertAdjacentElement('afterend', btn);

        const toggle = () => {
            if (meta.style.maxHeight === '70px') {
                meta.style.maxHeight = `${meta.dataset.originalHeight}px`;
                btn.innerHTML = `Скрыть`;
                meta.classList.add('expanded');
            } else {
                meta.style.maxHeight = '70px';
                btn.innerHTML = `Ещё`;
                meta.classList.remove('expanded');
            }
        };

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggle();
        });

        meta.addEventListener('click', toggle);
    });
}