import { toggleMenu, selectedModel } from './ui.js';

let currentChatId = null; // Переменная для хранения текущего чата

async function loadUserInfo() {
    const response = await fetch('/api/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_user_info' })
    });
    const text = await response.text();
    console.log('Raw response from loadUserInfo:', text);
    try {
        const data = JSON.parse(text);
        const userInfoDiv = document.getElementById('user-info');
        if (data.username) {
            userInfoDiv.innerHTML = `
                <span class="banner-title">Привет, ${escapeHtml(data.username)}!</span>
                ${data.role === 1 ? '<a href="/admin.html" class="admin">Ⓐ</a>' : ''}
                <button onclick="logout()" class="logout-btn">Выйти</button>
            `;
        } else {
            userInfoDiv.textContent = 'Не авторизован';
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Ошибка парсинга JSON в loadUserInfo:', error, 'Raw response:', text);
        throw error;
    }
}
async function loadChats() {
    const response = await fetch('/api/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_chats' })
    });
    const text = await response.text();
    console.log('Raw response from loadChats:', text);
    try {
        const data = JSON.parse(text);
        const chatList = document.getElementById('chat-list');
        chatList.innerHTML = '';
        if (data.chats) {
            data.chats.forEach(chat => {
                const div = document.createElement('div');
                div.className = 'chat-item';

                // Создаём контейнер для названия и кнопок
                const chatContent = document.createElement('div');
                chatContent.className = 'chat-content';
                chatContent.textContent = chat.title;
                chatContent.onclick = () => {
                    loadHistory(chat.id);
                    toggleMenu();
                };

                // Кнопка редактирования
                const editBtn = document.createElement('button');
                editBtn.className = 'edit-chat-btn';
                editBtn.textContent = '✎';
                editBtn.onclick = (e) => {
                    e.stopPropagation(); // Предотвращаем вызов loadHistory
                    renameChat(chat.id, chat.title);
                };

                // Кнопка удаления
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-chat-btn';
                deleteBtn.textContent = '✖';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation(); // Предотвращаем вызов loadHistory
                    if (confirm('Вы уверены, что хотите удалить этот чат?')) {
                        deleteChat(chat.id);
                    }
                };

                div.appendChild(chatContent);
                div.appendChild(editBtn);
                div.appendChild(deleteBtn);
                chatList.appendChild(div);
            });
        }
    } catch (error) {
        console.error('Ошибка парсинга JSON в loadChats:', error, 'Raw response:', text);
        throw error;
    }
}

async function loadHistory(chatId) {
    currentChatId = chatId;
    const response = await fetch('/api/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_history', chat_id: chatId })
    });
    const text = await response.text();
    console.log('Raw response from loadHistory:', text);
    try {
        const data = JSON.parse(text);
        const messagesDiv = document.getElementById('messages');
        messagesDiv.innerHTML = '';
        if (data.messages) {
            data.messages.forEach(msg => {
                const className = msg.user_id === 0 ? 'ai-message' : 'user-message';
                const sender = msg.user_id === 0 ? `ИИ${msg.model ? ` (${msg.model})` : ''}` : 'Вы';
                const safeSender = escapeHtml(sender);
                const safeMessage = escapeHtml(msg.message);
                messagesDiv.innerHTML += `<p class="${className}"><b>${safeSender}:</b> ${safeMessage}</p>`;
            });
        }
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    } catch (error) {
        console.error('Ошибка парсинга JSON в loadHistory:', error, 'Raw response:', text);
        throw error;
    }
}

async function createChat() {
    const title = prompt('Введите название чата:') || 'Новый чат ' + new Date().toLocaleString();
    const response = await fetch('/api/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_chat', title: title })
    });
    const text = await response.text();
    console.log('Raw response from createChat:', text);
    try {
        const data = JSON.parse(text);
        if (data.chat_id) {
            loadChats();
            loadHistory(data.chat_id);
            toggleMenu();
        }
    } catch (error) {
        console.error('Ошибка парсинга JSON в createChat:', error, 'Raw response:', text);
        throw error;
    }
}

async function sendMessage() {
    const input = document.getElementById('user-input').value;
    const messagesDiv = document.getElementById('messages');

    if (!input) return;

    // Показываем сообщение пользователя
    messagesDiv.innerHTML += `<p class="user-message"><b>Вы:</b> ${escapeHtml(input)}</p>`;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    // Добавляем индикатор загрузки
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-message';
    loadingDiv.innerHTML = `<b>ИИ (${selectedModel}):</b> Генерируется <span class="dots"></span>`;
    messagesDiv.appendChild(loadingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    try {
        const response = await fetch('/api/api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'send_message',
                message: input,
                chat_id: currentChatId,
                model: selectedModel
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ошибка: ${response.status}`);
        }

        const text = await response.text();
        console.log('Raw response from sendMessage:', text);
        const data = JSON.parse(text);

        // Удаляем индикатор загрузки
        messagesDiv.removeChild(loadingDiv);

        if (data.error) {
            messagesDiv.innerHTML += `<p><b>Ошибка:</b> ${data.error}</p>`;
        } else {
            // Добавляем ответ ИИ с эффектом печати
            const replyDiv = document.createElement('p');
            replyDiv.className = 'ai-message typing';
            replyDiv.innerHTML = `<b>ИИ (${escapeHtml(data.model)}):</b> ${escapeHtml(data.reply)}`;
            messagesDiv.appendChild(replyDiv);
            currentChatId = data.chat_id;
            loadChats();
        }
    } catch (error) {
        // Удаляем индикатор загрузки в случае ошибки
        messagesDiv.removeChild(loadingDiv);
        messagesDiv.innerHTML += `<p><b>Ошибка:</b> ${error.message}</p>`;
        console.error('Ошибка в sendMessage:', error);
    }
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    document.getElementById('user-input').value = '';
}

// Новая функция: переименование чата
async function renameChat(chatId, currentTitle) {
    const newTitle = prompt('Введите новое название чата:', currentTitle);
    if (!newTitle || newTitle === currentTitle) return;

    const response = await fetch('/api/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'rename_chat',
            chat_id: chatId,
            new_title: newTitle
        })
    });
    const text = await response.text();
    console.log('Raw response from renameChat:', text);
    try {
        const data = JSON.parse(text);
        if (data.success) {
            loadChats(); // Обновляем список чатов
        } else {
            alert(data.error || 'Ошибка при переименовании чата');
        }
    } catch (error) {
        console.error('Ошибка парсинга JSON в renameChat:', error, 'Raw response:', text);
        alert('Ошибка при переименовании чата');
    }
}

// Новая функция: удаление чата
async function deleteChat(chatId) {
    const response = await fetch('/api/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'delete_chat',
            chat_id: chatId
        })
    });
    const text = await response.text();
    console.log('Raw response from deleteChat:', text);
    try {
        const data = JSON.parse(text);
        if (data.success) {
            loadChats(); // Обновляем список чатов
            if (currentChatId === chatId) {
                currentChatId = null; // Сбрасываем текущий чат
                document.getElementById('messages').innerHTML = ''; // Очищаем сообщения
            }
        } else {
            alert(data.error || 'Ошибка при удалении чата');
        }
    } catch (error) {
        console.error('Ошибка парсинга JSON в deleteChat:', error, 'Raw response:', text);
        alert('Ошибка при удалении чата');
    }
}

export { currentChatId, loadUserInfo, loadChats, loadHistory, createChat, sendMessage, renameChat, deleteChat };