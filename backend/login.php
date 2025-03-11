<?php
session_start();
require_once 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Метод не поддерживается']);
    exit;
}

$email = trim($_POST['email'] ?? '');
$password = trim($_POST['password'] ?? '');

if (empty($email) || empty($password)) {
    echo json_encode(['error' => 'Все поля обязательны']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM user WHERE email = :email");
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && $user['password'] === $password) {
        $_SESSION['user_id'] = $user['id'];
        echo json_encode(['message' => 'Вход успешен!']);
    } else {
        echo json_encode(['error' => 'Неверный email или пароль']);
    }
} catch (PDOException $e) {
    echo json_encode(['error' => 'Ошибка: ' . $e->getMessage()]);
}
?>