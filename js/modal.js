let isSoundEnabled = true;

function openModalWindow() {
    document.body.style.overflow = 'hidden';
    elements.modal.classList.remove("hidden");
    elements.modal.classList.add("active");
}

function closeModalWindow() {
    document.body.style.overflow = 'auto';
    elements.modal.classList.add("hidden");
    elements.modal.classList.remove("active");

    // Останавливаем все видео при закрытии модального окна
    document.querySelectorAll('video').forEach(video => {
        video.pause();
    });

    if (elements.container.innerHTML === "") {
        renderProducts();
    }
}

async function showDetails(product) {
    if (isLoading) return;
    isLoading = true;
    showLoader();
    openModalWindow();

    try {
        // Проверяем, что product содержит необходимые данные
        if (!product || !product.product_id) {
            throw new Error("Неверные данные продукта");
        }

        // Всегда загружаем полные данные по продукту
        const response = await fetch(`${API_BASE}/game_id/${product.product_id}`);
        const fullProductData = await response.json();

        if (!fullProductData) {
            throw new Error("Не удалось загрузить данные продукта");
        }

        // Проверяем наличие обязательных полей
        if (!fullProductData.prices) {
            fullProductData.prices = {
                key: { price: 0 },
                u_acc: { price: 0 },
                new_acc: { price: 0 }
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
        const endings = {
            'voice': { 'rus': 'ая', 'eng': 'ая' },
            'interface': { 'rus': 'ий', 'eng': 'ий' },
            'subtitles': { 'rus': 'ие', 'eng': 'ие' }
        };
        const hasRussian = val.includes('рус') || val.includes('russian');
        const hasEnglish = val.includes('англ') || val.includes('english');
        let result = [];
        if (hasRussian) result.push(`Русск${endings[type].rus}`);
        if (hasEnglish) result.push(`Английск${endings[type].eng}`);
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
            <h3>Скриншоты (${product.screenshots.length})</h3>
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
            <h3>Видео</h3>
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
        <div class="description-section">
            <h3>Описание</h3>
            <div class="description-content" id="${descriptionId}">
                <p>${product.description || 'Описание отсутствует'}</p>
            </div>
            <button class="read-more-btn" data-target="${descriptionId}">Ещё</button>
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

    // Генерируем варианты покупки
     let priceOptionsHTML = '';
    availablePrices.forEach((priceObj, index) => {
        const isMinPrice = priceObj.price === minPrice;
        const optionId = `option-${Date.now()}-${index}`; // Уникальный ID для каждого варианта
        priceOptionsHTML += `
            <div class="price-option ${isMinPrice ? 'selected' : ''}" data-price="${priceObj.price}" data-type="${priceObj.type}">
                <input type="radio" name="priceOption" id="${optionId}" ${isMinPrice ? 'checked' : ''}>
                <label for="${optionId}" class="price-option-label">
                    <span class="option-title">${priceObj.title}</span>
                    <span class="option-price">${priceObj.price}₽
                      
                    </span>
                    <span class="option-desc">${priceObj.desc}</span>
                </label>
            </div>
        `;
    });


    // Если нет доступных вариантов
    if (availablePrices.length === 0) {
        priceOptionsHTML = '<div class="no-prices-message">Нет доступных вариантов покупки</div>';
    }

    // Обновляем блок с ценой
    const coverPriceHTML = minPrice ? `
        <div class="cover-price">
            <span class="final-price"><span class="ot_price">от</span>${minPrice}₽</span>
            ${product.sale_product ? `<span class="original-price">${product.full_price}₽</span>` : ''}
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

    // Создаём табы для мобильной версии
    const mobileTabs = isMobile ? `
        <div class="mobile-tabs">
            <button class="tab-button active" data-tab="about">Об игре</button>
            <button class="tab-button" data-tab="screenshots">Скриншоты</button>
        </div>
    ` : '';

    // Вставляем HTML вариантов покупки
  const purchaseOptionsHTML = `
        <div class="purchase-options">
            <h3>Варианты покупки</h3>
            ${priceOptionsHTML}
            ${availablePrices.length > 0 ? `
                <button class="buy-button" id="modalBuyButton">
                    <i class="fas fa-shopping-cart"></i> Купить за ${minPrice}₽
                </button>
                <div class="secure-info">
                    <i class="fas fa-shield-alt"></i> Безопасная оплата и гарантия возврата
                </div>
            ` : ''}
        </div>
    `;

    // Формируем HTML
    elements.modalBody.innerHTML = `
        <div class="modal-header">
            <div class="game-cover-container">
                ${mediaContent}
                ${product.sale_product ? `<div class="discount-badge">-${product.prices.key.discounted_percentage}%</div>` : ''}
            </div>
        </div>
        ${mobileTabs}
        <div class="modal_info_content">
            <div class="modal-content-grid">
                <div class="main-content ${isMobile ? 'mobile-view' : ''}">
                    <div class="tab-content about-tab ${isMobile ? 'active' : ''}">
                        <div class="game-title-wrapper">
                            <div class="game_title_img">
                                <img src="${product.image || (product.screenshots && product.screenshots[0]) || 'img/placeholder.jpg'}" 
                                     class="game-thumbnail"
                                     onclick="openFullscreenImage('${product.image || (product.screenshots && product.screenshots[0]) || 'img/placeholder.jpg'}')"/>
                            </div>
                            <div class="game_title_info">
                                <h2>${product.title || 'Без названия'}</h2>
                                <div class="sale-info">Акция действует до: ${endSaleDate}</div>
                            </div>
                        </div>
                        ${gameHeaderInfo}        
                        ${descriptionContent}
                        ${!isMobile ? videosContent : ''}
                    </div>
                    ${isMobile ? `
                    <div class="tab-content screenshots-tab">
                        ${screenshotsContent}
                        ${videosContent}
                    </div>
                    ` : `
                    ${screenshotsContent}
                    `}
                </div>
                <div class="sidebar">
                    ${purchaseOptionsHTML}
                </div>
            </div>
        </div>
    `;

    // Добавляем обработчики для табов (только на мобильных)
    if (isMobile) {
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                button.classList.add('active');
                document.querySelector(`.${button.dataset.tab}-tab`).classList.add('active');
            });
        });
    }
    
    // Инициализация кнопки "Подробнее"
    if (product.description) {
        initReadMoreButton(descriptionId);
    }
    initGameMetaReadMore();
    initVideoPlayers();
    
    // Обработчик для кнопки покупки
    if (availablePrices.length > 0) {
        document.querySelectorAll('.price-option').forEach(option => {
            // Обработчик клика по всему блоку варианта
            option.addEventListener('click', function(e) {
                // Игнорируем клики по самому input или label
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL') return;
                
                document.querySelectorAll('.price-option').forEach(el => el.classList.remove('selected'));
                this.classList.add('selected');
                const radioInput = this.querySelector('input[type="radio"]');
                radioInput.checked = true;
                
                const price = this.dataset.price;
                const btn = document.querySelector('.buy-button');
                btn.textContent = `Купить за ${price}₽`;
            });

            // Обработчик изменения radio кнопки
            const radioInput = option.querySelector('input[type="radio"]');
            radioInput.addEventListener('change', function() {
                if (this.checked) {
                    document.querySelectorAll('.price-option').forEach(el => el.classList.remove('selected'));
                    option.classList.add('selected');
                    const price = option.dataset.price;
                    const btn = document.querySelector('.buy-button');
                    btn.textContent = `Купить за ${price}₽`;
                }
            });
        });

        // Обработчик для кнопки покупки
        document.getElementById('modalBuyButton').addEventListener('click', function(e) {
            e.preventDefault();
            const selectedOption = document.querySelector('.price-option.selected');
            if (selectedOption) {
                addToCart(
                    product.product_id, 
                    product.title || 'Без названия', 
                    parseInt(selectedOption.dataset.price),
                    selectedOption.dataset.type
                );
            }
        });
    }
}

// Функция для открытия изображения на весь экран
function openFullscreenImage(src) {
    const fullscreenDiv = document.createElement('div');
    fullscreenDiv.className = 'fullscreen-image';
    fullscreenDiv.innerHTML = `
        <img src="${src}" class="fullscreen-image-content">
        <button class="close-fullscreen">&times;</button>
    `;
    document.body.appendChild(fullscreenDiv);
    
    // Обработчик закрытия
    fullscreenDiv.querySelector('.close-fullscreen').addEventListener('click', () => {
        document.body.removeChild(fullscreenDiv);
    });
    
    // Закрытие по клику вне изображения
    fullscreenDiv.addEventListener('click', (e) => {
        if (e.target === fullscreenDiv) {
            document.body.removeChild(fullscreenDiv);
        }
    });
}
// Функция для открытия изображения на весь экран
function openFullscreenImage(src) {
    const fullscreenDiv = document.createElement('div');
    fullscreenDiv.className = 'fullscreen-image';
    fullscreenDiv.innerHTML = `
        <img src="${src}" class="fullscreen-image-content">
        <button class="close-fullscreen">&times;</button>
    `;
    document.body.appendChild(fullscreenDiv);
    
    // Обработчик закрытия
    fullscreenDiv.querySelector('.close-fullscreen').addEventListener('click', () => {
        document.body.removeChild(fullscreenDiv);
    });
    
    // Закрытие по клику вне изображения
    fullscreenDiv.addEventListener('click', (e) => {
        if (e.target === fullscreenDiv) {
            document.body.removeChild(fullscreenDiv);
        }
    });
}
function initVideoPlayers() {
    // Обработчик для кнопки звука
    const soundToggle = document.querySelector('.sound-toggle');
    if (soundToggle) {
        soundToggle.addEventListener('click', function() {
            isSoundEnabled = !isSoundEnabled;
            
            // Обновляем состояние всех видео на странице
            document.querySelectorAll('video').forEach(video => {
                video.muted = !isSoundEnabled;
            });
            
            // Обновляем кнопку
            this.classList.toggle('sound-on', isSoundEnabled);
            this.classList.toggle('sound-off', !isSoundEnabled);
            this.innerHTML = `<i class="fas fa-volume-${isSoundEnabled ? 'up' : 'mute'}"></i>`;
            
            // Сохраняем состояние в localStorage
            localStorage.setItem('videoSoundEnabled', isSoundEnabled);
        });
    }

    // Инициализация состояния звука для всех видео
    document.querySelectorAll('video').forEach(video => {
        video.muted = !isSoundEnabled;
        
        // Остальные обработчики видео...
        const wrapper = video.closest('.video-wrapper');
        if (wrapper) {
            video.addEventListener('play', () => {
                wrapper.classList.add('playing');
            });
            
            video.addEventListener('pause', () => {
                wrapper.classList.remove('playing');
            });
            
            video.addEventListener('click', function(e) {
                if (video.paused) {
                    video.play().catch(e => console.log('Play error:', e));
                } else {
                    video.pause();
                }
            });
        }
    });
}

function initSlider() {
    const slider = document.querySelector('.screenshots-slider');
    const slidesContainer = slider.querySelector('.slides-container');
    const slides = slider.querySelectorAll('.slide');
    const dotsContainer = slider.querySelector('.slider-dots');
    const prevBtn = slider.querySelector('.prev');
    const nextBtn = slider.querySelector('.next');
    
    let currentSlide = 0;
    const slideCount = slides.length;
    
    // Создаем точки навигации
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });
    
    // Функция переключения слайда
    function goToSlide(index) {
        if (index < 0) index = slideCount - 1;
        if (index >= slideCount) index = 0;
        
        slidesContainer.style.transform = `translateX(-${index * 100}%)`;
        currentSlide = index;
        
        // Обновляем активную точку
        slider.querySelectorAll('.dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
        });
    }
    
    // Навигационные кнопки
    prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
    nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));
    
    // Автопрокрутка (опционально)
    let slideInterval = setInterval(() => goToSlide(currentSlide + 1), 5000);
    
    // Остановка автопрокрутки при наведении
    slider.addEventListener('mouseenter', () => clearInterval(slideInterval));
    slider.addEventListener('mouseleave', () => {
        slideInterval = setInterval(() => goToSlide(currentSlide + 1), 5000);
    });
}
function initReadMoreButton(descId) {
    const descContainer = document.getElementById(descId);
    const btn = document.querySelector(`[data-target="${descId}"]`);
    
    // Устанавливаем начальные стили
    descContainer.style.maxHeight = '70px';
    descContainer.style.overflow = 'hidden';
    descContainer.style.transition = 'max-height 0.3s ease';
    descContainer.style.cursor = 'pointer';
    
    // Если контент не превышает максимальную высоту, скрываем кнопку
    if (descContainer.scrollHeight <= descContainer.clientHeight) {
        btn.style.display = 'none';
        descContainer.style.cursor = 'auto';
        return;
    }
    
    // Функция для переключения состояния
    function toggleDescription() {
        if (descContainer.style.maxHeight === '70px') {
            descContainer.style.maxHeight = descContainer.scrollHeight + 'px';
            btn.textContent = 'Скрыть';
            descContainer.classList.add('expanded'); // Добавляем класс при раскрытии
        } else {
            descContainer.style.maxHeight = '70px';
            btn.textContent = 'Ещё';
            descContainer.classList.remove('expanded'); // Удаляем класс при скрытии
        }
    }
    
    // Обработчики событий
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleDescription();
    });
    
    descContainer.addEventListener('click', toggleDescription);
}
function initGameMetaReadMore() {
    document.querySelectorAll('.game-meta').forEach(meta => {
        // Сохраняем оригинальную высоту
        meta.dataset.originalHeight = meta.scrollHeight;
        
        // Если контент не превышает 70px - ничего не делаем
        if (meta.scrollHeight <= 70) {
            meta.style.removeProperty('overflow');
            return;
        }

        // Добавляем класс и стили
        meta.classList.add('collapsible-meta');
        meta.style.maxHeight = '70px';
        meta.style.overflow = 'hidden';
        meta.style.transition = 'max-height 0.3s ease';
        meta.style.position = 'relative';
        meta.style.cursor = 'pointer';

        // Создаем кнопку
        const btn = document.createElement('button');
        btn.className = 'read-more-btn';
        btn.innerHTML = `
            Ещё
            
        `;

        // Вставляем кнопку после блока
        meta.insertAdjacentElement('afterend', btn);

        // Обработчик клика
        const toggle = () => {
            if (meta.style.maxHeight === '70px') {
                meta.style.maxHeight = `${meta.dataset.originalHeight}px`;
                btn.innerHTML = `
                    Скрыть
                   
                `;
                meta.classList.add('expanded');
            } else {
                meta.style.maxHeight = '70px';
                btn.innerHTML = `
                    Ещё
                 
                `;
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

function setupPriceOptionHandlers(product, availablePrices) {
    document.querySelectorAll('.price-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.price-option').forEach(el => el.classList.remove('selected'));
            this.classList.add('selected');
            
            const price = this.dataset.price;
            const btn = document.querySelector('.buy-button');
            btn.textContent = `Купить за ${price}₽`;
            btn.onclick = () => addToCart(
                product.product_id, 
                product.title || 'Без названия', 
                parseInt(price),
                this.dataset.type
            );
        });
    });
}