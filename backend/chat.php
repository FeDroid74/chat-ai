<?php
require_once 'db.php';

function handleChatAction($action, $user_id, $input, $pdo) {
    header('Content-Type: application/json');

    if ($action === 'get_chats') {
        $stmt = $pdo->prepare("SELECT id, title FROM chats WHERE user_id = :user_id ORDER BY created_at DESC");
        $stmt->execute(['user_id' => $user_id]);
        $chats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['chats' => $chats]);
        exit;
    }

    if ($action === 'create_chat') {
        $title = trim($input['title'] ?? 'Новый чат ' . date('Y-m-d H:i:s'));
        $stmt = $pdo->prepare("INSERT INTO chats (user_id, title) VALUES (:user_id, :title)");
        $stmt->execute(['user_id' => $user_id, 'title' => $title]);
        $chat_id = $pdo->lastInsertId();
        echo json_encode(['chat_id' => $chat_id, 'title' => $title]);
        exit;
    }

    if ($action === 'get_history') {
        $chat_id = $input['chat_id'] ?? 0;
        if (!$chat_id) {
            echo json_encode(['error' => 'Укажите chat_id']);
            exit;
        }

        // Обновлённый запрос с JOIN к models, чтобы получить display_name
        $stmt = $pdo->prepare("
            SELECT 
                m.user_id, 
                m.message, 
                mo.display_name AS model 
            FROM messages m
            LEFT JOIN models mo ON m.model_id = mo.id
            WHERE m.chat_id = :chat_id
            ORDER BY m.created_at ASC
        ");
        $stmt->execute(['chat_id' => $chat_id]);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['messages' => $messages]);
        exit;
    }

    if ($action === 'rename_chat') {
        $chat_id = $input['chat_id'] ?? 0;
        $new_title = trim($input['new_title'] ?? '');

        if (!$chat_id || !$new_title) {
            echo json_encode(['error' => 'Укажите chat_id и новое название']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT user_id FROM chats WHERE id = :chat_id");
        $stmt->execute(['chat_id' => $chat_id]);
        $chat = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$chat || $chat['user_id'] != $user_id) {
            echo json_encode(['error' => 'Чат не найден или доступ запрещён']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE chats SET title = :title WHERE id = :chat_id");
        $stmt->execute(['title' => $new_title, 'chat_id' => $chat_id]);
        echo json_encode(['success' => true, 'new_title' => $new_title]);
        exit;
    }

    if ($action === 'delete_chat') {
        $chat_id = $input['chat_id'] ?? 0;

        if (!$chat_id) {
            echo json_encode(['error' => 'Укажите chat_id']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT user_id FROM chats WHERE id = :chat_id");
        $stmt->execute(['chat_id' => $chat_id]);
        $chat = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$chat || $chat['user_id'] != $user_id) {
            echo json_encode(['error' => 'Чат не найден или доступ запрещён']);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM messages WHERE chat_id = :chat_id");
        $stmt->execute(['chat_id' => $chat_id]);

        $stmt = $pdo->prepare("DELETE FROM chats WHERE id = :chat_id");
        $stmt->execute(['chat_id' => $chat_id]);

        echo json_encode(['success' => true]);
        exit;
    }

    echo json_encode(['error' => 'Неизвестное действие']);
    exit;
}
?>