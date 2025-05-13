<?php

function validateName($name)
{
    // Перевірка: тільки латина, перша буква велика, далі маленькі, допускається один апостроф або дефіс, максимум 11 символів
    $pattern = "/^[A-Z][a-z'-]{0,10}$/";
    if (!preg_match($pattern, $name)) {
        return "Name must start with a capital letter, contain only English letters, apostrophes or hyphens, and be no longer than 11 characters.";
    }
    return true;
}

function validateLastName($lastName)
{
    // Перевірка: тільки латина, перша буква велика, далі маленькі, допускається один апостроф або дефіс, максимум 11 символів
    $pattern = "/^[A-Z][a-z'-]{0,10}$/";
    if (!preg_match($pattern, $lastName)) {
        return "Last name must start with a capital letter, contain only English letters, apostrophes or hyphens, and be no longer than 11 characters.";
    }
    return true;
}

function validateBirthday($birthday)
{
    // Перевірка: рік народження має бути в межах від 2000 до 2006
    $year = (int)date('Y', strtotime($birthday));
    if ($year < 2000 || $year > 2006) {
        return "Birthday must be between 2000 and 2006.";
    }
    return true;
}

function isDuplicateName($conn, $firstName, $excludeId = null)
{
    // Перевірка на дублікати імен у базі даних
    $sql = "SELECT id FROM students WHERE first_name = ?";
    $params = [$firstName];

    if ($excludeId !== null) {
        $sql .= " AND id != ?";
        $params[] = $excludeId;
    }

    $stmt = $conn->prepare($sql);
    $stmt->bind_param(str_repeat('s', count($params)), ...$params);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        return "A student with the same first name already exists.";
    }
    return true;
}

function validateStudentData($conn, $data, $excludeId = null)
{
    // Валідація імені
    $nameValidation = validateName($data['firstName']);
    if ($nameValidation !== true) {
        return $nameValidation;
    }

    // Валідація прізвища
    $lastNameValidation = validateLastName($data['lastName']);
    if ($lastNameValidation !== true) {
        return $lastNameValidation;
    }

    // Валідація дати народження
    $birthdayValidation = validateBirthday($data['birthday']);
    if ($birthdayValidation !== true) {
        return $birthdayValidation;
    }

    // Перевірка на дублікати імен
    $duplicateValidation = isDuplicateName($conn, $data['firstName'], $excludeId);
    if ($duplicateValidation !== true) {
        return $duplicateValidation;
    }

    return true;
}
