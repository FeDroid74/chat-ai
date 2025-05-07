// Утилиты
async function postRequest(action, payload = {}) {
    const response = await fetch('/backend/admin.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
    });
    const text = await response.text();
    console.log(`Raw response from ${action}:`, text);
    try {
        return JSON.parse(text);
    } catch (error) {
        console.error(`Ошибка парсинга JSON в ${action}:`, error, 'Raw response:', text);
        throw error;
    }
}

function renderTable(dataList, selector, rowBuilder) {
    const tbody = document.querySelector(selector);
    tbody.innerHTML = '';
    dataList.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = rowBuilder(item);
        tbody.appendChild(tr);
    });
}

async function deleteEntity(action, id, reloadFn) {
    if (confirm('Вы уверены?')) {
        const data = await postRequest(action, { id });
        if (data.success) reloadFn();
        else alert(data.error || 'Ошибка при удалении');
    }
}

// Доступ
async function checkAdminAccess() {
    const data = await postRequest('get_users');
    if (data.error?.includes('Доступ запрещён')) window.location.href = '/app.php';
}

// Пользователи
async function loadUsers() {
    const data = await postRequest('get_users');
    if (data.error) return alert(data.error), window.location.href = '/login.html';
    renderTable(data.users, '#users-table tbody', user => `
        <td>${user.id}</td>
        <td>${user.username}</td>
        <td>${user.email}</td>
        <td>${user.role === 1 ? 'Админ' : 'Пользователь'}</td>
        <td>${user.created_at}</td>
        <td>
            <button onclick="openEditUserForm(${user.id}, '${user.username}', '${user.email}', ${user.role})">Редактировать</button>
            <button onclick="deleteUser(${user.id})">Удалить</button>
        </td>
    `);
}

async function createUser() {
    const username = userInput('username');
    const email = userInput('email');
    const password = userInput('password');
    const role = userInput('role');
    const data = await postRequest('create_user', { username, email, password, role });
    data.success ? (closeModal(), loadUsers()) : alert(data.error || 'Ошибка при создании');
}

async function updateUser() {
    const id = userInput('id');
    const username = userInput('username');
    const email = userInput('email');
    const role = userInput('role');
    const data = await postRequest('update_user', { id, username, email, role });
    data.success ? (closeModal(), loadUsers()) : alert(data.error || 'Ошибка при обновлении');
}

function deleteUser(id) {
    deleteEntity('delete_user', id, loadUsers);
}

function openCreateUserForm() {
    openModal('Добавить пользователя', `
        <label>Имя: <input type="text" id="user-username"></label><br>
        <label>Email: <input type="email" id="user-email"></label><br>
        <label>Пароль: <input type="password" id="user-password"></label><br>
        <label>Роль: <select id="user-role">
            <option value="0">Пользователь</option><option value="1">Админ</option></select></label><br>
        <button onclick="createUser()">Сохранить</button>
    `);
}

function openEditUserForm(id, username, email, role) {
    openModal('Редактировать пользователя', `
        <input type="hidden" id="user-id" value="${id}">
        <label>Имя: <input type="text" id="user-username" value="${username}"></label><br>
        <label>Email: <input type="email" id="user-email" value="${email}"></label><br>
        <label>Роль: <select id="user-role">
            <option value="0" ${role === 0 ? 'selected' : ''}>Пользователь</option>
            <option value="1" ${role === 1 ? 'selected' : ''}>Админ</option></select></label><br>
        <button onclick="updateUser()">Сохранить</button>
    `);
}

// Чаты
async function loadChats() {
    const data = await postRequest('get_chats');
    renderTable(data.chats, '#chats-table tbody', chat => `
        <td>${chat.id}</td>
        <td>${chat.user_id}</td>
        <td>${chat.title}</td>
        <td>${chat.created_at}</td>
        <td>
            <button onclick="openEditChatForm(${chat.id}, ${chat.user_id}, '${chat.title}')">Редактировать</button>
            <button onclick="deleteChat(${chat.id})">Удалить</button>
        </td>
    `);
}

async function createChat() {
    const user_id = chatInput('user_id');
    const title = chatInput('title');
    const data = await postRequest('create_chat', { user_id, title });
    data.success ? (closeModal(), loadChats()) : alert(data.error || 'Ошибка при создании');
}

async function updateChat() {
    const id = chatInput('id');
    const user_id = chatInput('user_id');
    const title = chatInput('title');
    const data = await postRequest('update_chat', { id, user_id, title });
    data.success ? (closeModal(), loadChats()) : alert(data.error || 'Ошибка при обновлении');
}

function deleteChat(id) {
    deleteEntity('delete_chat', id, loadChats);
}

function openCreateChatForm() {
    openModal('Добавить чат', `
        <label>ID пользователя: <input type="number" id="chat-user_id"></label><br>
        <label>Название: <input type="text" id="chat-title"></label><br>
        <button onclick="createChat()">Сохранить</button>
    `);
}

function openEditChatForm(id, user_id, title) {
    openModal('Редактировать чат', `
        <input type="hidden" id="chat-id" value="${id}">
        <label>ID пользователя: <input type="number" id="chat-user_id" value="${user_id}"></label><br>
        <label>Название: <input type="text" id="chat-title" value="${title}"></label><br>
        <button onclick="updateChat()">Сохранить</button>
    `);
}

// Сообщения
async function loadMessages() {
    const data = await postRequest('get_messages');
    renderTable(data.messages, '#messages-table tbody', m => `
        <td>${m.id}</td>
        <td>${m.chat_id}</td>
        <td>${m.user_id}</td>
        <td>${m.message}</td>
        <td>${m.model || 'Нет'}</td>
        <td>${m.created_at}</td>
        <td>
            <button onclick="openEditMessageForm(${m.id}, ${m.chat_id}, ${m.user_id}, '${m.message}', '${m.model || ''}')">Редактировать</button>
            <button onclick="deleteMessage(${m.id})">Удалить</button>
        </td>
    `);
}

async function createMessage() {
    const chat_id = msgInput('chat_id');
    const user_id = msgInput('user_id');
    const message = msgInput('text');
    const model = msgInput('model') || null;
    const data = await postRequest('create_message', { chat_id, user_id, message, model });
    data.success ? (closeModal(), loadMessages()) : alert(data.error || 'Ошибка при создании');
}

async function updateMessage() {
    const id = msgInput('id');
    const chat_id = msgInput('chat_id');
    const user_id = msgInput('user_id');
    const message = msgInput('text');
    const model = msgInput('model') || null;
    const data = await postRequest('update_message', { id, chat_id, user_id, message, model });
    data.success ? (closeModal(), loadMessages()) : alert(data.error || 'Ошибка при обновлении');
}

function deleteMessage(id) {
    deleteEntity('delete_message', id, loadMessages);
}


// Модальные окна
function openCreateMessageForm() {
    openModal('Добавить сообщение', `
        <label>ID чата: <input type="number" id="message-chat_id"></label><br>
        <label>ID пользователя: <input type="number" id="message-user_id"></label><br>
        <label>Сообщение: <textarea id="message-text"></textarea></label><br>
        <label>Модель: <input type="text" id="message-model"></label><br>
        <button onclick="createMessage()">Сохранить</button>
    `);
}

function openEditMessageForm(id, chat_id, user_id, message, model) {
    openModal('Редактировать сообщение', `
        <input type="hidden" id="message-id" value="${id}">
        <label>ID чата: <input type="number" id="message-chat_id" value="${chat_id}"></label><br>
        <label>ID пользователя: <input type="number" id="message-user_id" value="${user_id}"></label><br>
        <label>Сообщение: <textarea id="message-text">${message}</textarea></label><br>
        <label>Модель: <input type="text" id="message-model" value="${model}"></label><br>
        <button onclick="updateMessage()">Сохранить</button>
    `);
}


function openModal(title, content) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-form').innerHTML = content;
    document.getElementById('modal').style.display = 'block';
}
function closeModal() {
    document.getElementById('modal').style.display = 'none';
}


// Остальное
const userInput = key => document.getElementById(`user-${key}`).value;
const chatInput = key => document.getElementById(`chat-${key}`).value;
const msgInput = key => document.getElementById(`message-${key}`).value;

window.onload = async () => {
    await checkAdminAccess();

    const [usersData, chatsData, messagesData] = await Promise.all([
        postRequest('get_users'),
        postRequest('get_chats'),
        postRequest('get_messages'),
    ]);

    if (usersData.error || chatsData.error || messagesData.error) {
        alert('Ошибка при загрузке данных');
        window.location.href = '/login.html';
        return;
    }

    document.getElementById('stat-users').textContent = usersData.users.length;
    document.getElementById('stat-chats').textContent = chatsData.chats.length;
    document.getElementById('stat-messages').textContent = messagesData.messages.length;

    renderTable(usersData.users, '#users-table tbody', user => `
        <td>${user.username}</td>
        <td>${user.email}</td>
        <td>${user.role === 1 ? 'Админ' : 'Пользователь'}</td>
        <td>${user.created_at}</td>
        <td>
            <button onclick="openEditUserForm(${user.id}, '${user.username}', '${user.email}', ${user.role})">Редактировать</button>
            <button onclick="deleteUser(${user.id})">Удалить</button>
        </td>
    `);
    
    renderTable(chatsData.chats, '#chats-table tbody', chat => `
        <td>${chat.user_name}</td>
        <td>${chat.title}</td>
        <td>${chat.created_at}</td>
        <td>
            <button onclick="openEditChatForm(${chat.id}, '${chat.user_name}', '${chat.title}')">Редактировать</button>
            <button onclick="deleteChat(${chat.id})">Удалить</button>
        </td>
    `);

    renderTable(messagesData.messages, '#messages-table tbody', m => `
        <td>${m.chat_title}</td>
        <td>${m.user_name}</td>
        <td>${m.message}</td>
        <td>${m.model || 'Нет'}</td>
        <td>${m.created_at}</td>
        <td>
            <button onclick="openEditMessageForm(${m.id}, '${m.chat_title}', '${m.user_name}', '${m.message}', '${m.model || ''}')">Редактировать</button>
            <button onclick="deleteMessage(${m.id})">Удалить</button>
        </td>
    `);
};

function toggleMenu() {
    document.getElementById('sidebar-menu').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

function showSection(id) {
    ['users-section', 'chats-section', 'messages-section'].forEach(sec => {
        document.getElementById(sec).style.display = sec === id ? 'block' : 'none';
    });
    toggleMenu();
}

Object.assign(window, {
    openCreateUserForm, openEditUserForm, createUser, updateUser, deleteUser,
    openCreateChatForm, openEditChatForm, createChat, updateChat, deleteChat,
    openCreateMessageForm, openEditMessageForm, createMessage, updateMessage, deleteMessage,
    closeModal,
    toggleMenu,
    showSection
});