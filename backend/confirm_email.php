<?php
require_once 'db.php';

if (!isset($_GET['token'])) {
    echo "<h2>Ошибка</h2><p>Токен не предоставлен.</p>";
    exit;
}

$token = trim($_GET['token']);

// Проверяем, существует ли пользователь с таким токеном
try {
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email_verification_token = :token AND email_verified = 0");
    $stmt->execute(['token' => $token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // Обновляем статус верификации
        $stmt = $pdo->prepare("UPDATE users SET email_verified = 1, email_verification_token = NULL WHERE id = :id");
        $stmt->execute(['id' => $user['id']]);
        
        // Перенаправляем на страницу авторизации с параметром verified=true
        header("Location: /login.html?verified=true");
        exit;
    } else {
        echo "<h2>Ошибка</h2><p>Неверный или уже использованный токен.</p>";
    }
} catch (PDOException $e) {
    echo "<h2>Ошибка</h2><p>Ошибка: " . $e->getMessage() . "</p>";
}
?>