<?php
require_once 'db.php';
require_once '../api/config.php';
require_once '../api/utils.php';

function handleMessageAction($action, $user_id, $input, $pdo, $models, $hfApiToken, $yandexOauthToken, $yandexApiUrl, $yandexOperationApiUrl, $yandexFolderId, $ioNetApiKey, $openRouterApiKey) {
    header('Content-Type: application/json');

    if ($action === 'send_message') {
        $message = trim($input['message'] ?? '');
        $chat_id = $input['chat_id'] ?? 0;
        $model = $input['model'] ?? 'mixtral'; // По умолчанию Mixtral

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
            $formatted_message = "<s>[INST] Ты — экспертный ИИ, отвечай подробно, логично и на русском языке, предоставляя развернутые объяснения и примеры, если это уместно. Вопрос: \"$message\" [/INST]";

            $payload = [
                'inputs' => $formatted_message,
                'parameters' => [
                    'max_new_tokens' => 300,
                    'temperature' => 0.7,
                    'top_k' => 50,
                    'top_p' => 0.9,
                    'repetition_penalty' => 1.2,
                    'do_sample' => true
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

            $formatted_message = "Ты — экспертный ИИ. Отвечай подробно, логично и на русском языке, предоставляя развернутые объяснения и примеры, если это уместно. Вопрос: \"$message\"";
            $payload = [
                'modelUri' => "gpt://$yandexFolderId/yandexgpt-lite",
                'completionOptions' => [
                    'stream' => false,
                    'temperature' => 0.7,
                    'maxTokens' => 300
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
        } elseif ($modelInfo['type'] === 'ionet') {
            // io.net API
            $formatted_message = "Отвечай на русском языке на вопрос. Вопрос: \"$message\"";
            $payload = [
                'model' => $modelInfo['model_name'],
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => $formatted_message
                    ]
                ],
                'max_completion_tokens' => 300
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'https://api.intelligence.io.solutions/api/v1/chat/completions');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $ioNetApiKey,
                'Content-Type: application/json'
            ]);

            $response = curl_exec($ch);
            if ($response === false) {
                file_put_contents('debug.log', "cURL Error (io.net - {$model}): " . curl_error($ch) . "\n", FILE_APPEND);
                echo json_encode(['error' => 'Ошибка генерации текста: ' . curl_error($ch)]);
                exit;
            }
            curl_close($ch);

            file_put_contents('debug.log', "io.net Raw Response ({$model}): " . $response . "\n", FILE_APPEND);

            $result = json_decode($response, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                file_put_contents('debug.log', "JSON Decode Error (io.net): " . json_last_error_msg() . "\nResponse: " . $response . "\n", FILE_APPEND);
                echo json_encode(['error' => 'Ошибка парсинга ответа от API io.net']);
                exit;
            }

            file_put_contents('debug.log', "io.net Parsed Response ({$model}): " . print_r($result, true) . "\n", FILE_APPEND);

            if (isset($result['choices'][0]['message']['content'])) {
                $reply = trim($result['choices'][0]['message']['content']);
            } elseif (isset($result['error'])) {
                file_put_contents('debug.log', "io.net Error Response: " . print_r($result['error'], true) . "\n", FILE_APPEND);
                echo json_encode(['error' => 'Ошибка io.net: ' . ($result['error']['message'] ?? 'Неизвестная ошибка')]);
                exit;
            } else {
                file_put_contents('debug.log', "io.net Error: No content or error found. Response: " . print_r($result, true) . "\n", FILE_APPEND);
                echo json_encode(['error' => 'Ошибка генерации текста: пустой ответ от io.net']);
                exit;
            }
        } elseif ($modelInfo['type'] === 'openrouter') {
            // OpenRouter API
            $formatted_message = "Ты — экспертный ИИ. Отвечай подробно, логично и на русском языке, предоставляя развернутые объяснения и примеры, если это уместно. Вопрос: \"$message\"";
            $payload = [
                'model' => $modelInfo['model_name'],
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => $formatted_message
                    ]
                ],
                'max_tokens' => 300,
                'temperature' => 0.7
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'https://openrouter.ai/api/v1/chat/completions'); // Исправляем URL
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $openRouterApiKey,
                'Content-Type: application/json',
                'HTTP-Referer: http://localhost:8000', // OpenRouter требует этот заголовок
                'X-Title: Chat App' // Рекомендуется для идентификации приложения
            ]);

            $response = curl_exec($ch);
            if ($response === false) {
                file_put_contents('debug.log', "cURL Error (OpenRouter - {$model}): " . curl_error($ch) . "\n", FILE_APPEND);
                echo json_encode(['error' => 'Ошибка генерации текста: ' . curl_error($ch)]);
                exit;
            }
            curl_close($ch);

            file_put_contents('debug.log', "OpenRouter Raw Response ({$model}): " . $response . "\n", FILE_APPEND);

            $result = json_decode($response, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                file_put_contents('debug.log', "JSON Decode Error (OpenRouter): " . json_last_error_msg() . "\nResponse: " . $response . "\n", FILE_APPEND);
                echo json_encode(['error' => 'Ошибка парсинга ответа от API OpenRouter']);
                exit;
            }

            file_put_contents('debug.log', "OpenRouter Parsed Response ({$model}): " . print_r($result, true) . "\n", FILE_APPEND);

            if (isset($result['choices'][0]['message']['content'])) {
                $reply = trim($result['choices'][0]['message']['content']);
            } elseif (isset($result['error'])) {
                file_put_contents('debug.log', "OpenRouter Error Response: " . print_r($result['error'], true) . "\n", FILE_APPEND);
                echo json_encode(['error' => 'Ошибка OpenRouter: ' . ($result['error']['message'] ?? 'Неизвестная ошибка')]);
                exit;
            } else {
                file_put_contents('debug.log', "OpenRouter Error: No content or error found. Response: " . print_r($result, true) . "\n", FILE_APPEND);
                echo json_encode(['error' => 'Ошибка генерации текста: пустой ответ от OpenRouter']);
                exit;
            }
        }

        if (empty($reply) || strlen($reply) < 10) {
            $reply = 'К сожалению, я не смог дать подробный ответ на ваш вопрос. Пожалуйста, уточните его или задайте другой вопрос, и я постараюсь помочь вам более детально!';
        }

        // Сохраняем ответ ИИ
        $stmt = $pdo->prepare("INSERT INTO messages (chat_id, user_id, message, model) VALUES (:chat_id, :user_id, :message, :model)");
        $stmt->execute(['chat_id' => $chat_id, 'user_id' => 0, 'message' => $reply, 'model' => $displayName]);
        echo json_encode(['reply' => $reply, 'chat_id' => $chat_id, 'model' => $displayName]);
        exit;
    }

    echo json_encode(['error' => 'Неизвестное действие']);
    exit;
}
?>