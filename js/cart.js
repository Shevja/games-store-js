// Обновленная функция добавления в корзину с проверкой дубликатов
function addToCart(id, title, price) {
    // Проверяем, есть ли уже такой товар в корзине
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        // Если товар уже есть в корзине, показываем сообщение
        showNotification('Этот товар уже в корзине');
        return; // Прекращаем выполнение функции
    }

    // Если товара нет в корзине, добавляем его
    cart.push({ id, title, price });
    updateCartUI();

    // Анимация иконки корзины
    const cartIcon = document.getElementById('cartIcon');
    cartIcon.classList.add('shake');

    // Удаляем класс анимации после завершения
    setTimeout(() => {
        cartIcon.classList.remove('shake');
    }, 500);

    // Показываем уведомление о добавлении
    showNotification('Товар добавлен в корзину');
}

// Функция для показа уведомлений
function showNotification(message) {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    // Добавляем в DOM
    document.body.appendChild(notification);

    // Показываем с анимацией
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Удаляем через 3 секунды
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Остальные функции остаются без изменений
function updateCartUI() {
    elements.cartItems.innerHTML = cart.map((item, index) => `
        <li>
            ${item.title} - ${item.price}₽
            <span class="remove-item" onclick="removeFromCart(${index})"><i class="fas fa-times"></i></span>
        </li>
    `).join("");

    // Обновляем счетчики
    const cartCount = cart.length;
    elements.cartCount.textContent = cartCount;
    document.querySelector('.cart-badge').textContent = cartCount;
    elements.cartTotal.textContent = cart.reduce((sum, item) => sum + item.price, 0);

    // Показываем или скрываем иконку корзины в зависимости от количества товаров
    const cartIcon = document.getElementById('cartIcon');
    if (cartCount > 0) {
        cartIcon.style.display = 'flex';
    } else {
        cartIcon.style.display = 'none';
        document.getElementById('cart').classList.remove('active'); // Закрываем корзину, если она была открыта
    }
}

function toggleCart() {
    const cart = document.getElementById('cart');
    cart.classList.toggle('active');
}

function initCart() {
    const cartIcon = document.getElementById('cartIcon');
    const cart = document.getElementById('cart');

    // Скрываем иконку при загрузке, если корзина пуста
    if (cart.length === 0) {
        cartIcon.style.display = 'none';
    }

    cartIcon.addEventListener('click', toggleCart);

    document.addEventListener('click', (e) => {
        if (!cart.contains(e.target) && e.target !== cartIcon && !cartIcon.contains(e.target)) {
            cart.classList.remove('active');
        }
    });
}

function removeFromCart(index) {
    if (index >= 0 && index < cart.length) {
        cart.splice(index, 1);
        updateCartUI();
    }
}

function clearCart() {
    cart = [];
    updateCartUI();
}

function checkout() {
    if (cart.length === 0) {
        alert("Корзина пуста");
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    alert(`Заказ на ${cart.length} товаров на сумму ${total}₽ отправлен!`);
    cart = [];
    updateCartUI();
    document.getElementById('cart').classList.remove('active');
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', initCart);

// Глобальные функции
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;