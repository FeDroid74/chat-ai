const networksList = document.querySelector('.networks-list');
const networkItems = document.querySelectorAll('.network-item[data-clone="original"]');
let translateX = 0;
let totalWidth = 0;
const speed = 2; // Возвращаем скорость к значению 0.5
let lastTime = performance.now();

// Клонируем элементы для бесконечной прокрутки
const cloneItems = () => {
    const clonesBefore = [];
    const clonesAfter = [];
    for (let i = 0; i < 2; i++) { // Уменьшаем до 2 наборов клонов, так как будем динамически перемещать элементы
        networkItems.forEach(item => {
            const cloneBefore = item.cloneNode(true);
            const cloneAfter = item.cloneNode(true);
            cloneBefore.setAttribute('data-clone', 'clone');
            cloneAfter.setAttribute('data-clone', 'clone');
            clonesBefore.push(cloneBefore);
            clonesAfter.push(cloneAfter);
        });
    }
    clonesBefore.forEach(clone => networksList.insertBefore(clone, networkItems[0]));
    clonesAfter.forEach(clone => networksList.appendChild(clone));
};

// Вычисляем ширину оригинальных элементов
const calculateTotalWidth = () => {
    totalWidth = 0;
    networkItems.forEach(item => {
        totalWidth += item.offsetWidth + 20; // Учитываем gap
    });
};

// Инициализация карусели
cloneItems();
calculateTotalWidth();

// Начальная позиция
translateX = 0;
networksList.style.transform = `translateX(${translateX}px)`;

// Функция для автоматической прокрутки с динамическим перемещением элементов
const animate = (currentTime) => {
    const deltaTime = (currentTime - lastTime) / 1000; // Время в секундах между кадрами
    lastTime = currentTime;

    // Двигаем карусель влево
    translateX -= speed * (deltaTime * 60); // Нормализуем скорость (60 кадров в секунду)

    // Проверяем, если первый элемент полностью ушел за левую границу
    const firstChild = networksList.firstChild;
    const firstChildWidth = firstChild.offsetWidth + 20; // Учитываем gap
    if (Math.abs(translateX) >= firstChildWidth) {
        // Перемещаем первый элемент в конец
        networksList.appendChild(firstChild);
        // Корректируем translateX, чтобы компенсировать перемещение
        translateX += firstChildWidth;
    }

    networksList.style.transform = `translateX(${translateX}px)`;
    requestAnimationFrame(animate);
};

// Запускаем анимацию после полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(animate);
});