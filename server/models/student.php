<?php
require_once __DIR__ . '/../core/config.php';

class Student
{
    public static function loadContent()
    {
        // Виключаємо студента з id=0
        $sql = "SELECT * FROM students WHERE id != 0";
        $conn = Database::getConnection();
        $result = $conn->query($sql);

        $students = [];
        if ($result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $students[] = $row;
            }
        }

        header('Content-Type: application/json');
        echo json_encode($students);
    }

    public static function addStudent()
    {
        include __DIR__ . '/../services/validation_root.php';

        $conn = Database::getConnection();

        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Invalid input data"]);
            exit;
        }

        // Валідація даних
        $validationResult = validateStudentData($conn, $data);
        if ($validationResult !== true) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => $validationResult]);
            exit;
        }

        $group_name = $data['group_name'];
        $first_name = $data['firstName'];
        $last_name = $data['lastName'];
        $gender = $data['gender'];
        $birthday = $data['birthday'];
        $password = $data['password'];

        $sql = "INSERT INTO students (group_name, first_name, last_name, gender, birthday, status, password) 
            VALUES ('$group_name', '$first_name', '$last_name', '$gender', '$birthday', 1, '$password')";

        if ($conn->query($sql) === TRUE) {
            echo json_encode(["success" => true, "id" => $conn->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => $conn->error]);
        }
    }

    public static function deleteStudent()
    {

        $conn = Database::getConnection();

        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'];

        $sql = "DELETE FROM students WHERE id = $id";

        if ($conn->query($sql) === TRUE)
            echo json_encode(["success" => true]);
        else
            echo json_encode(["success" => false, "error" => $conn->error]);
    }

    public static function updateStudent()
    {
        $conn = Database::getConnection();

        include __DIR__ . '/../services/validation_root.php';

        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Invalid input data"]);
            exit;
        }

        $id = $data['id'];

        // Валідація даних
        $validationResult = validateStudentData($conn, $data, $id);
        if ($validationResult !== true) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => $validationResult]);
            exit;
        }

        $group_name = $data['group_name'];
        $first_name = $data['firstName'];
        $last_name = $data['lastName'];
        $gender = $data['gender'];
        $birthday = $data['birthday'];

        $sql = "UPDATE students 
            SET group_name = '$group_name', first_name = '$first_name', last_name = '$last_name', gender = '$gender', birthday = '$birthday'
            WHERE id = $id";

        if ($conn->query($sql) === TRUE) {
            echo json_encode(["success" => true]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => $conn->error]);
        }
    }

    public static function deleteAllStudents()
    {
        $conn = Database::getConnection();


        $data = json_decode(file_get_contents('php://input'), true);
        $ids = $data['ids'];

        if (empty($ids)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "No student IDs provided"]);
            exit;
        }

        $idList = implode(',', array_map('intval', $ids)); // Перетворюємо масив ID у рядок
        $sql = "DELETE FROM students WHERE id IN ($idList)";

        if ($conn->query($sql) === TRUE) {
            echo json_encode(["success" => true]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => $conn->error]);
        }
    }
}
