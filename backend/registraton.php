<?php
require_once './backend/db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Метод не поддерживается']);
    exit;
}

$username = trim($_POST['username'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = trim($_POST['password'] ?? '');

if (empty($username) || empty($email) || empty($password)) {
    echo json_encode(['error' => 'Все поля обязательны']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO user (username, email, password) VALUES (:username, :email, :password)");
    $stmt->execute([
        'username' => $username,
        'email' => $email,
        'password' => password_hash($password, PASSWORD_DEFAULT)
    ]);
    echo json_encode(['message' => 'Регистрация успешна!']);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Ошибка: ' . $e->getMessage()]);
}
?>