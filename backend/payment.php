<?php
session_start();
require_once 'db.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$tariff_id = intval($data['tariff_id'] ?? 0);
$user_id = $_SESSION['user_id'] ?? null;

if (!$user_id || !$tariff_id) {
    echo json_encode(['success' => false, 'message' => 'Недопустимый пользователь или тариф']);
    exit;
}

// Получение информации о тарифе
$stmt = $pdo->prepare("SELECT id, name, price FROM tariffs WHERE id = :id LIMIT 1");
$stmt->execute(['id' => $tariff_id]);
$tariff = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$tariff) {
    echo json_encode(['success' => false, 'message' => 'Тариф не найден']);
    exit;
}

// ЮKassa параметры
$shop_id = "1085154";
$secret_key = "test_kJZIMSD81HvcAXsZO54Tp9NYAwZvaLuvenxOgsqo5ak";
$idempotence_key = uniqid("tariff-", true);

$payment_data = [
    'amount' => [
        'value' => number_format($tariff['price'], 2, '.', ''),
        'currency' => 'RUB'
    ],
    'confirmation' => [
        'type' => 'redirect',
        'return_url' => 'http://localhost:8000/backend/confirm_payment.php'
    ],
    'capture' => true,
    'description' => 'Оплата тарифа: ' . $tariff['name'],
    'metadata' => [
        'user_id' => $user_id,
        'tariff_id' => $tariff['id']
    ]
];

$ch = curl_init('https://api.yookassa.ru/v3/payments');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Basic ' . base64_encode("$shop_id:$secret_key"),
    'Content-Type: application/json',
    'Idempotence-Key: ' . $idempotence_key
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payment_data));

$response = curl_exec($ch);
curl_close($ch);

$response_data = json_decode($response, true);

if (isset($response_data['confirmation']['confirmation_url'])) {
    $_SESSION['tariff_payment_id'] = $response_data['id'];
    $_SESSION['tariff_user_id'] = $user_id;
    $_SESSION['tariff_id'] = $tariff['id'];

    echo json_encode([
        'success' => true,
        'payment_url' => $response_data['confirmation']['confirmation_url']
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Ошибка создания платежа',
        'debug' => $response_data
    ]);
}
?>