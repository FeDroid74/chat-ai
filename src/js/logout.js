async function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        const response = await fetch('./backend/logout.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            window.location.href = '/login.html';
        } else {
            alert('Ошибка при выходе из системы');
        }
    }
}

export { logout };