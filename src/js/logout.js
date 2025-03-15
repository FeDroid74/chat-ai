document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.querySelector('.logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault(); // Предотвращаем стандартное поведение, если это кнопка в форме
            const response = await fetch('./backend/logout.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await response.json();
            alert(result.message || result.error);
            if (result.message) {
                window.location.href = '/login.html'; // Перенаправление на страницу логина
            }
        });
    }
});