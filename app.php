<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Чат с ИИ</title>
    <link rel="stylesheet" href="/src/css/style.css">
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
                <select id="model-select" onchange="updateModel()">
                    <!-- <option value="mixtral">Mixtral</option> -->
                    <option value="mistral">Mistral</option>
                    <option value="yandexgpt">YandexGPT</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="qwen">Qwen</option>
                    <option value="llama">Llama</option>
                    <option value="gemma">Gemma</option>
                </select>
                <input type="text" id="user-input" placeholder="Введите сообщение..." onkeypress="if(event.key === 'Enter') sendMessage();">
                <button class="send-btn" onclick="sendMessage()"><span>🡡</span></button>
            </div>
        </div>
    </div>
    <script type="module" src="/src/js/script.js"></script>
</body>
</html>