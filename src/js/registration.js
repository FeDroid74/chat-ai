// src/js/registration.js

document.getElementById('registerForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    // Очищаем предыдущие ошибки
    document.querySelectorAll('.error').forEach(error => error.textContent = '');

    // Получаем значения полей
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirm_password').value.trim();

    let hasError = false;

    // Проверка имени пользователя (только буквы, цифры, подчеркивания, длина 3-20)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
        document.getElementById('username-error').textContent = 'Имя пользователя должно содержать только буквы, цифры и подчеркивания, длина от 3 до 20 символов';
        hasError = true;
    }

    // Проверка email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        document.getElementById('email-error').textContent = 'Неверный формат email';
        hasError = true;
    }

    // Проверка пароля (минимум 8 символов)
    if (password.length < 8) {
        document.getElementById('password-error').textContent = 'Пароль должен содержать минимум 8 символов';
        hasError = true;
    }

    // Проверка совпадения паролей
    if (password !== confirmPassword) {
        document.getElementById('confirm-password-error').textContent = 'Пароли не совпадают';
        hasError = true;
    }

    // Если есть ошибки, прекращаем выполнение
    if (hasError) {
        return;
    }

    // Формируем данные для отправки
    const formData = new FormData();
    formData.append('username', username);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('confirm_password', confirmPassword);

    try {
        const response = await fetch('backend/registration.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.message) {
            alert(result.message);
            window.location.href = 'login.html'; // Перенаправляем на страницу входа после успешной регистрации
        } else {
            alert(result.error || 'Произошла ошибка при регистрации');
        }
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
});