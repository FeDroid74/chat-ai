<?php
require_once 'db.php';

function handleUserAction($action, $user_id, $pdo) {
    header('Content-Type: application/json');

    if ($action === 'get_user_info') {
        $stmt = $pdo->prepare("SELECT username, role FROM users WHERE id = :user_id");
        $stmt->execute(['user_id' => $user_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($user) {
            echo json_encode(['username' => $user['username'], 'role' => $user['role']]);
        } else {
            echo json_encode(['error' => 'Пользователь не найден']);
        }
        exit;
    }

    echo json_encode(['error' => 'Неизвестное действие']);
    exit;
}
?>