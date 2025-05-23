document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Получаем элемент для сообщений
    const messageDiv = document.getElementById('success-message');
    
    // Очищаем предыдущее сообщение и классы
    messageDiv.textContent = '';
    messageDiv.classList.remove('success-message', 'error-message');
    
    // Получение токена reCAPTCHA
    const recaptchaToken = grecaptcha.getResponse();
    if (!recaptchaToken) {
        messageDiv.textContent = 'Пожалуйста, подтвердите, что вы не робот.';
        messageDiv.classList.add('error-message');
        messageDiv.style.display = 'block';
        return;
    }

    const formData = new FormData(e.target);
    formData.append('g-recaptcha-response', recaptchaToken);
    const response = await fetch('./backend/login.php', {
        method: 'POST',
        body: formData
    });
    const result = await response.json();
    
    if (result.message) {
        // Успешное сообщение
        messageDiv.textContent = result.message;
        messageDiv.classList.add('success-message');
        messageDiv.style.display = 'block';
        
        // Перенаправление в зависимости от роли
        if (result.role === 1) {
            window.location.href = '/admin.html';
        } else {
            window.location.href = '/app.php';
        }
    } else {
        // Сообщение об ошибке
        messageDiv.textContent = result.error || 'Произошла ошибка при входе';
        messageDiv.classList.add('error-message');
        messageDiv.style.display = 'block';
    }
});

// Проверяем параметр verified в URL
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'true') {
        const successMessage = document.getElementById('success-message');
        successMessage.textContent = 'Электронная почта успешно подтверждена!';
        successMessage.classList.add('success-message');
        successMessage.classList.remove('error-message');
        successMessage.style.display = 'block';
    }
});