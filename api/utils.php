<?php
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
?>