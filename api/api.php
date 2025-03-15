<?php
session_start();
require_once '../backend/db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Ошибка: авторизуйтесь']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Настройки API
$hfApiToken = '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'; // Токен Hugging Face
$yandexOauthToken = 'y0__xCJ1_BSGMHdEyCxz-vDEtCYuETMtlqsa5Q9V3Dzf1AfCxDa'; // OAuth-токен Yandex
$yandexFolderId = 'b1gm2isg5drni42fle6b'; // Folder ID Yandex
$yandexApiUrl = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';
$yandexOperationApiUrl = 'https://operation.api.cloud.yandex.net/operations/';

// Массив доступных моделей
$models = [
    'mixtral' => [
        'type' => 'huggingface',
        'url' => 'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
        'display_name' => 'Mixtral'
    ],
    'meta-llama/Llama-3-8B' => [ // Пример другой модели Hugging Face (замени на реальную модель, если хочешь)
        'type' => 'huggingface',
        'url' => 'https://api-inference.huggingface.co/models/meta-llama/Llama-3-8B',
        'display_name' => 'Llama 3'
    ],
    'yandexgpt' => [
        'type' => 'yandexgpt',
        'display_name' => 'YandexGPT'
    ]
];

// Получение IAM-токена для YandexGPT
function getIamToken($oauthToken) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://iam.api.cloud.yandex.net/iam/v1/tokens');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['yandexPassportOauthToken' => $oauthToken]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    
    $response = curl_exec($ch);
    if ($response === false) {
        file_put_contents('debug.log', "cURL Error (IAM Token): " . curl_error($ch) . "\n", FILE_APPEND);
        return false;
    }
    curl_close($ch);

    $result = json_decode($response, true);
    if (isset($result['iamToken'])) {
        return $result['iamToken'];
    } else {
        file_put_contents('debug.log', "IAM Token Error: " . print_r($response, true) . "\n", FILE_APPEND);
        return false;
    }
}

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? 'send_message';

// Получение информации о пользователе
if ($action === 'get_user_info') {
    $stmt = $pdo->prepare("SELECT username FROM user WHERE id = :user_id");
    $stmt->execute(['user_id' => $user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($user) {
        echo json_encode(['username' => $user['username']]);
    } else {
        echo json_encode(['error' => 'Пользователь не найден']);
    }
    exit;
}

// Получение списка чатов
if ($action === 'get_chats') {
    $stmt = $pdo->prepare("SELECT id, title FROM chats WHERE user_id = :user_id ORDER BY created_at DESC");
    $stmt->execute(['user_id' => $user_id]);
    $chats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['chats' => $chats]);
    exit;
}

// Создание нового чата
if ($action === 'create_chat') {
    $title = trim($input['title'] ?? 'Новый чат ' . date('Y-m-d H:i:s'));
    $stmt = $pdo->prepare("INSERT INTO chats (user_id, title) VALUES (:user_id, :title)");
    $stmt->execute(['user_id' => $user_id, 'title' => $title]);
    $chat_id = $pdo->lastInsertId();
    echo json_encode(['chat_id' => $chat_id, 'title' => $title]);
    exit;
}

// Получение истории сообщений
if ($action === 'get_history') {
    $chat_id = $input['chat_id'] ?? 0;
    if (!$chat_id) {
        echo json_encode(['error' => 'Укажите chat_id']);
        exit;
    }
    $stmt = $pdo->prepare("SELECT user_id, message FROM messages WHERE chat_id = :chat_id ORDER BY created_at ASC");
    $stmt->execute(['chat_id' => $chat_id]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['messages' => $messages]);
    exit;
}

// Отправка сообщения
if ($action === 'send_message') {
    $message = trim($input['message'] ?? '');
    $chat_id = $input['chat_id'] ?? 0;
    $model = $input['model'] ?? 'mistralai/Mixtral-8x7B-Instruct-v0.1'; // По умолчанию Mixtral

    if (empty($message)) {
        echo json_encode(['error' => 'Сообщение пустое']);
        exit;
    }

    // Проверяем, существует ли модель
    if (!isset($models[$model])) {
        echo json_encode(['error' => 'Неизвестная модель: ' . $model]);
        exit;
    }

    // Создаём новый чат, если не указан
    if (!$chat_id) {
        $stmt = $pdo->prepare("INSERT INTO chats (user_id, title) VALUES (:user_id, :title)");
        $stmt->execute(['user_id' => $user_id, 'title' => 'Чат ' . date('Y-m-d H:i:s')]);
        $chat_id = $pdo->lastInsertId();
    }

    // Сохраняем сообщение пользователя
    $stmt = $pdo->prepare("INSERT INTO messages (chat_id, user_id, message) VALUES (:chat_id, :user_id, :message)");
    $stmt->execute(['chat_id' => $chat_id, 'user_id' => $user_id, 'message' => $message]);

    $reply = null;
    $modelInfo = $models[$model];
    $displayName = $modelInfo['display_name'];

    if ($modelInfo['type'] === 'huggingface') {
        // Hugging Face API
        $formatted_message = "<s>[INST] Ты — экспертный ИИ, отвечай подробно, логично и на русском языке на вопрос: \"$message\" [/INST]";

        $payload = [
            'inputs' => $formatted_message,
            'parameters' => [
                'max_new_tokens' => 50,
                'temperature' => 0.1,
                'top_k' => 20,
                'top_p' => 0.7,
                'repetition_penalty' => 1.1,
                'do_sample' => false
            ]
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $modelInfo['url']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $hfApiToken,
            'Content-Type: application/json'
        ]);

        $response = curl_exec($ch);
        if ($response === false) {
            file_put_contents('debug.log', "cURL Error (Hugging Face - {$model}): " . curl_error($ch) . "\n", FILE_APPEND);
            echo json_encode(['error' => 'Ошибка генерации текста: ' . curl_error($ch)]);
            exit;
        }
        curl_close($ch);

        file_put_contents('debug.log', "Hugging Face Response ({$model}): " . $response . "\n", FILE_APPEND);

        $result = json_decode($response, true);
        if (isset($result[0]['generated_text'])) {
            $reply = trim(str_replace($formatted_message, '', $result[0]['generated_text']));
        } else {
            file_put_contents('debug.log', "Hugging Face Error ({$model}): " . print_r($response, true) . "\n", FILE_APPEND);
            echo json_encode(['error' => 'Ошибка генерации текста']);
            exit;
        }
    } elseif ($modelInfo['type'] === 'yandexgpt') {
        // YandexGPT API
        $iamToken = getIamToken($yandexOauthToken);
        if (!$iamToken) {
            echo json_encode(['error' => 'Ошибка получения IAM-токена']);
            exit;
        }

        $formatted_message = "Ответь кратко на русском: \"$message\"";
        $payload = [
            'modelUri' => "gpt://$yandexFolderId/yandexgpt-lite",
            'completionOptions' => [
                'stream' => false,
                'temperature' => 0.1,
                'maxTokens' => 50
            ],
            'messages' => [
                [
                    'role' => 'user',
                    'text' => $formatted_message
                ]
            ]
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $yandexApiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $iamToken,
            'Content-Type: application/json',
            'x-folder-id: ' . $yandexFolderId
        ]);

        $response = curl_exec($ch);
        if ($response === false) {
            file_put_contents('debug.log', "cURL Error (YandexGPT): " . curl_error($ch) . "\n", FILE_APPEND);
            echo json_encode(['error' => 'Ошибка генерации текста: ' . curl_error($ch)]);
            exit;
        }
        curl_close($ch);

        file_put_contents('debug.log', "YandexGPT Response: " . $response . "\n", FILE_APPEND);

        $result = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            file_put_contents('debug.log', "JSON Decode Error: " . json_last_error_msg() . "\nResponse: " . $response . "\n", FILE_APPEND);
            echo json_encode(['error' => 'Ошибка парсинга ответа от API']);
            exit;
        }

        if (isset($result['result'])) {
            if (isset($result['result']['alternatives'][0]['message']['text'])) {
                $reply = trim($result['result']['alternatives'][0]['message']['text']);
            } else {
                file_put_contents('debug.log', "YandexGPT Error: No text found in sync response. Response: " . print_r($result, true) . "\n", FILE_APPEND);
                echo json_encode(['error' => 'Ошибка генерации текста: пустой ответ']);
                exit;
            }
        } elseif (isset($result['id'])) {
            $operationId = $result['id'];
            $maxAttempts = 30;
            $attempt = 0;

            while ($attempt < $maxAttempts) {
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $yandexOperationApiUrl . $operationId);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Authorization: Bearer ' . $iamToken
                ]);

                $operationResponse = curl_exec($ch);
                if ($operationResponse === false) {
                    file_put_contents('debug.log', "cURL Error (Operation Check): " . curl_error($ch) . "\n", FILE_APPEND);
                    echo json_encode(['error' => 'Ошибка проверки операции']);
                    exit;
                }
                curl_close($ch);

                $operationResult = json_decode($operationResponse, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    file_put_contents('debug.log', "JSON Decode Error (Operation): " . json_last_error_msg() . "\nResponse: " . $operationResponse . "\n", FILE_APPEND);
                    echo json_encode(['error' => 'Ошибка парсинга статуса операции']);
                    exit;
                }

                if (isset($operationResult['done']) && $operationResult['done']) {
                    if (isset($operationResult['response']['alternatives'][0]['message']['text'])) {
                        $reply = trim($operationResult['response']['alternatives'][0]['message']['text']);
                        break;
                    } else {
                        file_put_contents('debug.log', "Operation Error: No text found. Response: " . print_r($operationResult, true) . "\n", FILE_APPEND);
                        echo json_encode(['error' => 'Ошибка генерации текста: пустой ответ']);
                        exit;
                    }
                }

                $attempt++;
                sleep(1);
            }

            if ($reply === null) {
                echo json_encode(['error' => 'Операция не завершилась вовремя']);
                exit;
            }
        } else {
            file_put_contents('debug.log', "YandexGPT Error: Neither result nor operation_id found. Response: " . print_r($result, true) . "\n", FILE_APPEND);
            echo json_encode(['error' => 'Ошибка генерации текста: нет ни результата, ни operation_id']);
            exit;
        }
    }

    if (empty($reply) || strlen($reply) < 5) {
        $reply = 'Не могу дать точный ответ, уточните вопрос.';
    }

    // Сохраняем ответ ИИ
    $stmt = $pdo->prepare("INSERT INTO messages (chat_id, user_id, message) VALUES (:chat_id, :user_id, :message)");
    $stmt->execute(['chat_id' => $chat_id, 'user_id' => 0, 'message' => $reply]);
    echo json_encode(['reply' => $reply, 'chat_id' => $chat_id, 'model' => $displayName]);
    exit;
}

echo json_encode(['error' => 'Неизвестное действие']);
?>