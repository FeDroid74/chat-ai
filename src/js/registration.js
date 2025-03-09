document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const response = await fetch('./backend/registration.php', {
        method: 'POST',
        body: formData
    });
    const result = await response.json();
    alert(result.message || result.error);
});