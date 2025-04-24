const faqItems = document.querySelectorAll('.faq-item');
const modelSelect = document.querySelector('#model-select');

faqItems.forEach(item => {
    item.addEventListener('click', () => {
        item.classList.toggle('active');
    });
});

modelSelect.addEventListener('click', (event) => {
    event.stopPropagation();
    modelSelect.classList.toggle('active');
});

modelSelect.addEventListener('change', () => {
    modelSelect.classList.remove('active');
});

document.addEventListener('click', (event) => {
    if (!modelSelect.contains(event.target)) {
        modelSelect.classList.remove('active');
    }
});