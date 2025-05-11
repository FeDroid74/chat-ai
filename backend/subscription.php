<?php
function getActiveSubscription(PDO $pdo, int $userId): ?array {
    $stmt = $pdo->prepare("
        SELECT s.*, t.message_limit
        FROM subscriptions s
        JOIN tariffs t ON s.tariff_id = t.id
        WHERE s.user_id = :user_id
          AND (s.end_date IS NULL OR NOW() <= s.end_date)
        LIMIT 1
    ");
    $stmt->execute(['user_id' => $userId]);
    return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
}

function resetLimitIfNeeded(PDO $pdo, array &$subscription): void {
    $today = date('Y-m-d');
    if ($subscription['last_reset_date'] !== $today) {
        $stmt = $pdo->prepare("UPDATE subscriptions SET messages_used = 0, last_reset_date = :today WHERE id = :id");
        $stmt->execute(['today' => $today, 'id' => $subscription['id']]);
        $subscription['messages_used'] = 0;
        $subscription['last_reset_date'] = $today;
    }
}

function incrementUsage(PDO $pdo, int $subscriptionId): void {
    $stmt = $pdo->prepare("UPDATE subscriptions SET messages_used = messages_used + 1 WHERE id = :id");
    $stmt->execute(['id' => $subscriptionId]);
}

function isModelAllowed(PDO $pdo, int $tariffId, int $modelId): bool {
    $stmt = $pdo->prepare("
        SELECT 1
        FROM tariff_model_access
        WHERE tariff_id = :tariff_id AND model_id = :model_id
        LIMIT 1
    ");
    $stmt->execute(['tariff_id' => $tariffId, 'model_id' => $modelId]);
    return (bool) $stmt->fetchColumn();
}