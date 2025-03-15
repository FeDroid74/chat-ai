<?php
session_start();
session_destroy(); // Завершение сессии
header('Location: ../login.html'); // Перенаправление на страницу входа
exit();
?>