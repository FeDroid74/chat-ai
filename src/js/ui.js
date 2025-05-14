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

function openModal() {
    document.getElementById('tariff-modal')?.classList.add('active');
}

function closeModal() {
    document.getElementById('tariff-modal')?.classList.remove('active');
    history.pushState("", document.title, window.location.pathname + window.location.search);
}

function handleHashNavigation() {
    if (window.location.hash === "#subscribe") {
        openModal();
    } else {
        closeModal();
    }
}

if (window.location.hash === "#subscribe") {
    history.replaceState(null, null, window.location.pathname + window.location.search);
}

export {
    selectedModel,
    resetModelSelection,
    updateModel,
    toggleMenu,
    openModal,
    closeModal,
    handleHashNavigation
};