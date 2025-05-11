<?php
include 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

$group_name = $data['group'];
$first_name = $data['firstName'];
$last_name = $data['lastName'];
$gender = $data['gender'];
$birthday = $data['birthday'];

$sql = "INSERT INTO students (group_name, first_name, last_name, gender, birthday, status) 
        VALUES ('$group_name', '$first_name', '$last_name', '$gender', '$birthday', 1)";

if ($conn->query($sql) === TRUE) {
    echo json_encode(["success" => true, "id" => $conn->insert_id]);
} else {
    echo json_encode(["success" => false, "error" => $conn->error]);
}
