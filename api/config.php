<?php
// Настройки API
$hfApiToken = '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';
$yandexOauthToken = 'y0__xCJ1_BSGMHdEyCxz-vDEtCYuETMtlqsa5Q9V3Dzf1AfCxDa';
$yandexFolderId = 'b1gm2isg5drni42fle6b';
$yandexApiUrl = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';
$yandexOperationApiUrl = 'https://operation.api.cloud.yandex.net/operations/';
$ioNetApiKey = 'io-v2-eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJvd25lciI6IjBlOTBmMWEzLTJmMzEtNDkwMy1hYTNiLWMxZjQyY2MyZDlkOSIsImV4cCI6NDg5NTc2MTE5Mn0.OPlYgcT87Mj2YI-I-UfrNsRWkKqWeSTHLbxZjaf3-bFk9svoAhX6ER5J1uSkCh9q12wGTzG2euLzdnlQ_3v1Dg';
$openRouterApiKey = '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';

// Функция загрузки моделей из БД
function loadModels(PDO $pdo): array {
    $stmt = $pdo->prepare("SELECT * FROM models WHERE enabled = 1");
    $stmt->execute();
    $modelsFromDb = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $models = [];
    foreach ($modelsFromDb as $model) {
        $models[$model['name']] = [
            'type' => $model['type'],
            'display_name' => $model['display_name']
        ];

        if (!empty($model['url'])) {
            $models[$model['name']]['url'] = $model['url'];
        }

        if (!empty($model['local_link'])) {
            $models[$model['name']]['local_link'] = $model['local_link'];
        }
    }

    return $models;
}
?>