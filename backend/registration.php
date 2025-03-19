<?php
require_once 'db.php';

header('Content-Type: application/json');

// Подключение autoload.php для использования PHPMailer
require '../vendor/autoload.php'; // Подключаем автозагрузчик Composer

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Метод не поддерживается']);
    exit;
}

$username = trim($_POST['username'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = trim($_POST['password'] ?? '');
$confirm_password = trim($_POST['confirm_password'] ?? '');

// Проверка на пустые поля
if (empty($username) || empty($email) || empty($password) || empty($confirm_password)) {
    echo json_encode(['error' => 'Все поля обязательны']);
    exit;
}

// Проверка email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['error' => 'Неверный формат email']);
    exit;
}

// Проверка имени пользователя
// Разрешены только буквы, цифры и подчеркивания, длина от 3 до 20 символов
if (!preg_match('/^[a-zA-Z0-9_]{3,20}$/', $username)) {
    echo json_encode(['error' => 'Имя пользователя должно содержать только буквы, цифры и подчеркивания, длина от 3 до 20 символов']);
    exit;
}

// Проверка пароля
// Минимум 8 символов
if (strlen($password) < 8) {
    echo json_encode(['error' => 'Пароль должен содержать минимум 8 символов']);
    exit;
}

// Проверка совпадения паролей
if ($password !== $confirm_password) {
    echo json_encode(['error' => 'Пароли не совпадают']);
    exit;
}

// Проверка на уникальность username и email
$stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = :username OR email = :email");
$stmt->execute(['username' => $username, 'email' => $email]);
if ($stmt->fetchColumn() > 0) {
    echo json_encode(['error' => 'Имя пользователя или адрес электронной почты уже заняты']);
    exit;
}

try {
    // Генерация уникального токена для подтверждения email
    $email_verification_token = bin2hex(random_bytes(16));
    $email_verified = 0; // По умолчанию email не подтверждён

    // Сохраняем пользователя в базе данных
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password, email_verified, email_verification_token) VALUES (:username, :email, :password, :email_verified, :email_verification_token)");
    $stmt->execute([
        'username' => $username,
        'email' => $email,
        'password' => $password,
        'email_verified' => $email_verified,
        'email_verification_token' => $email_verification_token
    ]);

    // Отправка письма с подтверждением через PHPMailer
    $verification_link = "http://localhost/backend/confirm_email.php?token=$email_verification_token";
    $subject = "Подтверждение регистрации";
    $message = "Здравствуйте, $username! Пожалуйста, подтвердите Ваш адрес электронной почты, перейдя по ссылке: <a href='$verification_link'>$verification_link</a>";

    $mail = new PHPMailer(true);

    try {
        // Настройки сервера
        $mail->Mailer = 'smtp';
        $mail->Host = 'smtp.yandex.ru';
        $mail->SMTPSecure = 'ssl';
        $mail->Port = 465;
        $mail->SMTPAuth = true;
        $mail->SMTPAutoTLS = false;
        $mail->Username = 'fedorpopov7@yandex.ru';
        $mail->Password = 'lysapbuzsemjaoeo';
        $mail->CharSet = 'UTF-8';

        // Адрес отправителя
        $mail->setFrom('fedorpopov7@yandex.ru', 'Your App Name');
        // Адрес получателя
        $mail->addAddress($email);

        // Содержание письма
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $message;

        $mail->send();
        echo json_encode(['message' => 'Регистрация прошла успешно! Подтвердите Ваш адрес электронной почты, чтобы войти.']);
    } catch (Exception $e) {
        // Если письмо не отправилось, всё равно сообщаем об успешной регистрации, но с предупреждением
        echo json_encode(['message' => 'Регистрация прошла успешно, но не удалось отправить письмо для подтверждения адреса электронной почты: ' . $mail->ErrorInfo]);
    }
} catch (PDOException $e) {
    echo json_encode(['error' => 'Ошибка: ' . $e->getMessage()]);
}
?>