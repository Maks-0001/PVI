<?php
session_start();
require_once __DIR__ . '/../core/config.php';


function login($username, $password)
{
    $sql = "SELECT id, password FROM students WHERE first_name = ?";
    $conn = Database::getConnection();
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        return ["success" => false, "error" => "Invalid username or password."];
    }

    $row = $result->fetch_assoc();
    $storedPassword = $row['password'];

    // Перевірка паролю
    if ($storedPassword !== $password) {
        return ["success" => false, "error" => "Invalid username or password."];
    }

    // Запис даних у сесію
    $_SESSION['user_id'] = $row['id'];
    $_SESSION['username'] = $username;
    $_SESSION['logged_in'] = true;

    return ["success" => true, "username" => $username];
}

// Обробка запиту
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['username']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Invalid input data."]);
        exit;
    }

    $username = $data['username'];
    $password = $data['password'];

    $response = login($username, $password);
    echo json_encode($response);
    exit;
}
