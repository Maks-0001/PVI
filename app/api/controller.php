    <?php
    require_once '../../server/models/student.php';

    $action = $_GET['action'] ?? '';

    switch ($action) {
        case 'load':
            Student::loadContent();
            break;
        case 'add':
            Student::addStudent();
            break;
        case 'delete':
            Student::deleteStudent();
            break;
        case 'update':
            Student::updateStudent();
            break;
        case 'deleteAll':
            Student::deleteAllStudents();
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
            break;
    }
