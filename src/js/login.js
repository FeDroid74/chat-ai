document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const response = await fetch('./backend/login.php', {
        method: 'POST',
        body: formData
    });
    const result = await response.json();
    alert(result.message || result.error);
    if (result.message) {
        window.location.href = '/index.php';
    }
});

// Проверяем параметр verified в URL
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'true') {
        const successMessage = document.getElementById('success-message');
        successMessage.textContent = 'Электронная почта успешно подтверждена!';
        successMessage.style.display = 'block';
    }
});