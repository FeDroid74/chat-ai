<?php
// Настройки API
$hfApiToken = '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'; // Токен Hugging Face
$yandexOauthToken = 'y0__xCJ1_BSGMHdEyCxz-vDEtCYuETMtlqsa5Q9V3Dzf1AfCxDa'; // OAuth-токен Yandex
$yandexFolderId = 'b1gm2isg5drni42fle6b'; // Folder ID Yandex
$yandexApiUrl = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';
$yandexOperationApiUrl = 'https://operation.api.cloud.yandex.net/operations/';
$ioNetApiKey = 'io-v2-eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJvd25lciI6IjBlOTBmMWEzLTJmMzEtNDkwMy1hYTNiLWMxZjQyY2MyZDlkOSIsImV4cCI6NDg5NTc2MTE5Mn0.OPlYgcT87Mj2YI-I-UfrNsRWkKqWeSTHLbxZjaf3-bFk9svoAhX6ER5J1uSkCh9q12wGTzG2euLzdnlQ_3v1Dg'; // API-ключ io.net
$openRouterApiKey = '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';

// Массив доступных моделей
$models = [
    'mixtral' => [
        'type' => 'huggingface',
        'url' => 'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
        'display_name' => 'Mixtral'
    ],
    'mistral' => [
        'type' => 'ionet',
        'model_name' => 'mistralai/Mistral-Large-Instruct-2411',
        'display_name' => 'Mistral'
    ],
    'yandexgpt' => [
        'type' => 'yandexgpt',
        'display_name' => 'YandexGPT'
    ],
    'llama' => [
        'type' => 'ionet',
        'model_name' => 'meta-llama/Llama-3.3-70B-Instruct',
        'display_name' => 'Llama'
    ],
    'deepseek' => [
        'type' => 'ionet',
        'model_name' => 'deepseek-ai/DeepSeek-R1',
        'display_name' => 'DeepSeek'
    ],
    'qwen' => [
        'type' => 'ionet',
        'model_name' => 'Qwen/QwQ-32B',
        'display_name' => 'Qwen'
    ],
    'gemma' => [
        'type' => 'openrouter',
        'model_name' => 'google/gemma-2-9b-it:free',
        'display_name' => 'Gemma'
    ]
];
?>