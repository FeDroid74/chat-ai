<?php
header('Content-Type: application/json');

$apiToken = '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'; // Ваш токен
$apiUrl = 'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1';

$input = json_decode(file_get_contents('php://input'), true);
$message = $input['message'] ?? '';

if (empty($message)) {
    echo json_encode(['reply' => 'Ошибка: сообщение пустое']);
    exit;
}

// Инструкция для серьёзных вопросов на русском
$formatted_message = "<s>[INST] Ты — экспертный ИИ, отвечай подробно, логично и на русском языке на вопрос: \"$message\" [/INST]";

$payload = [
    'inputs' => $formatted_message,
    'parameters' => [
        'max_length' => 200,           // Больше текста для глубоких ответов
        'temperature' => 0.6,          // Меньше случайности, больше точности
        'top_k' => 40,                 // Разнообразие
        'top_p' => 0.9,                // Фильтрация
        'repetition_penalty' => 1.3,   // Избегаем повторов
        'do_sample' => true            // Естественность
    ]
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiToken,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);

if ($response === false) {
    echo json_encode(['reply' => 'Ошибка cURL: ' . curl_error($ch)]);
    curl_close($ch);
    exit;
}

curl_close($ch);

// Отладка
file_put_contents('debug.log', "Raw response: " . $response . "\n", FILE_APPEND);

$result = json_decode($response, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(['reply' => 'Ошибка: Неверный JSON от API', 'raw_response' => $response]);
    exit;
}

if (isset($result[0]['generated_text'])) {
    $generated_text = $result[0]['generated_text'];
    $reply = trim(str_replace($formatted_message, '', $generated_text));
    if (empty($reply) || strlen($reply) < 10) {
        $reply = 'Не могу дать точный ответ, уточните вопрос.';
    }
} elseif (isset($result['error'])) {
    $reply = 'Ошибка API: ' . $result['error'];
} else {
    $reply = 'Ошибка при генерации текста: неизвестный формат ответа';
    file_put_contents('debug.log', "Result: " . print_r($result, true) . "\n", FILE_APPEND);
}

echo json_encode(['reply' => $reply]);
?>