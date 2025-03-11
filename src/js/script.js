let currentChatId = null;

async function loadUserInfo() {
    const response = await fetch('/api/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_user_info' })
    });
    const data = await response.json();
    const userInfoDiv = document.getElementById('user-info');
    if (data.username) {
        userInfoDiv.textContent = `Привет, ${data.username}!`;
    } else {
        userInfoDiv.textContent = 'Не авторизован';
        window.location.href = '/login.html';
    }
}

async function loadChats() {
    const response = await fetch('/api/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_chats' })
    });
    const data = await response.json();
    const chatList = document.getElementById('chat-list');
    chatList.innerHTML = '';
    if (data.chats) {
        data.chats.forEach(chat => {
            const div = document.createElement('div');
            div.textContent = chat.title;
            div.className = 'chat-item';
            div.onclick = () => {
                loadHistory(chat.id);
                toggleMenu();
            };
            chatList.appendChild(div);
        });
    }
}

async function loadHistory(chatId) {
    currentChatId = chatId;
    const response = await fetch('/api/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_history', chat_id: chatId })
    });
    const data = await response.json();
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';
    if (data.messages) {
        data.messages.forEach(msg => {
            const className = msg.user_id === 0 ? 'ai-message' : 'user-message';
            messagesDiv.innerHTML += `<p class="${className}"><b>${msg.user_id === 0 ? 'ИИ' : 'Вы'}:</b> ${msg.message}</p>`;
        });
    }
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function createChat() {
    const title = prompt('Введите название чата:') || 'Новый чат ' + new Date().toLocaleString();
    const response = await fetch('/api/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_chat', title: title })
    });
    const data = await response.json();
    if (data.chat_id) {
        loadChats();
        loadHistory(data.chat_id);
        toggleMenu();
    }
}

async function sendMessage() {
    const input = document.getElementById('user-input').value;
    const messagesDiv = document.getElementById('messages');

    if (!input) return;

    messagesDiv.innerHTML += `<p class="user-message"><b>Вы:</b> ${input}</p>`;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    try {
        const response = await fetch('/api/api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'send_message', message: input, chat_id: currentChatId })
        });

        if (!response.ok) {
            throw new Error(`HTTP ошибка: ${response.status}`);
        }

        const text = await response.text();
        console.log('Raw response:', text); // Отладка в консоли
        const data = JSON.parse(text);

        if (data.error) {
            messagesDiv.innerHTML += `<p><b>Ошибка:</b> ${data.error}</p>`;
        } else {
            messagesDiv.innerHTML += `<p class="ai-message"><b>ИИ:</b> ${data.reply}</p>`;
            currentChatId = data.chat_id;
            loadChats();
        }
    } catch (error) {
        messagesDiv.innerHTML += `<p><b>Ошибка:</b> ${error.message}</p>`;
        console.error('Ошибка в sendMessage:', error);
    }
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    document.getElementById('user-input').value = '';
}

// Функция для открытия/закрытия меню
function toggleMenu() {
    const sidebarMenu = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('overlay');
    sidebarMenu.classList.toggle('active');
    overlay.classList.toggle('active');
}

window.onload = () => {
    loadUserInfo();
    loadChats();
    if (currentChatId) loadHistory(currentChatId);
};