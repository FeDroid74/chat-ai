document.getElementById('registerForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    // Получаем элемент для сообщений
    const messageDiv = document.getElementById('success-message');
    
    // Очищаем предыдущее сообщение и классы
    messageDiv.textContent = '';
    messageDiv.classList.remove('success-message', 'error-message');
    
    // Очищаем предыдущие ошибки в полях (на случай, если они остались)
    document.querySelectorAll('.error').forEach(error => error.textContent = '');

    // Получаем значения полей
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirm_password').value.trim();

    // Проверка имени пользователя
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
        messageDiv.textContent = 'Имя пользователя должно содержать только буквы, цифры и подчеркивания, длина от 3 до 20 символов';
        messageDiv.classList.add('error-message');
        messageDiv.style.display = 'block';
        return;
    }

    // Проверка email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        messageDiv.textContent = 'Неверный формат email';
        messageDiv.classList.add('error-message');
        messageDiv.style.display = 'block';
        return;
    }

    // Проверка пароля
    if (password.length < 8) {
        messageDiv.textContent = 'Пароль должен содержать минимум 8 символов';
        messageDiv.classList.add('error-message');
        messageDiv.style.display = 'block';
        return;
    }

    // Проверка совпадения паролей
    if (password !== confirmPassword) {
        messageDiv.textContent = 'Пароли не совпадают';
        messageDiv.classList.add('error-message');
        messageDiv.style.display = 'block';
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
            messageDiv.textContent = result.message;
            messageDiv.classList.add('success-message');
            messageDiv.style.display = 'block';
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000); // Задержка перед перенаправлением
        } else {
            messageDiv.textContent = result.error || 'Произошла ошибка при регистрации';
            messageDiv.classList.add('error-message');
            messageDiv.style.display = 'block';
        }
    } catch (error) {
        messageDiv.textContent = 'Ошибка: ' + error.message;
        messageDiv.classList.add('error-message');
        messageDiv.style.display = 'block';
    }
});