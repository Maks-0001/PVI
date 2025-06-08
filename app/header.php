<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <title>Title</title>
  <script src="http://localhost:3001/socket.io/socket.io.js"></script>
</head>

<body>
  <header>
    <div class="navbar">
      <div class="left-side">
        <a href="index.php" id="navbar-logo">CMS</a>
        <div class="drop">
          <button class="nav-btn">&#9776;</button>
          <div class="nav-list">
            <a href="dashboard.php" id="dashboard">Dashboard</a>
            <a href="index.php" id="index">Student</a>
            <a href="tasks.php" id="tasks">Tasks</a>
          </div>
        </div>
      </div>

      <div class="right-side">
        <div class="notification-wrapper">
          <a href="#" aria-label="messages" id="bellLink"><i class="fa-solid fa-bell" id="bell"></i></a>
          <span class="indicator" id="notification-indicator" style="display: none;"></span>
          <div class="notification-drop">
          </div>
        </div>
        <div class="user-info">
          <i class="fa-solid fa-user" id="user"></i>
          <a href="#" id="name">Guest</a>
          <div class="user-drop">
            <a href="#">Profile</a>
            <a href="api/logout.php" id="logout">Log Out</a>
          </div>
        </div>
      </div>
    </div>
  </header>
</body>

</html>