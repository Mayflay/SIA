<?php
header("Content-Type: application/json");

require_once __DIR__ . "/db.php";

function respond(int $status, array $data): void
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    respond(405, ["success" => false, "message" => "POST required."]);
}

$data = json_decode(file_get_contents("php://input"), true);

$name = trim($data["name"] ?? "");
$email = trim($data["email"] ?? "");
$password = $data["password"] ?? "";

if ($name === "" || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
    respond(400, [
        "success" => false,
        "message" => "Enter your name, a valid email, and a password of at least 8 characters."
    ]);
}

try {
    $pdo->beginTransaction();

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $userQuery = $pdo->prepare(
        "INSERT INTO users (full_name, email, password_hash, role)
         VALUES (?, ?, ?, 'patient')"
    );
    $userQuery->execute([$name, $email, $passwordHash]);

    $userId = $pdo->lastInsertId();

    $patientQuery = $pdo->prepare(
        "INSERT INTO patients (user_id) VALUES (?)"
    );
    $patientQuery->execute([$userId]);

    $pdo->commit();

    respond(201, [
        "success" => true,
        "message" => "Account created successfully."
    ]);
} catch (PDOException $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    if ($error->getCode() === "23000") {
        respond(409, [
            "success" => false,
            "message" => "An account with that email already exists."
        ]);
    }

    respond(500, [
        "success" => false,
        "message" => "Could not create the account."
    ]);
}