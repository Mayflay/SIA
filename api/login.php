<?php
header("Content-Type: application/json");
session_start();
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
$email = trim($data["email"] ?? "");
$password = $data["password"] ?? "";
$requestedRole = $data["role"] ?? "";

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === "" || !in_array($requestedRole, ["admin", "staff", "patient"], true)) {
    respond(400, ["success" => false, "message" => "Enter your registered email, password, and account type."]);
}

$query = $pdo->prepare(
    "SELECT user_id, full_name, email, password_hash, role
     FROM users
     WHERE email = ? AND is_active = TRUE
     LIMIT 1"
);
$query->execute([$email]);
$user = $query->fetch();

if (!$user || !password_verify($password, $user["password_hash"]) || $user["role"] !== $requestedRole) {
    respond(401, ["success" => false, "message" => "Account not found or login details are incorrect. Register first or check the selected account type."]);
}

session_regenerate_id(true);
$_SESSION["user_id"] = (int) $user["user_id"];
$_SESSION["role"] = $user["role"];
unset($user["password_hash"]);
respond(200, ["success" => true, "user" => $user]);
