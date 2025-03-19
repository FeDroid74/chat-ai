let selectedModel = 'mistral'; // По умолчанию Mistral

function resetModelSelection() {
    selectedModel = 'mistral';
    const modelSelect = document.getElementById('model-select');
    modelSelect.value = 'mistral'; // Сбрасываем <select> на Mistral
}

function updateModel() {
    const modelSelect = document.getElementById('model-select');
    selectedModel = modelSelect.value;
    console.log('Выбрана модель:', selectedModel);
}

function toggleMenu() {
    const sidebarMenu = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('overlay');
    sidebarMenu.classList.toggle('active');
    overlay.classList.toggle('active');
}

export { selectedModel, resetModelSelection, updateModel, toggleMenu };