<?php
session_start();
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
  header("Location: welcome.php");
  exit;
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Student Editor</title>
  <link rel="stylesheet" href="static/styles/style.css">
  <link rel="stylesheet" href="static/styles/navbar.css">
  <link rel="stylesheet" href="static/styles/table.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="manifest" href="manifest.json" />
  <script src="js/header.js" defer></script>
</head>

<body>
  <header>
    <div id="header-placeholder"></div>
  </header>

  <section>
    <div class="main">
      <h1>Students</h1>
      <div class="button-container">
        <div id="delete-selected" class="delete-btn"><i class="fas fa-trash"></i></div>
        <div id="openModal" class="add-btn">+</div>
      </div>
      <div class="align">
        <table>
          <thead>
            <tr>
              <th>
                <label for="selectAll" class="visually-hidden">Select All</label>
                <input type="checkbox" name="selectAll" id="selectAll">
              </th>
              <th>Group</th>
              <th>Name</th>
              <th>Gender</th>
              <th>Birthday</th>
              <th>Status</th>
              <th>Options</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
        <div class="pagination">
          <button id="prevPage">&lt;</button>
          <div id="paginationButtons"></div>
          <button id="nextPage">&gt;</button>
        </div>
      </div>
    </div>

    <div id="studentModal" class="modal">
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2 id="modalTitle">Add Student</h2>

        <form id="studentForm">
          <input type="hidden" id="studentId" name="id">

          <label for="group">Group</label>
          <select name="group" id="group" required>
            <option value="">Select Group</option>
            <option value="PZ-21">PZ-21</option>
            <option value="PZ-22">PZ-22</option>
            <option value="PZ-23">PZ-23</option>
            <option value="PZ-24">PZ-24</option>
          </select>

          <label for="firstName">First name</label>
          <input type="text" id="firstName" name="firstName" required>

          <label for="lastName">Last name</label>
          <input type="text" id="lastName" name="lastName" required>

          <label for="gender">Gender</label>
          <select id="gender" name="gender" required>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <label for="birthday">Birthday</label>
          <input type="date" id="birthday" name="birthday" required>

          <div class="modal-buttons">
            <button type="button" class="cancel-btn" id="cancelButton">Cancel</button>
            <button type="submit" id="submitButton">Create</button>
          </div>
        </form>
      </div>
    </div>


    <div id="deleteStudentModal" class="modal">
      <div class="modal-content">
        <span class="close-delete">&times;</span>
        <h2>Warning</h2>
        <p id="deleteMessage">Are you sure you want to delete this student?</p>
        <div class="modal-buttons">
          <button id="cancelDelete" class="cancel-btn">Cancel</button>
          <button id="confirmDelete" class="create-btn">OK</button>
        </div>
      </div>
    </div>

    <div id="deleteAllStudentsModal" class="modal">
      <div class="modal-content">
        <span class="close-delete-all">&times;</span>
        <h2>Warning</h2>
        <p id="deleteAllMessage">Are you sure you want to delete all students?</p>
        <div class="modal-buttons">
          <button id="cancelDeleteAll" class="cancel-btn">Cancel</button>
          <button id="confirmDeleteAll" class="create-btn">OK</button>
        </div>
      </div>
    </div>
  </section>


</body>

</html>