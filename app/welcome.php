<?php
session_start();
if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
    header("Location: index.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome</title>
    <link rel="stylesheet" href="static/styles/welcome.css">
    <script src="js/access.js" defer></script>
</head>

<body>
    <div class="welcome-modal">
        <div class="welcome-content">
            <h1>Welcome to the Student Editor</h1>
            <form id="loginForm">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" placeholder="Enter your username" required>

                <label for="password">Password</label>
                <input type="password" id="password" name="password" placeholder="Enter your password" required>

                <button type="submit" id="loginButton">Login</button>
            </form>
        </div>
    </div>
</body>

</html>