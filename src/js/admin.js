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

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\\/g, "&#092;")
        .replace(/\n/g, "<br>");
}

function escapeJsString(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
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
        <td>${user.role === 1 ? 'Администратор' : 'Пользователь'}</td>
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
            <option value="0">Пользователь</option><option value="1">Администратор</option></select></label><br>
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
            <option value="1" ${role === 1 ? 'selected' : ''}>Администратор</option></select></label><br>
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
    const userOptions = allUsers.map(u => `<option value="${u.id}">${escapeHtml(u.username)}</option>`).join('');

    openModal('Добавить чат', `
        <label>Пользователь:
            <select id="chat-user_id">${userOptions}</select>
        </label><br>
        <label>Название: <input type="text" id="chat-title"></label><br>
        <button onclick="createChat()">Сохранить</button>
    `);
}

function openEditChatForm(id, user_name, title) {
    const userOptions = allUsers.map(u =>
        `<option value="${u.id}" ${u.username === user_name ? 'selected' : ''}>${escapeHtml(u.username)}</option>`
    ).join('');

    openModal('Редактировать чат', `
        <input type="hidden" id="chat-id" value="${id}">
        <label>Пользователь:
            <select id="chat-user_id">${userOptions}</select>
        </label><br>
        <label>Название: <input type="text" id="chat-title" value="${escapeJsString(title)}"></label><br>
        <button onclick="updateChat()">Сохранить</button>
    `);
}

// Сообщения
async function loadMessages() {
    const data = await postRequest('get_messages');
    const tbody = document.querySelector('#messages-table tbody');
    tbody.innerHTML = '';

    data.messages.forEach(m => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${escapeHtml(m.chat_title)}</td>
            <td>${escapeHtml(m.user_name || 'Нейросеть')}</td>
            <td>${escapeHtml(m.message)}</td>
            <td>${escapeHtml(m.model || 'Нет')}</td>
            <td>${m.created_at}</td>
            <td>
                <button class="edit-btn">Редактировать</button>
                <button class="delete-btn">Удалить</button>
            </td>
        `;

        const editBtn = tr.querySelector('.edit-btn');
        const deleteBtn = tr.querySelector('.delete-btn');

        editBtn.addEventListener('click', () => {
            openEditMessageForm(
                m.id,
                m.chat_title,
                m.user_name || 'Нейросеть',
                m.message,
                m.model || ''
            );
        });

        deleteBtn.addEventListener('click', () => {
            deleteMessage(m.id);
        });

        tbody.appendChild(tr);
    });
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

// Модели
const modelInput = key => document.getElementById(`model-${key}`).value;

async function createModel() {
    const name = modelInput('name');
    const display_name = modelInput('display_name');
    const type = modelInput('type');
    const url = modelInput('url');
    const model_name = modelInput('model_name');
    const enabled = modelInput('enabled');
    const data = await postRequest('create_model', { name, display_name, type, url, model_name, enabled });
    data.success ? (closeModal(), location.reload()) : alert(data.error || 'Ошибка при создании');
}

async function updateModel() {
    const id = modelInput('id');
    const name = modelInput('name');
    const display_name = modelInput('display_name');
    const type = modelInput('type');
    const url = modelInput('url');
    const model_name = modelInput('model_name');
    const enabled = modelInput('enabled');
    const data = await postRequest('update_model', { id, name, display_name, type, url, model_name, enabled });
    data.success ? (closeModal(), location.reload()) : alert(data.error || 'Ошибка при обновлении');
}

function deleteModel(id) {
    deleteEntity('delete_model', id, () => location.reload());
}


// Модальные окна
function openCreateMessageForm() {
    const userOptions = allUsers.map(u => `<option value="${u.id}">${escapeHtml(u.username)}</option>`).join('');
    const chatOptions = allChats.map(c => `<option value="${c.id}">${escapeHtml(c.title)}</option>`).join('');

    openModal('Добавить сообщение', `
        <label>Чат: 
            <select id="message-chat_id">${chatOptions}</select>
        </label><br>
        <label>Пользователь: 
            <select id="message-user_id">${userOptions}</select>
        </label><br>
        <label>Сообщение: <textarea id="message-text"></textarea></label><br>
        <label>Модель: <input type="text" id="message-model"></label><br>
        <button onclick="createMessage()">Сохранить</button>
    `);
}

function openEditMessageForm(id, chat_title, user_name, message, model) {
    const userOptions = allUsers.map(u => 
        `<option value="${u.id}" ${u.username === user_name ? 'selected' : ''}>${escapeHtml(u.username)}</option>`
    ).join('');

    const chatOptions = allChats.map(c => 
        `<option value="${c.id}" ${c.title === chat_title ? 'selected' : ''}>${escapeHtml(c.title)}</option>`
    ).join('');

    openModal('Редактировать сообщение', `
        <input type="hidden" id="message-id" value="${id}">
        <label>Чат: 
            <select id="message-chat_id">${chatOptions}</select>
        </label><br>
        <label>Пользователь: 
            <select id="message-user_id">${userOptions}</select>
        </label><br>
        <label>Сообщение: <textarea id="message-text">${escapeJsString(message)}</textarea></label><br>
        <label>Модель: <input type="text" id="message-model" value="${escapeJsString(model)}"></label><br>
        <button onclick="updateMessage()">Сохранить</button>
    `);
}

function openCreateModelForm() {
    openModal('Добавить модель', `
        <label>Имя: <input type="text" id="model-name"></label><br>
        <label>Отображаемое имя: <input type="text" id="model-display_name"></label><br>
        <label>Тип: <select id="model-type">
            <option value="huggingface">huggingface</option>
            <option value="yandexgpt">yandexgpt</option>
            <option value="ionet">ionet</option>
            <option value="openrouter">openrouter</option>
        </select></label><br>
        <label>URL: <input type="text" id="model-url"></label><br>
        <label>Название модели: <input type="text" id="model-model_name"></label><br>
        <label>Включено: <select id="model-enabled">
            <option value="1">Да</option>
            <option value="0">Нет</option>
        </select></label><br>
        <button onclick="createModel()">Сохранить</button>
    `);
}

function openEditModelForm(id) {
    const model = allModels.find(m => m.id == id);
    if (!model) return alert('Модель не найдена');

    openModal('Редактировать модель', `
        <input type="hidden" id="model-id" value="${model.id}">
        <label>Имя: <input type="text" id="model-name" value="${escapeJsString(model.name)}"></label><br>
        <label>Отображаемое имя: <input type="text" id="model-display_name" value="${escapeJsString(model.display_name)}"></label><br>
        <label>Тип: <select id="model-type">
            <option value="huggingface" ${model.type === 'huggingface' ? 'selected' : ''}>huggingface</option>
            <option value="yandexgpt" ${model.type === 'yandexgpt' ? 'selected' : ''}>yandexgpt</option>
            <option value="ionet" ${model.type === 'ionet' ? 'selected' : ''}>ionet</option>
            <option value="openrouter" ${model.type === 'openrouter' ? 'selected' : ''}>openrouter</option>
        </select></label><br>
        <label>URL: <input type="text" id="model-url" value="${escapeJsString(model.url || '')}"></label><br>
        <label>Название модели: <input type="text" id="model-model_name" value="${escapeJsString(model.model_name || '')}"></label><br>
        <label>Включено: <select id="model-enabled">
            <option value="1" ${model.enabled == 1 ? 'selected' : ''}>Да</option>
            <option value="0" ${model.enabled == 0 ? 'selected' : ''}>Нет</option>
        </select></label><br>
        <button onclick="updateModel()">Сохранить</button>
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

let allUsers = [];
let allChats = [];
let allModels = [];

window.onload = async () => {
    await checkAdminAccess();

    const [usersData, chatsData, messagesData, modelsData] = await Promise.all([
        postRequest('get_users'),
        postRequest('get_chats'),
        postRequest('get_messages'),
        postRequest('get_models'),
    ]);
    
    allModels = modelsData.models;
    document.getElementById('stat-models').textContent = allModels.length;
    allUsers = usersData.users;
    allChats = chatsData.chats;  

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
        <td>${user.role === 1 ? 'Администратор' : 'Пользователь'}</td>
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
        <td>${m.user_name || 'Нейросеть'}</td>
        <td>${m.message}</td>
        <td>${m.model || 'Нет'}</td>
        <td>${m.created_at}</td>
        <td>
            <button onclick="openEditMessageForm(${m.id}, '${m.chat_title}', '${m.user_name}', '${m.message}', '${m.model || ''}')">Редактировать</button>
            <button onclick="deleteMessage(${m.id})">Удалить</button>
        </td>
    `);

    renderTable(modelsData.models, '#models-table tbody', model => `
        <td>${escapeHtml(model.name)}</td>
        <td>${escapeHtml(model.display_name)}</td>
        <td>${escapeHtml(model.type)}</td>
        <td>${escapeHtml(model.url || '')}</td>
        <td>${escapeHtml(model.model_name || '')}</td>
        <td>${model.enabled == 1 ? 'Да' : 'Нет'}</td>
        <td>
            <button onclick="openEditModelForm(${model.id})">Редактировать</button>
            <button onclick="deleteModel(${model.id})">Удалить</button>
        </td>
    `);
};

function toggleMenu() {
    document.getElementById('sidebar-menu').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

function showSection(id) {
    if (id === 'models-section') {
        alert('Изменения в данной таблице могут привести к поломке функционала на сайте. Не применяйте изменения без веб-специалиста!');
    }

    ['users-section', 'chats-section', 'messages-section', 'models-section'].forEach(sec => {
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