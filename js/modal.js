function openModalWindow() {
    document.body.style.overflow = 'hidden';
    elements.modal.classList.remove("hidden");
    elements.modal.classList.add("active");
}

function closeModalWindow() {
    document.body.style.overflow = 'auto';
    elements.modal.classList.add("hidden");
    elements.modal.classList.remove("active");

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
        // Проверяем кэш перед загрузкой
        if (!product.description || !product.prices) {
            const response = await fetch(`${API_BASE}/game_id/${product.product_id}`);
            product = await response.json();
        }

        const prices = product.prices || {};
        const keyPrice = (prices.key && prices.key.price !== undefined && prices.key.price !== null) ? prices.key.price : 876;
        const uAccPrice = (prices.u_acc && prices.u_acc.price !== undefined && prices.u_acc.price !== null) ? prices.u_acc.price : 650;
        const newAccPrice = (prices.new_acc && prices.new_acc.price !== undefined && prices.new_acc.price !== null) ? prices.new_acc.price : 549;

        renderModalContent(product, keyPrice, uAccPrice, newAccPrice);
    } catch (error) {
        console.error("Details error:", error);
        elements.modalBody.innerHTML = `<p>Ошибка загрузки данных: ${error.message}</p>`;
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
    if (product.developer) metaInfo.push(`<div><strong>Разработчик:</strong> ${product.developer}</div>`);
    if (product.publisher) metaInfo.push(`<div><strong>Издатель:</strong> ${product.publisher}</div>`);
    if (releaseDate) metaInfo.push(`<div><strong>Дата выхода:</strong> ${releaseDate}</div>`);
    if (product.categories && product.categories.length) {
        metaInfo.push(`<div><strong>Жанры:</strong> ${product.categories.join(', ')}</div>`);
    }
    if (product.capabilities) metaInfo.push(`<div><strong>Возможности:</strong> ${product.capabilities}</div>`);

    // Создаем блок с системными требованиями
    const systemInfo = [];
    if (product.compatibility) systemInfo.push(`<div><strong>Совместимость:</strong> ${product.compatibility}</div>`);

    // Слайдер для скриншотов
    let screenshotsSlider = '';
    if (product.screenshots && product.screenshots.length) {
        screenshotsSlider = `
        <div class="media-section">
            <h3>Скриншоты (${product.screenshots.length})</h3>
            <div class="screenshots-slider">
                <div class="slides-container">
                    ${product.screenshots.map(img => `
                        <div class="slide">
                            <img src="${img}" loading="lazy" alt="Скриншот игры" />
                        </div>
                    `).join('')}
                </div>
                <button class="slider-nav prev"><i class="fas fa-chevron-left"></i></button>
                <button class="slider-nav next"><i class="fas fa-chevron-right"></i></button>
                <div class="slider-dots"></div>
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
    
    // Описание с кнопкой "Подробнее"
    const descriptionId = `desc-${Date.now()}`;
    const descriptionContent = `
        <div class="description-section">
            <h3>Описание</h3>
            <div class="description-content" id="${descriptionId}">
                <p>${product.description || 'Описание отсутствует'}</p>
            </div>
            <button class="read-more-btn" data-target="${descriptionId}">Подробнее</button>
        </div>
    `;
    
    // Определяем мобильное устройство
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const firstVideo = product.videos && product.videos.length > 0 ? product.videos[0] : null;
    const isHLS = firstVideo && firstVideo.endsWith('.m3u8');
    
     let isSoundEnabled = localStorage.getItem('videoSoundEnabled') === 'true';
    
    // Создаем медиа-контент (обложка или видео для мобильных)
    let mediaContent = '';
    if (isMobile && firstVideo) {
        mediaContent = `
            <div class="mobile-video-container">
                <video autoplay loop ${isSoundEnabled ? '' : 'muted'} playsinline
                    poster="${product.image || 'img/placeholder.jpg'}"
                    class="game-cover">
                    ${!isHLS ? `<source src="${firstVideo}" type="video/mp4">` : ''}
                    Ваш браузер не поддерживает видео.
                </video>
                <button class="sound-toggle ${isSoundEnabled ? 'sound-on' : 'sound-off'}">
                    <i class="fas fa-volume-${isSoundEnabled ? 'up' : 'mute'}"></i>
                </button>
                ${isHLS ? `
                <script>
                    (function() {
                        const video = document.querySelector('.mobile-video-container video');
                        if(Hls.isSupported()) {
                            const hls = new Hls();
                            hls.loadSource('${firstVideo}');
                            hls.attachMedia(video);
                        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                            video.src = '${firstVideo}';
                        }
                        video.play().catch(e => console.log('Autoplay error:', e));
                    })();
                </script>
                ` : ''}
            </div>
        `;
    } else {
        mediaContent = `
            <img src="${product.image || 'img/placeholder.jpg'}" 
                 loading="lazy" 
                 alt="Обложка игры" 
                 class="game-cover" />
        `;
    }
    
    // Формируем HTML
    elements.modalBody.innerHTML = `
        <div class="modal-header">
            <div class="game-cover-container">
                ${mediaContent}
                ${product.sale_product ? `<div class="discount-badge">-${product.sale_product}%</div>` : ''}
            </div>
            <div class="game-header-info">
                <h2>${product.title || 'Без названия'}</h2>
                <div class="game-meta">${metaInfo.join('')}</div>
                <div class="game-actions">
                    <div class="price-display">
                        <span class="final-price">${keyPrice}₽</span>
                        ${product.sale_product ? `<span class="original-price">${Math.round(keyPrice * 100 / (100 - product.sale_product))}₽</span>` : ''}
                    </div>
                    <div class="sale-info">Акция действует до: ${endSaleDate}</div>
                </div>
            </div>
        </div>
        
        <div class="modal-content-grid">
            <div class="main-content">
                ${descriptionContent}
                ${screenshotsSlider}
                ${videosContent}
            </div>
            
            <div class="sidebar">
                <div class="info-block">
                    <h3>Системные требования</h3>
                    ${systemInfo.join('')}
                </div>
                
                <div class="purchase-options">
                    <h3>Варианты покупки</h3>
                    <div class="price-option selected" data-price="${keyPrice}">
                        <input type="radio" name="priceOption" id="option1" checked>
                        <label for="option1">
                            <span class="option-title">Ключ активации</span>
                            <span class="option-price">${keyPrice}₽</span>
                            <span class="option-desc">Мгновенная доставка на email</span>
                        </label>
                    </div>
                    <div class="price-option" data-price="${uAccPrice}">
                        <input type="radio" name="priceOption" id="option2">
                        <label for="option2">
                            <span class="option-title">На ваш аккаунт</span>
                            <span class="option-price">${uAccPrice}₽</span>
                            <span class="option-desc">Привязка к вашему аккаунту Xbox</span>
                        </label>
                    </div>
                    <div class="price-option" data-price="${newAccPrice}">
                        <input type="radio" name="priceOption" id="option3">
                        <label for="option3">
                            <span class="option-title">На новый аккаунт</span>
                            <span class="option-price">${newAccPrice}₽</span>
                            <span class="option-desc">Полный доступ к новому аккаунту</span>
                        </label>
                    </div>
                    
                    <button class="buy-button" id="modalBuyButton">
                        <i class="fas fa-shopping-cart"></i> Купить за ${keyPrice}₽
                    </button>
                    
                    <div class="secure-info">
                        <i class="fas fa-shield-alt"></i> Безопасная оплата и гарантия возврата
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Инициализация слайдера
    if (product.screenshots && product.screenshots.length > 1) {
        initSlider();
    }
    
    // Инициализация кнопки "Подробнее"
    if (product.description) {
        initReadMoreButton(descriptionId);
    }
    
    // Инициализация видео
    initVideoPlayers();
    
    // Обработчик для кнопки покупки
    document.getElementById('modalBuyButton').addEventListener('click', function(e) {
        e.preventDefault();
        addToCart(product.product_id, product.title || 'Без названия', keyPrice);
    });
    
    // Обработчики вариантов покупки
    setupPriceOptionHandlers(product, keyPrice, uAccPrice, newAccPrice);
}
function initVideoPlayers() {
    // Обработчик для кнопки звука
    document.querySelector('.sound-toggle')?.addEventListener('click', function() {
        const videos = document.querySelectorAll('.mobile-video-container video');
        const isCurrentlyMuted = videos[0]?.muted;
        
        // Переключаем состояние звука для всех видео
        videos.forEach(video => {
            video.muted = !isCurrentlyMuted;
        });
        
        // Обновляем кнопку
        this.classList.toggle('sound-on', !isCurrentlyMuted);
        this.classList.toggle('sound-off', isCurrentlyMuted);
        this.innerHTML = `<i class="fas fa-volume-${!isCurrentlyMuted ? 'up' : 'mute'}"></i>`;
        
        // Сохраняем настройку
        localStorage.setItem('videoSoundEnabled', !isCurrentlyMuted);
    });

    // Остальные обработчики видео
    document.querySelectorAll('.video-wrapper video').forEach(video => {
        const wrapper = video.closest('.video-wrapper');
        
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
    
    // Проверяем, нужно ли показывать кнопку
    descContainer.style.maxHeight = '140px';
    descContainer.style.overflow = 'hidden';
    descContainer.style.transition = 'max-height 0.3s ease';
    
    // Если контент не превышает максимальную высоту, скрываем кнопку
    if (descContainer.scrollHeight <= descContainer.clientHeight) {
        btn.style.display = 'none';
        return;
    }
    
    btn.addEventListener('click', function() {
        if (descContainer.style.maxHeight === '140px') {
            descContainer.style.maxHeight = descContainer.scrollHeight + 'px';
            btn.textContent = 'Свернуть';
        } else {
            descContainer.style.maxHeight = '140px';
            btn.textContent = 'Подробнее';
        }
    });
}

function setupPriceOptionHandlers(product, keyPrice, uAccPrice, newAccPrice) {
    document.querySelectorAll('.price-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.price-option').forEach(el => el.classList.remove('selected'));
            this.classList.add('selected');

            const price = this.dataset.price;
            const btn = document.querySelector('.buy-button');
            btn.textContent = `Купить за ${price}₽`;
            btn.onclick = () => addToCart(product.product_id, product.title || 'Без названия', parseInt(price));
        });
    });
}