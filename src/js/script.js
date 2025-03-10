async function sendMessage() {
    const input = document.getElementById("user-input").value;
    const chatBox = document.getElementById("chat-box");

    if (!input) return;

    // Показать сообщение пользователя
    chatBox.innerHTML += `<p><b>Вы:</b> ${input}</p>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        // Запрос к api.php в папке src
        const response = await fetch('/api/api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: input })
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        // Показать ответ ИИ
        chatBox.innerHTML += `<p><b>ИИ:</b> ${data.reply}</p>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (error) {
        // Показать ошибку пользователю
        chatBox.innerHTML += `<p><b>Ошибка:</b> ${error.message}</p>`;
        chatBox.scrollTop = chatBox.scrollHeight;
        console.error('Ошибка:', error);
    }

    // Очистить поле ввода
    document.getElementById("user-input").value = '';
}