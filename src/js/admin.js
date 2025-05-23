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
        .replace(/\\/g, "\\\\")
        .replace(/\n/g, "<br>");
}

function escapeJsString(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\n')
        .replace(/\r/g, '\r');
}

function getModelDisplayNameById(id) {
    const model = allModels.find(m => m.id == id);
    return model ? model.display_name : 'Нет';
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
        <td>${escapeHtml(chat.user_name || 'Неизвестно')}</td>
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

function openEditChatForm(id, user_id, title) {
    const userOptions = allUsers.map(u =>
        `<option value="${u.id}" ${u.id == user_id ? 'selected' : ''}>${escapeHtml(u.username)}</option>`
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
    if (data.error) return alert(data.error);
    allMessages = data.messages;
    const tbody = document.querySelector('#messages-table tbody');
    tbody.innerHTML = '';
    allMessages.forEach(m => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(m.chat_title)}</td>
            <td>${escapeHtml(m.user_name || 'Нейросеть')}</td>
            <td>${escapeHtml(m.message)}</td>
            <td>${escapeHtml(getModelDisplayNameById(m.model_id))}</td>
            <td>${m.created_at}</td>
            <td>
                <button class="edit-btn" data-id="${m.id}">Редактировать</button>
                <button class="delete-btn" data-id="${m.id}">Удалить</button>
            </td>
        `;
        const editBtn = tr.querySelector('.edit-btn');
        const deleteBtn = tr.querySelector('.delete-btn');
        editBtn.addEventListener('click', () => {
            const msg = allMessages.find(msg => msg.id == editBtn.dataset.id);
            openEditMessageForm(
                msg.id,
                msg.chat_title,
                msg.user_name || 'Нейросеть',
                msg.message,
                msg.model_id || ''
            );
        });
        deleteBtn.addEventListener('click', () => {
            deleteMessage(deleteBtn.dataset.id);
        });
        tbody.appendChild(tr);
    });
}

async function createMessage() {
    const chat_id = msgInput('chat_id');
    const user_id = msgInput('user_id');
    const message = msgInput('text');
    const model_id = msgInput('model') || null;
    const data = await postRequest('create_message', { chat_id, user_id, message, model_id });
    data.success ? (closeModal(), loadMessages()) : alert(data.error || 'Ошибка при создании');
}

async function updateMessage() {
    const id = msgInput('id');
    const chat_id = msgInput('chat_id');
    const user_id = msgInput('user_id');
    const message = msgInput('text');
    const model_id = msgInput('model') || null;
    const data = await postRequest('update_message', { id, chat_id, user_id, message, model_id });
    data.success ? (closeModal(), loadMessages()) : alert(data.error || 'Ошибка при обновлении');
}

function deleteMessage(id) {
    deleteEntity('delete_message', id, loadMessages);
}

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
        <label>Модель: 
            <select id="message-model">
                <option value="">Нет</option>
                ${allModels.map(m => `<option value="${m.id}">${escapeHtml(m.display_name)}</option>`).join('')}
            </select>
        </label><br>
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
        <label>Модель: 
            <select id="message-model">
                <option value="" ${!model ? 'selected' : ''}>Нет</option>
                ${allModels.map(m => `<option value="${m.id}" ${m.id == model ? 'selected' : ''}>${escapeHtml(m.display_name)}</option>`).join('')}
            </select>
        </label><br>
        <button onclick="updateMessage()">Сохранить</button>
    `);
}

// Модели
async function loadModels() {
    const data = await postRequest('get_models');
    if (data.error) return alert(data.error);
    allModels = data.models;
    renderTable(allModels, '#models-table tbody', model => `
        <td>${escapeHtml(model.name)}</td>
        <td>${escapeHtml(model.display_name)}</td>
        <td>${escapeHtml(model.type)}</td>
        <td>${escapeHtml(model.url || '')}</td>
        <td>${escapeHtml(model.local_link || '')}</td>
        <td>${model.enabled == 1 ? 'Да' : 'Нет'}</td>
        <td>
            <button onclick="openEditModelForm(${model.id})">Редактировать</button>
            <button onclick="deleteModel(${model.id})">Удалить</button>
        </td>
    `);
}

const modelInput = key => document.getElementById(`model-${key}`).value;

async function createModel() {
    const name = modelInput('name');
    const display_name = modelInput('display_name');
    const type = modelInput('type');
    const url = modelInput('url') || null;
    const local_link = modelInput('local_link') || null;
    const enabled = modelInput('enabled');
    const data = await postRequest('create_model', { name, display_name, type, url, local_link, enabled });
    data.success ? (closeModal(), location.reload()) : alert(data.error || 'Ошибка при создании');
}

async function updateModel() {
    const id = modelInput('id');
    const name = modelInput('name');
    const display_name = modelInput('display_name');
    const type = modelInput('type');
    const url = modelInput('url') || null;
    const local_link = modelInput('local_link') || null;
    const enabled = modelInput('enabled');
    const data = await postRequest('update_model', { id, name, display_name, type, url, local_link, enabled });
    data.success ? (closeModal(), location.reload()) : alert(data.error || 'Ошибка при обновлении');
}

function deleteModel(id) {
    deleteEntity('delete_model', id, () => location.reload());
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
        <label>Локальная ссылка: <input type="text" id="model-local_link"></label><br>
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
        <label>Локальная ссылка: <input type="text" id="model-local_link" value="${escapeJsString(model.local_link || '')}"></label><br>
        <label>Включено: <select id="model-enabled">
            <option value="1" ${model.enabled == 1 ? 'selected' : ''}>Да</option>
            <option value="0" ${model.enabled == 0 ? 'selected' : ''}>Нет</option>
        </select></label><br>
        <button onclick="updateModel()">Сохранить</button>
    `);
}

// Тарифы
const tariffInput = key => document.getElementById(`tariff-${key}`).value;

async function loadTariffs() {
    const data = await postRequest('get_tariffs');
    if (data.error) return alert(data.error);
    allTariffs = data.tariffs;
    renderTable(allTariffs, '#tariffs-table tbody', tariff => `
        <td>${escapeHtml(tariff.name)}</td>
        <td>${tariff.price}</td>
        <td>${tariff.duration_days || 'Нет'}</td>
        <td>${tariff.message_limit || 'Нет'}</td>
        <td>
            <button onclick="openEditTariffForm(${tariff.id}, '${escapeJsString(tariff.name)}', ${tariff.price}, ${tariff.duration_days || 'null'}, ${tariff.message_limit || 'null'})">Редактировать</button>
            <button onclick="deleteTariff(${tariff.id})">Удалить</button>
        </td>
    `);
}

async function createTariff() {
    const name = tariffInput('name');
    const price = tariffInput('price');
    const duration_days = tariffInput('duration_days') || null;
    const message_limit = tariffInput('message_limit') || null;
    const data = await postRequest('create_tariff', { name, price, duration_days, message_limit });
    data.success ? (closeModal(), loadTariffs()) : alert(data.error || 'Ошибка при создании');
}

async function updateTariff() {
    const id = tariffInput('id');
    const name = tariffInput('name');
    const price = tariffInput('price');
    const duration_days = tariffInput('duration_days') || null;
    const message_limit = tariffInput('message_limit') || null;
    const data = await postRequest('update_tariff', { id, name, price, duration_days, message_limit });
    data.success ? (closeModal(), loadTariffs()) : alert(data.error || 'Ошибка при обновлении');
}

function deleteTariff(id) {
    deleteEntity('delete_tariff', id, loadTariffs);
}

function openCreateTariffForm() {
    openModal('Добавить тариф', `
        <label>Название: <input type="text" id="tariff-name"></label><br>
        <label>Цена: <input type="number" step="0.01" id="tariff-price"></label><br>
        <label>Длительность (дней): <input type="number" id="tariff-duration_days"></label><br>
        <label>Лимит сообщений: <input type="number" id="tariff-message_limit"></label><br>
        <button onclick="createTariff()">Сохранить</button>
    `);
}

function openEditTariffForm(id, name, price, duration_days, message_limit) {
    openModal('Редактировать тариф', `
        <input type="hidden" id="tariff-id" value="${id}">
        <label>Название: <input type="text" id="tariff-name" value="${name}"></label><br>
        <label>Цена: <input type="number" step="0.01" id="tariff-price" value="${price}"></label><br>
        <label>Длительность (дней): <input type="number" id="tariff-duration_days" value="${duration_days || ''}"></label><br>
        <label>Лимит сообщений: <input type="number" id="tariff-message_limit" value="${message_limit || ''}"></label><br>
        <button onclick="updateTariff()">Сохранить</button>
    `);
}

// Подписки
const subscriptionInput = key => document.getElementById(`subscription-${key}`).value;

async function loadSubscriptions() {
    const data = await postRequest('get_subscriptions');
    if (data.error) return alert(data.error);
    allSubscriptions = data.subscriptions;
    renderTable(allSubscriptions, '#subscriptions-table tbody', subscription => `
        <td>${escapeHtml(subscription.user_name)}</td>
        <td>${escapeHtml(subscription.tariff_name)}</td>
        <td>${subscription.start_date}</td>
        <td>${subscription.end_date || 'Нет'}</td>
        <td>${subscription.messages_used}</td>
        <td>${subscription.last_reset_date || 'Нет'}</td>
        <td>
            <button onclick="openEditSubscriptionForm(${subscription.id}, ${subscription.user_id}, ${subscription.tariff_id}, '${subscription.start_date}', '${subscription.end_date || ''}', ${subscription.messages_used}, '${subscription.last_reset_date || ''}')">Редактировать</button>
            <button onclick="deleteSubscription(${subscription.id})">Удалить</button>
        </td>
    `);
}

async function createSubscription() {
    const user_id = subscriptionInput('user_id');
    const tariff_id = subscriptionInput('tariff_id');
    const start_date = subscriptionInput('start_date');
    const end_date = subscriptionInput('end_date') || null;
    const messages_used = subscriptionInput('messages_used') || 0;
    const last_reset_date = subscriptionInput('last_reset_date') || null;
    const data = await postRequest('create_subscription', { user_id, tariff_id, start_date, end_date, messages_used, last_reset_date });
    data.success ? (closeModal(), loadSubscriptions()) : alert(data.error || 'Ошибка при создании');
}

async function updateSubscription() {
    const id = subscriptionInput('id');
    const user_id = subscriptionInput('user_id');
    const tariff_id = subscriptionInput('tariff_id');
    const start_date = subscriptionInput('start_date');
    const end_date = subscriptionInput('end_date') || null;
    const messages_used = subscriptionInput('messages_used') || 0;
    const last_reset_date = subscriptionInput('last_reset_date') || null;
    const data = await postRequest('update_subscription', { id, user_id, tariff_id, start_date, end_date, messages_used, last_reset_date });
    data.success ? (closeModal(), loadSubscriptions()) : alert(data.error || 'Ошибка при обновлении');
}

function deleteSubscription(id) {
    deleteEntity('delete_subscription', id, loadSubscriptions);
}

function openCreateSubscriptionForm() {
    const userOptions = allUsers.map(u => `<option value="${u.id}">${escapeHtml(u.username)}</option>`).join('');
    const tariffOptions = allTariffs.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
    openModal('Добавить подписку', `
        <label>Пользователь: <select id="subscription-user_id">${userOptions}</select></label><br>
        <label>Тариф: <select id="subscription-tariff_id">${tariffOptions}</select></label><br>
        <label>Дата начала: <input type="datetime-local" id="subscription-start_date"></label><br>
        <label>Дата окончания: <input type="datetime-local" id="subscription-end_date"></label><br>
        <label>Использовано сообщений: <input type="number" id="subscription-messages_used" value="0"></label><br>
        <label>Дата сброса: <input type="date" id="subscription-last_reset_date"></label><br>
        <button onclick="createSubscription()">Сохранить</button>
    `);
}

function openEditSubscriptionForm(id, user_id, tariff_id, start_date, end_date, messages_used, last_reset_date) {
    const userOptions = allUsers.map(u => `<option value="${u.id}" ${u.id == user_id ? 'selected' : ''}>${escapeHtml(u.username)}</option>`).join('');
    const tariffOptions = allTariffs.map(t => `<option value="${t.id}" ${t.id == tariff_id ? 'selected' : ''}>${escapeHtml(t.name)}</option>`).join('');
    openModal('Редактировать подписку', `
        <input type="hidden" id="subscription-id" value="${id}">
        <label>Пользователь: <select id="subscription-user_id">${userOptions}</select></label><br>
        <label>Тариф: <select id="subscription-tariff_id">${tariffOptions}</select></label><br>
        <label>Дата начала: <input type="datetime-local" id="subscription-start_date" value="${start_date.replace(' ', 'T')}"></label><br>
        <label>Дата окончания: <input type="datetime-local" id="subscription-end_date" value="${end_date ? end_date.replace(' ', 'T') : ''}"></label><br>
        <label>Использовано сообщений: <input type="number" id="subscription-messages_used" value="${messages_used}"></label><br>
        <label>Дата сброса: <input type="date" id="subscription-last_reset_date" value="${last_reset_date || ''}"></label><br>
        <button onclick="updateSubscription()">Сохранить</button>
    `);
}

// Доступ к моделям
const accessInput = key => document.getElementById(`access-${key}`).value;

async function loadTariffModelAccess() {
    const data = await postRequest('get_tariff_model_access');
    if (data.error) return alert(data.error);
    allTariffModelAccess = data.access;
    renderTable(allTariffModelAccess, '#access-table tbody', access => `
        <td>${escapeHtml(access.tariff_name)}</td>
        <td>${escapeHtml(access.local_link)}</td>
        <td>
            <button onclick="openEditTariffModelAccessForm(${access.tariff_id}, ${access.model_id}, '${escapeJsString(access.tariff_name)}', '${escapeJsString(access.local_link)}')">Редактировать</button>
            <button onclick="deleteTariffModelAccess(${access.tariff_id}, ${access.model_id})">Удалить</button>
        </td>
    `);
}

async function createTariffModelAccess() {
    const tariff_id = accessInput('tariff_id');
    const model_id = accessInput('model_id');
    const data = await postRequest('create_tariff_model_access', { tariff_id, model_id });
    data.success ? (closeModal(), loadTariffModelAccess()) : alert(data.error || 'Ошибка при создании');
}

async function updateTariffModelAccess() {
    const old_tariff_id = accessInput('old_tariff_id');
    const old_model_id = accessInput('old_model_id');
    const tariff_id = accessInput('tariff_id');
    const model_id = accessInput('model_id');
    const data = await postRequest('update_tariff_model_access', { old_tariff_id, old_model_id, tariff_id, model_id });
    data.success ? (closeModal(), loadTariffModelAccess()) : alert(data.error || 'Ошибка при обновлении');
}

function deleteTariffModelAccess(tariff_id, model_id) {
    if (confirm('Вы уверены?')) {
        const data = postRequest('delete_tariff_model_access', { tariff_id, model_id });
        if (data.success) loadTariffModelAccess();
        else alert(data.error || 'Ошибка при удалении');
    }
}

function openCreateTariffModelAccessForm() {
    const tariffOptions = allTariffs.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
    const modelOptions = allModels.map(m => `<option value="${m.id}">${escapeHtml(m.display_name)}</option>`).join('');
    openModal('Добавить доступ', `
        <label>Тариф: <select id="access-tariff_id">${tariffOptions}</select></label><br>
        <label>Модель: <select id="access-model_id">${modelOptions}</select></label><br>
        <button onclick="createTariffModelAccess()">Сохранить</button>
    `);
}

function openEditTariffModelAccessForm(old_tariff_id, old_model_id, tariff_name, local_link) {
    const tariffOptions = allTariffs.map(t => `<option value="${t.id}" ${t.name === tariff_name ? 'selected' : ''}>${escapeHtml(t.name)}</option>`).join('');
    const modelOptions = allModels.map(m => `<option value="${m.id}" ${m.display_name === local_link ? 'selected' : ''}>${escapeHtml(m.display_name)}</option>`).join('');
    openModal('Редактировать доступ', `
        <input type="hidden" id="access-old_tariff_id" value="${old_tariff_id}">
        <input type="hidden" id="access-old_model_id" value="${old_model_id}">
        <label>Тариф: <select id="access-tariff_id">${tariffOptions}</select></label><br>
        <label>Модель: <select id="access-model_id">${modelOptions}</select></label><br>
        <button onclick="updateTariffModelAccess()">Сохранить</button>
    `);
}

// Модальные окна
function openModal(title, content) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-form').innerHTML = content;
    document.getElementById('modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Отображение имени администратора
async function loadAdminInfo() {
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
                <span class="banner-title">Здравствуйте, ${escapeHtml(data.username)}!</span>
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

// Остальное
const userInput = key => document.getElementById(`user-${key}`).value;
const chatInput = key => document.getElementById(`chat-${key}`).value;
const msgInput = key => document.getElementById(`message-${key}`).value;

let allUsers = [];
let allChats = [];
let allMessages = [];
let allModels = [];
let allTariffs = [];
let allSubscriptions = [];
let allTariffModelAccess = [];

window.onload = async () => {
    await checkAdminAccess();
    const [usersData, chatsData, messagesData, modelsData, tariffsData, subscriptionsData, accessData] = await Promise.all([
        postRequest('get_users'),
        postRequest('get_chats'),
        postRequest('get_messages'),
        postRequest('get_models'),
        postRequest('get_tariffs'),
        postRequest('get_subscriptions'),
        postRequest('get_tariff_model_access'),
    ]);
    if (usersData.error || chatsData.error || messagesData.error || modelsData.error || tariffsData.error || subscriptionsData.error || accessData.error) {
        alert('Ошибка при загрузке данных');
        window.location.href = '/login.html';
        return;
    }

    allUsers = usersData.users;
    allChats = chatsData.chats;
    allMessages = messagesData.messages;
    allModels = modelsData.models;
    allTariffs = tariffsData.tariffs;
    allSubscriptions = subscriptionsData.subscriptions;
    allTariffModelAccess = accessData.access;
    
    document.getElementById('stat-users').textContent = allUsers.length;
    document.getElementById('stat-chats').textContent = allChats.length;
    document.getElementById('stat-messages').textContent = allMessages.length;
    document.getElementById('stat-models').textContent = allModels.length;

    await loadUsers();
    await loadChats();
    await loadMessages();
    await loadModels();
    await loadTariffs();
    await loadSubscriptions();
    await loadTariffModelAccess();
    await loadAdminInfo();
};

function toggleMenu() {
    document.getElementById('sidebar-menu').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

function showSection(id) {
    if (id === 'models-section') {
        alert('Изменения в данной таблице могут привести к поломке функционала на сайте. Не вносите изменения без веб-специалиста!');
    }
    ['users-section', 'chats-section', 'messages-section', 'models-section', 'tariffs-section', 'subscriptions-section', 'access-section'].forEach(sec => {
        document.getElementById(sec).style.display = sec === id ? 'block' : 'none';
    });
    toggleMenu();
}

Object.assign(window, {
    openCreateUserForm, openEditUserForm, createUser, updateUser, deleteUser,
    openCreateChatForm, openEditChatForm, createChat, updateChat, deleteChat,
    openCreateMessageForm, openEditMessageForm, createMessage, updateMessage, deleteMessage,
    openCreateModelForm, openEditModelForm, createModel, updateModel, deleteModel,
    openCreateTariffForm, openEditTariffForm, createTariff, updateTariff, deleteTariff,
    openCreateSubscriptionForm, openEditSubscriptionForm, createSubscription, updateSubscription, deleteSubscription,
    openCreateTariffModelAccessForm, openEditTariffModelAccessForm, createTariffModelAccess, updateTariffModelAccess, deleteTariffModelAccess,
    closeModal,
    toggleMenu,
    showSection
});

import { logout } from './logout.js';
window.logout = logout;

export { escapeHtml, escapeJsString };