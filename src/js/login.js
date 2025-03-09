document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const response = await fetch('./backend/login.php', {
        method: 'POST',
        body: formData
    });
    const result = await response.json();
    alert(result.message || result.error);
    if (result.message) window.location.href = '/index.html';
});