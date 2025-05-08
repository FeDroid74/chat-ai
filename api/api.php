<?php
session_start();
require_once 'config.php';
require_once '../backend/db.php';
require_once '../backend/user.php';
require_once '../backend/chat.php';
require_once '../backend/message.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Ошибка: авторизуйтесь']);
    exit;
}

$user_id = $_SESSION['user_id'];
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? 'send_message';

$models = loadModels($pdo); // Загружаем модели из БД

// Маршрутизация запросов
if (in_array($action, ['get_user_info'])) {
    handleUserAction($action, $user_id, $pdo);
} elseif (in_array($action, ['get_chats', 'create_chat', 'get_history', 'rename_chat', 'delete_chat'])) {
    handleChatAction($action, $user_id, $input, $pdo);
} elseif (in_array($action, ['send_message'])) {
    handleMessageAction($action, $user_id, $input, $pdo, $models, $hfApiToken, $yandexOauthToken, $yandexApiUrl, $yandexOperationApiUrl, $yandexFolderId, $ioNetApiKey, $openRouterApiKey);
} else {
    echo json_encode(['error' => 'Неизвестное действие']);
    exit;
}
?>