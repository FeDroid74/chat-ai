<?php
session_start();
require_once '../backend/db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Ошибка: авторизуйтесь']);
    exit;
}

$apiToken = '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';
$apiUrl = 'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1';
$user_id = $_SESSION['user_id'];

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? 'send_message';

// Получение информации о пользователе
if ($action === 'get_user_info') {
    $stmt = $pdo->prepare("SELECT username FROM user WHERE id = :user_id");
    $stmt->execute(['user_id' => $user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($user) {
        echo json_encode(['username' => $user['username']]);
    } else {
        echo json_encode(['error' => 'Пользователь не найден']);
    }
    exit;
}

// Получение списка чатов
if ($action === 'get_chats') {
    $stmt = $pdo->prepare("SELECT id, title FROM chats WHERE user_id = :user_id ORDER BY created_at DESC");
    $stmt->execute(['user_id' => $user_id]);
    $chats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['chats' => $chats]);
    exit;
}

// Создание нового чата
if ($action === 'create_chat') {
    $title = trim($input['title'] ?? 'Новый чат ' . date('Y-m-d H:i:s'));
    $stmt = $pdo->prepare("INSERT INTO chats (user_id, title) VALUES (:user_id, :title)");
    $stmt->execute(['user_id' => $user_id, 'title' => $title]);
    $chat_id = $pdo->lastInsertId();
    echo json_encode(['chat_id' => $chat_id, 'title' => $title]);
    exit;
}

// Получение истории сообщений
if ($action === 'get_history') {
    $chat_id = $input['chat_id'] ?? 0;
    if (!$chat_id) {
        echo json_encode(['error' => 'Укажите chat_id']);
        exit;
    }
    $stmt = $pdo->prepare("SELECT user_id, message FROM messages WHERE chat_id = :chat_id ORDER BY created_at ASC");
    $stmt->execute(['chat_id' => $chat_id]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['messages' => $messages]);
    exit;
}

// Отправка сообщения
if ($action === 'send_message') {
    $message = trim($input['message'] ?? '');
    $chat_id = $input['chat_id'] ?? 0;

    if (empty($message)) {
        echo json_encode(['error' => 'Сообщение пустое']);
        exit;
    }

    // Создаём новый чат, если не указан
    if (!$chat_id) {
        $stmt = $pdo->prepare("INSERT INTO chats (user_id, title) VALUES (:user_id, :title)");
        $stmt->execute(['user_id' => $user_id, 'title' => 'Чат ' . date('Y-m-d H:i:s')]);
        $chat_id = $pdo->lastInsertId();
    }

    // Сохраняем сообщение пользователя
    $stmt = $pdo->prepare("INSERT INTO messages (chat_id, user_id, message) VALUES (:chat_id, :user_id, :message)");
    $stmt->execute(['chat_id' => $chat_id, 'user_id' => $user_id, 'message' => $message]);

    // Уточнённая инструкция для ИИ
    $formatted_message = "<s>[INST] Ты — экспертный ИИ, отвечай подробно, логично и на русском языке на вопрос: \"$message\" [/INST]";

    $payload = [
        'inputs' => $formatted_message,
        'parameters' => [
            'max_new_tokens' => 50, // Ограничиваем новые токены, а не общую длину
            'temperature' => 0.1,   // Уменьшаем случайность для точных ответов
            'top_k' => 20,          // Уменьшаем разнообразие
            'top_p' => 0.7,         // Более строгий фильтр
            'repetition_penalty' => 1.1, // Меньше повторов
            'do_sample' => false    // Отключаем случайную выборку для точности
        ]
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiToken,
        'Content-Type: application/json'
    ]);

    $response = curl_exec($ch);
    curl_close($ch);

    $result = json_decode($response, true);
    if (isset($result[0]['generated_text'])) {
        $reply = trim(str_replace($formatted_message, '', $result[0]['generated_text']));
        if (empty($reply) || strlen($reply) < 5) { // Уменьшил порог до 5
            $reply = 'Не могу дать точный ответ, уточните вопрос.';
        }
        // Сохраняем ответ ИИ
        $stmt = $pdo->prepare("INSERT INTO messages (chat_id, user_id, message) VALUES (:chat_id, :user_id, :message)");
        $stmt->execute(['chat_id' => $chat_id, 'user_id' => 0, 'message' => $reply]);
        echo json_encode(['reply' => $reply, 'chat_id' => $chat_id]);
    } else {
        // Для отладки: логируем ошибку
        file_put_contents('debug.log', "API Error: " . print_r($response, true) . "\n", FILE_APPEND);
        echo json_encode(['error' => 'Ошибка генерации текста']);
    }
    exit;
}

echo json_encode(['error' => 'Неизвестное действие']);
?>