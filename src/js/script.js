async function sendMessage() {
    const input = document.getElementById("user-input").value;
    const messagesDiv = document.getElementById("messages");

    if (!input) return;

    // Добавляем сообщение пользователя
    messagesDiv.innerHTML += `<p><b>Вы:</b> ${input}</p>`;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    try {
        const response = await fetch('/api/api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: input })
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        // Добавляем ответ ИИ с классом ai-message
        messagesDiv.innerHTML += `<p class="ai-message"><b>ИИ:</b> ${data.reply}</p>`;
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    } catch (error) {
        messagesDiv.innerHTML += `<p><b>Ошибка:</b> ${error.message}</p>`;
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        console.error('Ошибка:', error);
    }

    document.getElementById("user-input").value = '';
}