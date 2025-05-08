<?php
session_start();
require_once '../backend/db.php';
require_once '../api/config.php';

ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json; charset=UTF-8');

if (!isset($_SESSION['user_id'])) exitWithError('Ошибка: авторизуйтесь');

$user_id = $_SESSION['user_id'];
$stmt = $pdo->prepare("SELECT role FROM users WHERE id = :id");
$stmt->execute(['id' => $user_id]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || $user['role'] != 1) exitWithError('Доступ запрещён: требуется роль администратора');

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $input['action'] ?? '';

switch ($action) {
    case 'get_users':
        respondQuery("SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC", [], 'users');
        break;

    case 'create_user':
        handleRequest(['username', 'email', 'password', 'role'], function ($data) use ($pdo) {
            $stmt = $pdo->prepare("INSERT INTO users (username, email, password, role) VALUES (:username, :email, :password, :role)");
            $stmt->execute($data);
        });
        break;

    case 'update_user':
        handleRequest(['id', 'username', 'email', 'role'], function ($data) use ($pdo) {
            $stmt = $pdo->prepare("UPDATE users SET username = :username, email = :email, role = :role WHERE id = :id");
            $stmt->execute($data);
        });
        break;

    case 'delete_user':
        handleRequest(['id'], fn($data) => $pdo->prepare("DELETE FROM users WHERE id = :id")->execute($data));
        break;

    case 'get_chats':
        respondQuery("
            SELECT chats.id, users.username AS user_name, chats.title, chats.created_at
            FROM chats
            JOIN users ON users.id = chats.user_id
            ORDER BY chats.created_at DESC
        ", [], 'chats');
        break;

    case 'create_chat':
        handleRequest(['user_id', 'title'], fn($data) => $pdo->prepare("INSERT INTO chats (user_id, title) VALUES (:user_id, :title)")->execute($data));
        break;

    case 'update_chat':
        handleRequest(['id', 'user_id', 'title'], fn($data) => $pdo->prepare("UPDATE chats SET user_id = :user_id, title = :title WHERE id = :id")->execute($data));
        break;

    case 'delete_chat':
        handleRequest(['id'], fn($data) => $pdo->prepare("DELETE FROM chats WHERE id = :id")->execute($data));
        break;

    case 'get_messages':
    respondQuery("
        SELECT messages.id, chats.title AS chat_title, users.username AS user_name, messages.message, messages.model, messages.created_at
        FROM messages
        LEFT JOIN users ON users.id = messages.user_id
        LEFT JOIN chats ON chats.id = messages.chat_id
        ORDER BY messages.created_at DESC
    ", [], 'messages');
        break;

    case 'create_message':
        handleRequest(['chat_id', 'user_id', 'message'], function ($data) use ($pdo, $input) {
            $data['model'] = $input['model'] ?? null;
            $stmt = $pdo->prepare("INSERT INTO messages (chat_id, user_id, message, model) VALUES (:chat_id, :user_id, :message, :model)");
            $stmt->execute($data);
        });
        break;

    case 'update_message':
        handleRequest(['id', 'chat_id', 'user_id', 'message'], function ($data) use ($pdo, $input) {
            $data['model'] = $input['model'] ?? null;
            $stmt = $pdo->prepare("UPDATE messages SET chat_id = :chat_id, user_id = :user_id, message = :message, model = :model WHERE id = :id");
            $stmt->execute($data);
        });
        break;

    case 'delete_message':
        handleRequest(['id'], fn($data) => $pdo->prepare("DELETE FROM messages WHERE id = :id")->execute($data));
        break;

        case 'get_models':
            respondQuery("SELECT * FROM models ORDER BY id DESC", [], 'models');
            break;
        
        case 'create_model':
            handleRequest(['name', 'display_name', 'type', 'url', 'model_name', 'enabled'], function ($data) use ($pdo) {
                $stmt = $pdo->prepare("
                    INSERT INTO models (name, display_name, type, url, model_name, enabled)
                    VALUES (:name, :display_name, :type, :url, :model_name, :enabled)
                ");
                $stmt->execute($data);
            });
            break;
        
        case 'update_model':
            handleRequest(['id', 'name', 'display_name', 'type', 'url', 'model_name', 'enabled'], function ($data) use ($pdo) {
                $stmt = $pdo->prepare("
                    UPDATE models SET name = :name, display_name = :display_name, type = :type,
                        url = :url, model_name = :model_name, enabled = :enabled
                    WHERE id = :id
                ");
                $stmt->execute($data);
            });
            break;
        
        case 'delete_model':
            handleRequest(['id'], fn($data) => $pdo->prepare("DELETE FROM models WHERE id = :id")->execute($data));
            break;
            
    default:
        exitWithError('Неизвестное действие');   
}

function handleRequest(array $required, callable $callback) {
    global $input;
    $data = [];
    foreach ($required as $field) {
        if (!isset($input[$field]) || $input[$field] === '') {
            exitWithError("Поле {$field} обязательно");
        }
        $data[$field] = $input[$field];
    }
    $callback($data);
    echo json_encode(['success' => true]);
    exit;
}

function respondQuery($sql, $params, $key) {
    global $pdo;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    echo json_encode([$key => $stmt->fetchAll(PDO::FETCH_ASSOC) ?: []], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function exitWithError($message) {
    echo json_encode(['error' => $message]);
    exit;
}