<?php
session_start();
require_once 'db.php';

$payment_id = $_SESSION['tariff_payment_id'] ?? null;
$user_id = $_SESSION['tariff_user_id'] ?? null;
$tariff_id = $_SESSION['tariff_id'] ?? null;

if (!$payment_id || !$user_id || !$tariff_id) {
    header("Location: /app.php");
    exit;
}

// Проверка статуса платежа
$shop_id = "1085154";
$secret_key = "test_kJZIMSD81HvcAXsZO54Tp9NYAwZvaLuvenxOgsqo5ak";

$ch = curl_init("https://api.yookassa.ru/v3/payments/$payment_id");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Basic ' . base64_encode("$shop_id:$secret_key"),
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
curl_close($ch);
$data = json_decode($response, true);

if (($data['status'] ?? '') === 'succeeded') {
    $stmt = $pdo->prepare("SELECT duration_days FROM tariffs WHERE id = :id");
    $stmt->execute(['id' => $tariff_id]);
    $duration = $stmt->fetchColumn();

    $now = date('Y-m-d H:i:s');
    $end = $duration ? date('Y-m-d H:i:s', strtotime("+$duration days")) : null;

    // Удаляем старые подписки
    $pdo->prepare("DELETE FROM subscriptions WHERE user_id = :uid")->execute(['uid' => $user_id]);

    $stmt = $pdo->prepare("INSERT INTO subscriptions (user_id, tariff_id, start_date, end_date, messages_used, last_reset_date)
        VALUES (:user_id, :tariff_id, :start_date, :end_date, 0, CURDATE())");
    $stmt->execute([
        'user_id' => $user_id,
        'tariff_id' => $tariff_id,
        'start_date' => $now,
        'end_date' => $end
    ]);
}

unset($_SESSION['tariff_payment_id'], $_SESSION['tariff_user_id'], $_SESSION['tariff_id']);
header("Location: /app.php");
exit;
?>