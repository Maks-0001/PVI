<?php
session_start();
require_once __DIR__ . '/../core/config.php'; //

// Функція для генерації простого токена
function generateSimpleToken($userId)
{
    // Можна додати user_id до токена для простоти або просто унікальний рядок
    // Для безпеки, в реальному додатку, токен має бути більш складним і мати час життя
    return hash('sha256', $userId . session_id() . time() . random_bytes(16));
}

function login($username, $password)
{
    $sql = "SELECT id, password FROM students WHERE first_name = ?"; //
    $conn = Database::getConnection(); //
    $stmt = $conn->prepare($sql); //
    $stmt->bind_param("s", $username); //
    $stmt->execute(); //
    $result = $stmt->get_result(); //

    if ($result->num_rows === 0) {
        return ["success" => false, "error" => "Invalid username or password."]; //
    }

    $row = $result->fetch_assoc(); //
    $storedPassword = $row['password']; //

    // Перевірка паролю
    if ($storedPassword !== $password) { //
        return ["success" => false, "error" => "Invalid username or password."]; //
    }

    // Запис даних у сесію
    $_SESSION['user_id'] = $row['id']; //
    $_SESSION['username'] = $username; //
    $_SESSION['logged_in'] = true; //

    // Генерація та збереження токена для чату
    $chat_token = generateSimpleToken($row['id']);
    $_SESSION['chat_token'] = $chat_token; // Зберігаємо в сесії, якщо потрібно для PHP
    // Або можна зберігати в базі даних (user_id, chat_token, expires_at)

    return ["success" => true, "username" => $username, "user_id" => $row['id'], "chat_token" => $chat_token]; //
}

// Обробка запиту
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'login') { //
    $data = json_decode(file_get_contents('php://input'), true); //

    if (!isset($data['username']) || !isset($data['password'])) { //
        http_response_code(400); //
        echo json_encode(["success" => false, "error" => "Invalid input data."]); //
        exit; //
    }

    $username = $data['username']; //
    $password = $data['password']; //

    $response = login($username, $password); //
    echo json_encode($response); //
    exit; //
}

// Додамо простий ендпоінт для валідації токена (якщо Node.js буде робити HTTP запит)
// Це лише приклад, можливо, краще використовувати JWT або спільну БД/кеш
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'validate_token') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (isset($data['token']) && isset($_SESSION['user_id']) && isset($_SESSION['chat_token']) && $data['token'] === $_SESSION['chat_token']) {
        // Тут можна додати перевірку часу життя токена, якщо він зберігається в БД
        echo json_encode(["success" => true, "user_id" => $_SESSION['user_id'], "username" => $_SESSION['username']]);
    } else {
        echo json_encode(["success" => false, "error" => "Invalid or expired token."]);
    }
    exit;
}
