<?php
$file = __DIR__ . '/../api/debug.log';

if (file_exists($file)) {
    header('Content-Description: File Transfer');
    header('Content-Type: text/plain');
    header('Content-Disposition: attachment; filename="debug.log"');
    header('Content-Length: ' . filesize($file));
    readfile($file);
    exit;
} else {
    http_response_code(404);
    echo "Файл не найден.";
}
?>