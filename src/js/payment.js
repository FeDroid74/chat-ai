document.querySelectorAll('.tariff-btn').forEach(btn => {
    const tariffId = btn.dataset.tariffId;
    if (!tariffId) return;

    btn.addEventListener('click', async () => {
        try {
            const response = await fetch('/backend/payment.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tariff_id: parseInt(tariffId) })
            });

            const data = await response.json();

            if (data.success && data.payment_url) {
                window.location.href = data.payment_url;
            } else {
                alert(data.message || 'Ошибка при создании платежа');
            }
        } catch (error) {
            console.error('Ошибка оплаты:', error);
            alert('Не удалось инициализировать оплату');
        }
    });
});