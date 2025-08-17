<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Чат с ИИ</title>
    <link rel="stylesheet" href="./src/css/style.css">
</head>
<body>
    <div class="user-info" id="user-info">
        <button onclick="logout()" class="logout-btn">Выйти</button>
    </div>

    <div class="chat-layout">
        <button class="menu-toggle" onclick="toggleMenu()">☰</button>
        <div class="sidebar-menu" id="sidebar-menu">
            <div class="sidebar-header">
                <button onclick="toggleMenu()" class="close-menu"><span>🡠</span></button>
                <button onclick="createChat()" class="new-chat-btn">Новый чат</button>
            </div>
            <div id="chat-list"></div>
        </div>
        <div class="overlay" id="overlay" onclick="toggleMenu()"></div>
        <div class="chat-main">
            <div id="messages"></div>
            <div class="input-form">
                <input type="text" id="user-input" placeholder="Чем я могу помочь?" onkeypress="if(event.key === 'Enter') sendMessage();">
                <div class="input-control">
                    <select id="model-select" onchange="updateModel()">
                        <!-- <option value="mixtral">Mixtral</option> -->
                        <option value="mistral">Mistral</option>
                        <option value="yandexgpt">YandexGPT</option>
                        <option value="deepseek">DeepSeek</option>
                        <option value="qwen">Qwen</option>
                        <option value="llama">Llama</option>
                        <option value="gemma">Gemma</option>
                    </select>
                    <button class="send-btn" onclick="sendMessage()"><span>🡡</span></button>
                </div>
            </div>
        </div>
    </div>

    <div class="banner">
        <div class="banner-title">Не хватает запросов?</div>
        <div class="banner-title">Недоступна модель?</div>
        <button class="banner-button" onclick="location.hash = '#subscribe'">Обновить тариф</button>
    </div>

    <div id="tariff-modal" class="tariff-modal-overlay">
        <div class="tariff-modal-content">
            <button class="tariff-modal-close" onclick="closeModal()">✕</button>
            <h2 class="tariff-title">Тарифы</h2>
            <div class="tariff-grid">
                <div class="tariff-card">
                    <h3 class="tariff-name">Бесплатный</h3>
                    <p class="tariff-desc">5 запросов в день<br>Доступ к базовым моделям</p>
                    <p class="tariff-price">0 ₽/мес</p>
                    <div class="tariff-btn"><button class="tariff-btn" disabled>Текущий</button></div>
                </div>
                <div class="tariff-card">
                    <h3 class="tariff-name">Мини</h3>
                    <p class="tariff-desc">100 запросов в день<br>Доступ к улучшенным моделям<br>Оперативная поддержка</p>
                    <p class="tariff-price">490 ₽/мес</p>
                    <div class="tariff-btn"><button class="tariff-btn" data-tariff-id="2">Получить</button></div>
                </div>
                <div class="tariff-card">
                    <h3 class="tariff-name">Премиум</h3>
                    <p class="tariff-desc">Неограниченные запросы<br>Доступ к мощным моделям<br>Приоритетная поддержка</p>
                    <p class="tariff-price">990 ₽/мес</p>
                    <div class="tariff-btn"><button class="tariff-btn" data-tariff-id="3">Получить</button></div>
                </div>
            </div>
        </div>
    </div>

    <script type="module" src="./src/js/script.js"></script>
    <script type="module" src="./src/js/arrow.js"></script>
    <script type="module" src="./src/js/payment.js"></script>
</body>
</html>