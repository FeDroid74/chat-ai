document.addEventListener('DOMContentLoaded', () => {
    const networksList = document.querySelector('.networks-list');
    const speed = 2;
    const gap = 20;
    let translateX = 0;
    let lastTime = performance.now();

    const originalItems = [...networksList.children];
    originalItems.forEach(item => {
        const clone = item.cloneNode(true);
        networksList.appendChild(clone);
    });

    const animate = (currentTime) => {
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        translateX -= speed * deltaTime * 60;

        let firstItem = networksList.children[0];
        let firstItemWidth = firstItem.offsetWidth + gap;

        if (Math.abs(translateX) >= firstItemWidth - 2) {
            const clone = firstItem.cloneNode(true);
            networksList.appendChild(clone);
            networksList.removeChild(firstItem);
            translateX += firstItemWidth;
        }

        networksList.style.transform = `translateX(${translateX}px)`;
        requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
});