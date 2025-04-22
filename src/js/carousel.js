const networksList = document.querySelector('.networks-list');
const networkItems = document.querySelectorAll('.network-item[data-clone="original"]');
let isDragging = false;
let startX;
let translateX = 0;
let startTranslateX = 0;
let totalWidth = 0;

// Клонируем элементы несколько раз для более плавной бесконечной прокрутки
const cloneItems = () => {
    const clonesBefore = [];
    const clonesAfter = [];
    // Создаем 3 набора клонов до и после оригинальных элементов
    for (let i = 0; i < 3; i++) {
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

// Начальная позиция: смещаем карусель на середину клонов
translateX = -totalWidth * 3; // Учитываем 3 набора клонов перед оригинальными элементами
networksList.style.transform = `translateX(${translateX}px)`;

// Обработчики событий для перетаскивания
networksList.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.pageX;
    startTranslateX = translateX;
    networksList.style.cursor = 'grabbing';
});

networksList.addEventListener('mouseleave', () => {
    isDragging = false;
    networksList.style.cursor = 'grab';
});

networksList.addEventListener('mouseup', () => {
    isDragging = false;
    networksList.style.cursor = 'grab';
});

networksList.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX;
    const walk = (x - startX) * 1.5; // Ускоряем прокрутку
    translateX = startTranslateX + walk;

    // Проверка границ для бесконечной прокрутки
    if (translateX > -totalWidth * 2) {
        translateX -= totalWidth * 3; // Перематываем на 3 набора назад
        startTranslateX -= totalWidth * 3;
    } else if (translateX < -totalWidth * 4) {
        translateX += totalWidth * 3; // Перематываем на 3 набора вперед
        startTranslateX += totalWidth * 3;
    }

    networksList.style.transform = `translateX(${translateX}px)`;
});

// Поддержка сенсорных устройств
networksList.addEventListener('touchstart', (e) => {
    isDragging = true;
    startX = e.touches[0].pageX;
    startTranslateX = translateX;
});

networksList.addEventListener('touchend', () => {
    isDragging = false;
});

networksList.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX;
    const walk = (x - startX) * 1.5;
    translateX = startTranslateX + walk;

    // Проверка границ для бесконечной прокрутки
    if (translateX > -totalWidth * 2) {
        translateX -= totalWidth * 3;
        startTranslateX -= totalWidth * 3;
    } else if (translateX < -totalWidth * 4) {
        translateX += totalWidth * 3;
        startTranslateX += totalWidth * 3;
    }

    networksList.style.transform = `translateX(${translateX}px)`;
});