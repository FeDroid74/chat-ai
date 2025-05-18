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
            SELECT 
                messages.id, 
                chats.title AS chat_title, 
                users.username AS user_name, 
                messages.message, 
                messages.model_id, 
                messages.created_at
            FROM messages
            LEFT JOIN users ON users.id = messages.user_id
            LEFT JOIN chats ON chats.id = messages.chat_id
            ORDER BY messages.created_at DESC
        ", [], 'messages');
        break;

    case 'create_message':
        handleRequest(['chat_id', 'user_id', 'message'], function ($data) use ($pdo, $input) {
            $data['model_id'] = $input['model_id'] ?? null;
            $stmt = $pdo->prepare("INSERT INTO messages (chat_id, user_id, message, model_id) VALUES (:chat_id, :user_id, :message, :model_id)");
            $stmt->execute($data);
        });
        break;

    case 'update_message':
        handleRequest(['id', 'chat_id', 'user_id', 'message'], function ($data) use ($pdo, $input) {
            $data['model_id'] = $input['model_id'] ?? null;
            $stmt = $pdo->prepare("UPDATE messages SET chat_id = :chat_id, user_id = :user_id, message = :message, model_id = :model_id WHERE id = :id");
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
        handleRequest(['name', 'display_name', 'type', 'url', 'local_link', 'enabled'], function ($data) use ($pdo) {
            $stmt = $pdo->prepare("
                INSERT INTO models (name, display_name, type, url, local_link, enabled)
                VALUES (:name, :display_name, :type, :url, :local_link, :enabled)
            ");
            $stmt->execute($data);
        });
        break;
        
    case 'update_model':
        handleRequest(['id', 'name', 'display_name', 'type', 'url', 'local_link', 'enabled'], function ($data) use ($pdo) {
            $stmt = $pdo->prepare("
                UPDATE models SET name = :name, display_name = :display_name, type = :type,
                    url = :url, local_link = :local_link, enabled = :enabled
                WHERE id = :id
            ");
            $stmt->execute($data);
        });
        break;
        
    case 'delete_model':
        handleRequest(['id'], fn($data) => $pdo->prepare("DELETE FROM models WHERE id = :id")->execute($data));
        break;

    case 'get_tariffs':
        respondQuery("SELECT id, name, price, duration_days, message_limit FROM tariffs ORDER BY id DESC", [], 'tariffs');
        break;

    case 'create_tariff':
        handleRequest(['name', 'price'], function ($data) use ($pdo, $input) {
            $data['duration_days'] = $input['duration_days'] ?? null;
            $data['message_limit'] = $input['message_limit'] ?? null;
            $stmt = $pdo->prepare("
                INSERT INTO tariffs (name, price, duration_days, message_limit)
                VALUES (:name, :price, :duration_days, :message_limit)
            ");
            $stmt->execute($data);
        });
        break;

    case 'update_tariff':
        handleRequest(['id', 'name', 'price'], function ($data) use ($pdo, $input) {
            $data['duration_days'] = $input['duration_days'] ?? null;
            $data['message_limit'] = $input['message_limit'] ?? null;
            $stmt = $pdo->prepare("
                UPDATE tariffs SET name = :name, price = :price, duration_days = :duration_days, message_limit = :message_limit
                WHERE id = :id
            ");
            $stmt->execute($data);
        });
        break;

    case 'delete_tariff':
        handleRequest(['id'], fn($data) => $pdo->prepare("DELETE FROM tariffs WHERE id = :id")->execute($data));
        break;

    case 'get_subscriptions':
        respondQuery("
            SELECT 
                subscriptions.id, 
                users.username AS user_name, 
                tariffs.name AS tariff_name, 
                subscriptions.start_date, 
                subscriptions.end_date, 
                subscriptions.messages_used, 
                subscriptions.last_reset_date,
                subscriptions.user_id,
                subscriptions.tariff_id
            FROM subscriptions
            JOIN users ON users.id = subscriptions.user_id
            JOIN tariffs ON tariffs.id = subscriptions.tariff_id
            ORDER BY subscriptions.start_date DESC
        ", [], 'subscriptions');
        break;

    case 'create_subscription':
        handleRequest(['user_id', 'tariff_id', 'start_date'], function ($data) use ($pdo, $input) {
            $data['end_date'] = $input['end_date'] ?? null;
            $data['messages_used'] = $input['messages_used'] ?? 0;
            $data['last_reset_date'] = $input['last_reset_date'] ?? null;
            $stmt = $pdo->prepare("
                INSERT INTO subscriptions (user_id, tariff_id, start_date, end_date, messages_used, last_reset_date)
                VALUES (:user_id, :tariff_id, :start_date, :end_date, :messages_used, :last_reset_date)
            ");
            $stmt->execute($data);
        });
        break;

    case 'update_subscription':
        handleRequest(['id', 'user_id', 'tariff_id', 'start_date'], function ($data) use ($pdo, $input) {
            $data['end_date'] = $input['end_date'] ?? null;
            $data['messages_used'] = $input['messages_used'] ?? 0;
            $data['last_reset_date'] = $input['last_reset_date'] ?? null;
            $stmt = $pdo->prepare("
                UPDATE subscriptions SET 
                    user_id = :user_id, 
                    tariff_id = :tariff_id, 
                    start_date = :start_date, 
                    end_date = :end_date, 
                    messages_used = :messages_used, 
                    last_reset_date = :last_reset_date
                WHERE id = :id
            ");
            $stmt->execute($data);
        });
        break;

    case 'delete_subscription':
        handleRequest(['id'], fn($data) => $pdo->prepare("DELETE FROM subscriptions WHERE id = :id")->execute($data));
        break;

    case 'get_tariff_model_access':
        respondQuery("
            SELECT 
                tariff_model_access.tariff_id, 
                tariff_model_access.model_id, 
                tariffs.name AS tariff_name, 
                models.display_name AS local_link
            FROM tariff_model_access
            JOIN tariffs ON tariffs.id = tariff_model_access.tariff_id
            JOIN models ON models.id = tariff_model_access.model_id
            ORDER BY tariffs.name, models.display_name
        ", [], 'access');
        break;

    case 'create_tariff_model_access':
        handleRequest(['tariff_id', 'model_id'], function ($data) use ($pdo) {
            $stmt = $pdo->prepare("
                INSERT INTO tariff_model_access (tariff_id, model_id)
                VALUES (:tariff_id, :model_id)
            ");
            $stmt->execute($data);
        });
        break;

    case 'update_tariff_model_access':
        handleRequest(['old_tariff_id', 'old_model_id', 'tariff_id', 'model_id'], function ($data) use ($pdo) {
            $stmt = $pdo->prepare("
                UPDATE tariff_model_access 
                SET tariff_id = :tariff_id, model_id = :model_id
                WHERE tariff_id = :old_tariff_id AND model_id = :old_model_id
            ");
            $stmt->execute($data);
        });
        break;

    case 'delete_tariff_model_access':
        handleRequest(['tariff_id', 'model_id'], function ($data) use ($pdo) {
            $stmt = $pdo->prepare("
                DELETE FROM tariff_model_access 
                WHERE tariff_id = :tariff_id AND model_id = :model_id
            ");
            $stmt->execute($data);
        });
        break;

    default:
        exitWithError('Неизвестное действие');   
}

function handleRequest(array $required, callable $callback) {
    global $input;
    $data = [];
    foreach ($required as $field) {
        $value = $input[$field] ?? null;
        if (in_array($field, ['url', 'local_link', 'duration_days', 'message_limit', 'end_date', 'last_reset_date']) && ($value === '' || $value === null)) {
            $data[$field] = null;
        } elseif ($value === '' || $value === null) {
            exitWithError("Поле {$field} обязательно");
        } else {
            $data[$field] = $value;
        }
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