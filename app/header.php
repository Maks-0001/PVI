<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <title>Title</title>
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
          <a href="messages.php" aria-label="messages"><i class="fa-solid fa-bell" id="bell"></i></a>
          <span class="indicator" id="notification-indicator"></span>
          <!-- Випадаюче вікно для сповіщень -->
          <div class="notification-drop">
            <div class="notification-item">
              <img src="static/images/istockphoto-1495088043-612x612.jpg" alt="Avatar">
              <div class="notification-content">
                <strong>Студент 1</strong>
                <p>Текст повідомлення...</p>
              </div>
            </div>
            <div class="notification-item">
              <img src="static/images/istockphoto-1495088043-612x612.jpg" alt="Avatar">
              <div class="notification-content">
                <strong>Студент 2</strong>
                <p>Текст повідомлення...</p>
              </div>
            </div>
            <div class="notification-item">
              <img src="static/images/istockphoto-1495088043-612x612.jpg" alt="Avatar">
              <div class="notification-content">
                <strong>Студент 3</strong>
                <p>Текст повідомлення...</p>
              </div>
            </div>
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