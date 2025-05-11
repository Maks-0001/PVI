<?php
$servername = "localhost";
$username = "root";  // за замовчуванням у XAMPP
$password = "";      // без пароля у XAMPP
$dbname = "students";

// Створення з'єднання
$conn = new mysqli($servername, $username, $password, $dbname);

// Перевірка з'єднання
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
echo "Connected successfully";
