function initializeBellNotifications() { 
    window.bellNotificationsInitialized = true; // Встановлюємо прапорець на початку
    const bell = document.getElementById('bell'); 
    const indicator = document.getElementById('notification-indicator'); 
    const notificationDrop = document.querySelector('.notification-drop'); 

    if (!bell || !indicator || !notificationDrop) { 
        return;
    }

    const hasUnread = localStorage.getItem('hasUnreadNotifications') === 'true'; 
    if (hasUnread) { 
        if(indicator) indicator.style.display = 'block'; 
    } else {
        if(indicator) indicator.style.display = 'none'; 
    }

    if (typeof window.updateNotificationPlaceholder === 'function') { 
        window.updateNotificationPlaceholder(); 
    }

    bell.onclick = function () { 
        window.location.href = "messages.php";  

        if (typeof window.socket !== 'undefined' && window.socket && window.socket.connected) { 
            window.socket.emit('markNotificationsAsRead', {}); 
        } else {
            console.warn("Socket не доступний для markNotificationsAsRead. Індикатор буде сховано локально."); 
        }

        if(indicator) indicator.style.display = 'none'; 
        localStorage.removeItem('hasUnreadNotifications'); 
        localStorage.setItem('notificationsHidden', 'true');  

        const currentNotificationDrop = document.querySelector(".notification-drop"); 
        if (currentNotificationDrop) { 
            currentNotificationDrop.querySelectorAll('.notification-item:not(.notification-placeholder)').forEach(item => item.remove()); 
        }
        if (typeof window.updateNotificationPlaceholder === 'function') { 
            window.updateNotificationPlaceholder(); 
        }
    };

    window.showNotificationIndicator = function(animateBell = true) { 
         const bell = document.getElementById('bell'); 
         const indicator = document.getElementById('notification-indicator'); 
         if (indicator) indicator.style.display = 'block'; 
         localStorage.setItem('hasUnreadNotifications', 'true'); 
         localStorage.removeItem('notificationsHidden'); 

         if (animateBell && bell) { 
             bell.style.animation = 'none'; 
             void bell.offsetWidth; 
             bell.style.animation = 'myAnim 1s ease 0s 1 normal forwards'; 
             setTimeout(() => {
                 if(bell) bell.style.animation = ''; 
             }, 1000); 
         }
    };
    window.hideNotificationIndicatorIfNoUnread = function() { 
        const notificationDrop = document.querySelector(".notification-drop"); 
        if (notificationDrop && notificationDrop.querySelectorAll('.notification-item:not(.notification-placeholder)').length === 0) { 
            const bellIndicator = document.getElementById('notification-indicator'); 
            if (bellIndicator) bellIndicator.style.display = 'none'; 
            localStorage.removeItem('hasUnreadNotifications'); 
        }
    };
}


const aDashboard = document.getElementById('dashboard');
const aIndex = document.getElementById('index');
const aTasks = document.getElementById('tasks');

// Виділення активної сторінки
const currentPage_1 = window.location.pathname;

if (currentPage_1.endsWith('dashboard.php')) {
  aDashboard.classList.add('active');
} else if (currentPage_1.endsWith('index.php')) {
  aIndex.classList.add('active');
} else if (currentPage_1.endsWith('tasks.php')) {
  aTasks.classList.add('active');
}

// Видалення студента
const deleteModal = document.getElementById("deleteStudentModal");
const closeDeleteModalBtn = document.querySelector(".close-delete");
const cancelDeleteBtn = document.getElementById("cancelDelete");
const confirmDeleteBtn = document.getElementById("confirmDelete");
let studentToDelete = null;

// Відображення модального вікна для підтвердження видалення
document.addEventListener('click', (e) => {
  if (e.target.closest('.delete')) {
    const row = e.target.closest('tr');
    const id = row.getAttribute('data-id');
    const studentName = row.children[2].textContent;

    // Зберігаємо інформацію про студента, якого потрібно видалити
    studentToDelete = { row, id };
    document.getElementById("deleteMessage").textContent = `Are you sure you want to delete ${studentName}?`;
    deleteModal.style.display = "block";
  }
});

// Обробка підтвердження видалення
confirmDeleteBtn.addEventListener('click', async () => {
  if (studentToDelete) {
    const { row, id } = studentToDelete;

    // Видалити студента з бази даних
    await deleteStudentFromDatabase(id);

    // Скинути стан
    studentToDelete = null;
    deleteModal.style.display = "none";
  }
});

// Закриття модального вікна без видалення
[closeDeleteModalBtn, cancelDeleteBtn].forEach(btn => {
  btn.addEventListener('click', () => {
    deleteModal.style.display = "none";
    studentToDelete = null;
  });
});

window.addEventListener("click", function (event) {
  if (event.target === deleteModal) {
    deleteModal.style.display = "none";
  }
});


// Вибір усіх чекбоксів
const selectAllCheckbox = document.getElementById("selectAll");

selectAllCheckbox.addEventListener("change", function () {
  const rowCheckboxes = document.querySelectorAll(".rowCheckbox");
  rowCheckboxes.forEach(checkbox => {
    checkbox.checked = selectAllCheckbox.checked;
    toggleRowButtons(checkbox.closest("tr"), checkbox.checked);
  });
});

// Перевірка стану чекбоксів та активація/деактивація кнопок
const deleteAllBtn = document.getElementById("delete-selected");

// Реакція на зміну ГОЛОВНОГО чекбокса
selectAllCheckbox.addEventListener("change", function () {
  const rowCheckboxes = document.querySelectorAll(".rowCheckbox");
  rowCheckboxes.forEach(checkbox => {
    checkbox.checked = selectAllCheckbox.checked;

    const studentRow = checkbox.closest("tr");
    toggleRowButtons(studentRow, checkbox.checked);
  });

  deleteAllBtn.style.display = selectAllCheckbox.checked ? "inline-block" : "none";
});

// Реакція на зміну будь-якого РЯДКОВОГО чекбокса
document.addEventListener("change", function (event) {
  if (event.target.classList.contains("rowCheckbox")) {
    const studentRow = event.target.closest("tr");
    toggleRowButtons(studentRow, event.target.checked);

    const rowCheckboxes = document.querySelectorAll(".rowCheckbox");
    const allChecked = Array.from(rowCheckboxes).every(checkbox => checkbox.checked);

    selectAllCheckbox.checked = allChecked;
    deleteAllBtn.style.display = allChecked ? "inline-block" : "none";
  }
});


// Функція для активації/деактивації кнопок у рядку
function toggleRowButtons(row, isEnabled) {
  const editButton = row.querySelector(".edit");
  const deleteButton = row.querySelector(".delete");

  if (isEnabled) {
    editButton.disabled = false;
    deleteButton.disabled = false;
    editButton.style.opacity = "1";
    deleteButton.style.opacity = "1";
    editButton.style.cursor = "pointer";
    deleteButton.style.cursor = "pointer";
  } else {
    editButton.disabled = true;
    deleteButton.disabled = true;
    editButton.style.opacity = "0.5";
    deleteButton.style.opacity = "0.5";
    editButton.style.cursor = "not-allowed";
    deleteButton.style.cursor = "not-allowed";
  }
}

// Ініціалізація стану кнопок для існуючих рядків
document.querySelectorAll("tbody tr").forEach(row => {
  const checkbox = row.querySelector(".rowCheckbox");
  toggleRowButtons(row, checkbox.checked);
});


// ======== DOM елементи ======== //
const studentModal = document.getElementById("studentModal");
const modalTitle = document.getElementById("modalTitle");
const studentForm = document.getElementById("studentForm");
const submitButton = document.getElementById("submitButton");
const cancelButton = document.getElementById("cancelButton");
const closeModalButton = document.querySelector(".close");
const groupInput = document.getElementById("group");
const firstNameInput = document.getElementById("firstName");
const lastNameInput = document.getElementById("lastName");
const genderInput = document.getElementById("gender");
const birthdayInput = document.getElementById("birthday");
const deleteAllModal = document.getElementById("deleteAllStudentsModal");
const closeDeleteAllModalBtn = document.querySelector(".close-delete-all");
const cancelDeleteAllBtn = document.getElementById("cancelDeleteAll");
const confirmDeleteAllBtn = document.getElementById("confirmDeleteAll");
let studentIdCounter = 1;


let editingStudentRow = null;

// ======== Правила валідації ======== //
const validationRules = {
  firstName: {
    regex: /^[A-Z][a-z'-]{0,10}$/,
    message: "First name must start with a capital letter, contain only English letters, apostrophes or hyphens, and be no longer than 11 characters.",
    forbidden: /@lpnu\.ua/,
  },

  lastName: {
    regex: /^[A-Z][a-z'-]{0,10}$/,
    message: "Last name must start with a capital letter and contain only English letters, hyphens or apostrophes, and be no longer than 11 characters.",
    forbidden: /@lpnu\.ua/
  },

  birthday: {
    validate: (dateStr) => {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      return year >= 2000 && year <= 2007;
    },
    message: "Birthday must be between 2000 and 2007."
  }
};

function createErrorSpan(input) {
  let span = input.nextElementSibling;
  if (!span || !span.classList.contains("error-message")) {
    span = document.createElement("span");
    span.classList.add("error-message");
    input.insertAdjacentElement("afterend", span);
  }
  return span;
}

// Функція для валідації поля
function validateInput(input, rule) {
  const value = input.value.trim();
  const errorSpan = createErrorSpan(input);

  if (rule.forbidden && rule.forbidden.test(value)) {
    input.classList.add("input-error");
    errorSpan.textContent = "Ви ввели свою пошту!";
    errorSpan.style.color = "red";
    return false;
  }

  if (value.toLowerCase().includes("select")) {
    input.classList.add("input-error");
    errorSpan.textContent = "Зловмисник!";
    errorSpan.style.color = "red";
    return false;
  }

  let isValid;
  if (rule.regex) {
    isValid = rule.regex.test(value);
  } else if (rule.validate) {
    isValid = rule.validate(value);
  }

  if (!isValid && value !== "") {
    input.classList.add("input-error");
    errorSpan.textContent = rule.message;
    errorSpan.style.color = "red";
    return false;
  } else {
    input.classList.remove("input-error");
    errorSpan.textContent = "";
    return true;
  }
}


function checkFormValidity() {
  const isFirstNameValid = validateInput(firstNameInput, validationRules.firstName);
  const isLastNameValid = validateInput(lastNameInput, validationRules.lastName);
  const isBirthdayValid = validateInput(birthdayInput, validationRules.birthday);
  submitButton.disabled = !(isFirstNameValid && isLastNameValid && isBirthdayValid);
}

function resetValidation() {
  [firstNameInput, lastNameInput, birthdayInput].forEach(input => {
    input.classList.remove("input-error");
    const errorSpan = input.nextElementSibling;
    if (errorSpan && errorSpan.classList.contains("error-message")) {
      errorSpan.textContent = "";
    }
  });
  submitButton.disabled = true;
}

[firstNameInput, lastNameInput, birthdayInput].forEach(input => {
  input.addEventListener("input", () => {
    validateInput(input, validationRules[input.id]);
    checkFormValidity();
  });
});

// Подія для перевірки на втрату фокусу (коли користувач залишає поле)
[firstNameInput, lastNameInput, birthdayInput].forEach(input => {
  input.addEventListener("blur", () => {
    validateInput(input, validationRules[input.id]);
    checkFormValidity();
  });
});


function openStudentModal(isEdit, studentData = null) {
  studentForm.reset();
  resetValidation();
  editingStudentRow = null;

  if (isEdit && studentData) {
    modalTitle.textContent = "Edit Student";
    submitButton.textContent = "Save";

    groupInput.value = studentData.group;
    firstNameInput.value = studentData.firstName;
    lastNameInput.value = studentData.lastName;
    genderInput.value = studentData.gender;
    birthdayInput.value = studentData.birthday;
    document.getElementById("studentId").value = studentData.id;

    editingStudentRow = studentData.row;
  } else {
    modalTitle.textContent = "Add Student";
    submitButton.textContent = "Create";
    document.getElementById("studentId").value = "";
  }

  studentModal.style.display = "block";
  checkFormValidity();
}

// Відкриття модального вікна
const openModalButton = document.getElementById("openModal");
openModalButton.addEventListener("click", () => openStudentModal(false));

// Редагування
document.addEventListener("click", (e) => {
  if (e.target.closest(".edit")) {
    const row = e.target.closest("tr");
    const group = row.children[1].textContent;
    const [firstName, lastName] = row.children[2].textContent.trim().split(" ");
    const gender = row.children[3].textContent;
    const birthday = row.children[4].textContent;

    const id = row.getAttribute("data-id");
    openStudentModal(true, { group, firstName, lastName, gender, birthday, row, id });
  }
});

// Закрити модальне вікно
[closeModalButton, cancelButton].forEach(btn => {
  btn.addEventListener("click", () => {
    studentModal.style.display = "none";
    studentForm.reset();
    editingStudentRow = null;
    resetValidation();
  });
});

window.addEventListener("click", (e) => {
  if (e.target === studentModal) {
    studentModal.style.display = "none";
    studentForm.reset();
    editingStudentRow = null;
    resetValidation();
  }
});

deleteAllBtn.addEventListener("click", () => deleteAllModal.style.display = "block");

[closeDeleteAllModalBtn, cancelDeleteAllBtn].forEach(btn => {
  btn.addEventListener("click", () => deleteAllModal.style.display = "none");
});

window.addEventListener("click", function (event) {
  if (event.target === deleteAllModal) {
    deleteAllModal.style.display = "none";
  }
});

// ======== Пагінація ======== //
let currentPage = 1;
const studentsPerPage = 5;
let studentsData = [];

// Завантаження студентів із бази даних
async function loadStudents() {
  try {
    const response = await fetch('/Lab_1/app/api/controller.php?action=load');
    const students = await response.json();

    studentsData = students.map(student => ({
      id: student.id,
      group_name: student.group_name,
      firstName: student.first_name,  
      lastName: student.last_name,
      gender: student.gender,
      birthday: student.birthday,
      status: student.status
    }));

    renderPagination();
    renderStudents();
  } catch (error) {
    console.error('Error loading students:', error);
  }
}

// Відображення студентів на поточній сторінці
function renderStudents() {
  const tbody = document.querySelector('tbody');

  // Зберігаємо стан чекбоксів перед оновленням таблиці
  const selectedIds = Array.from(document.querySelectorAll('.rowCheckbox:checked')).map(checkbox => checkbox.closest('tr').getAttribute('data-id'));

  tbody.innerHTML = '';

  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = startIndex + studentsPerPage;
  const studentsToShow = studentsData.slice(startIndex, endIndex);

  // Якщо на поточній сторінці немає студентів, перейти на попередню сторінку
  if (studentsToShow.length === 0 && currentPage > 1) {
    currentPage--;
    renderStudents();
    renderPagination();
    return; // Завершуємо виконання, щоб уникнути повторного рендерингу
  }

  studentsToShow.forEach(student => {
    addStudentToTable(student);

    // Відновлюємо стан чекбоксів
    const row = tbody.querySelector(`tr[data-id="${student.id}"]`);
    if (selectedIds.includes(student.id.toString())) {
      const checkbox = row.querySelector('.rowCheckbox');
      checkbox.checked = true;
      toggleRowButtons(row, true);
    }
  });
}

// Відображення кнопок пагінації
function renderPagination() {
  const paginationButtons = document.getElementById('paginationButtons');
  paginationButtons.innerHTML = '';

  const totalPages = Math.ceil(studentsData.length / studentsPerPage);

  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement('button');
    button.textContent = i;
    button.classList.add('pagination-button');
    if (i === currentPage) {
      button.classList.add('active');
    }
    button.addEventListener('click', () => {
      currentPage = i;
      renderStudents();
      renderPagination();
    });
    paginationButtons.appendChild(button);
  }

  // Вимкнення кнопок "Попередня" та "Наступна", якщо це необхідно
  document.getElementById('prevPage').disabled = currentPage === 1;
  document.getElementById('nextPage').disabled = currentPage === totalPages;
}

// Обробка кнопок "Попередня" та "Наступна"
document.getElementById('prevPage').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    renderStudents();
    renderPagination();
  }
});

document.getElementById('nextPage').addEventListener('click', () => {
  const totalPages = Math.ceil(studentsData.length / studentsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderStudents();
    renderPagination();
  }
});

// ======== Додавання студента до таблиці ======== //
function addStudentToTable(student) {
  const tbody = document.querySelector('tbody');
  const row = document.createElement('tr');
  row.setAttribute('data-id', student.id);

  row.innerHTML = `
    <td><input type="checkbox" class="rowCheckbox"></td>
    <td>${student.group_name}</td>
    <td><strong>${student.firstName} ${student.lastName}</strong></td>
    <td>${student.gender}</td>
    <td><strong>${student.birthday}</strong></td>
    <td><span class="status ${student.status ? 'green' : 'gray'}"></span></td>
    <td>
      <button class="edit" aria-label="Edit Student"><i class="fas fa-edit"></i></button>
      <button class="delete" aria-label="Delete Student"><i class="fas fa-times"></i></button>
    </td>`;
  tbody.appendChild(row);

    // Заблокувати кнопки редагування та видалення для нового студента
    const checkbox = row.querySelector('.rowCheckbox');
    toggleRowButtons(row, checkbox.checked);
}

// ======== Додавання студента до бази даних ======== //
async function addStudentToDatabase(student) {
  try {
    const response = await fetch('/Lab_1/app/api/controller.php?action=add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      if (result.error.includes("first name")) {
        // Підсвічуємо поле firstName червоним
        firstNameInput.classList.add("input-error");
        const errorSpan = createErrorSpan(firstNameInput);
        errorSpan.textContent = result.error;
        errorSpan.style.color = "red";
      }
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    student.id = result.id; // Отримуємо ID з бази даних

    // Додаємо студента до локального масиву
    studentsData.push(student);

    // Оновлюємо таблицю та пагінацію
    renderStudents();
    renderPagination();

    // Закриваємо модальне вікно
    studentModal.style.display = "none";
    studentForm.reset();
    editingStudentRow = null;
  } catch (error) {
    alert(`Error adding student: ${error.message}`);
    console.error('Error adding student:', error);
  }
}

// ======== Оновлення студента в базі даних ======== //
async function updateStudentInDatabase(student) {
  try {
    const response = await fetch('/Lab_1/app/api/controller.php?action=update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      if (result.error.includes("first name")) {
        // Підсвічуємо поле firstName червоним
        firstNameInput.classList.add("input-error");
        const errorSpan = createErrorSpan(firstNameInput);
        errorSpan.textContent = result.error;
        errorSpan.style.color = "red";
      }
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    // Оновлюємо таблицю та пагінацію
    renderStudents();
    renderPagination();

    // Закриваємо модальне вікно
    studentModal.style.display = "none";
    studentForm.reset();
    editingStudentRow = null;
  } catch (error) {
    alert(`Error updating student: ${error.message}`);
    console.error('Error updating student:', error);
  }
}

// ======== Видалення студента з бази даних ======== //
async function deleteStudentFromDatabase(id) {
  try {
    const response = await fetch('/Lab_1/app/api/controller.php?action=delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const result = await response.json();

    if (result.success) {
      // Видаляємо студента з локального масиву
      studentsData = studentsData.filter(student => student.id !== id);

      // Оновлюємо таблицю та пагінацію
      renderStudents();
      renderPagination();
    } else {
      console.error('Error deleting student:', result.error);
    }
  } catch (error) {
    console.error('Error deleting student:', error);
  }
}

// Підтвердити надсилання форми
studentForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Зчитування даних із форми
  const student = {
    group_name: groupInput.value.trim(),
    firstName: firstNameInput.value.trim(),
    lastName: lastNameInput.value.trim(),
    gender: genderInput.value,
    birthday: birthdayInput.value.trim(),
    password: 'default_password' // Додано поле `password` (можна замінити на реальне значення)
  };

  // Перевірка, чи всі поля заповнені
  if (!student.group_name || !student.firstName || !student.lastName || !student.gender || !student.birthday) {
    alert('Please fill in all fields.');
    return;
  }

  if (editingStudentRow) {
    student.id = editingStudentRow.getAttribute('data-id');
    await updateStudentInDatabase(student); // Оновлюємо запис
    loadStudents(); // Перезавантажити таблицю
  } else {
    await addStudentToDatabase(student); // Додати нового
  }

  studentModal.style.display = 'none';
  studentForm.reset();
  editingStudentRow = null;
});

// Обробка підтвердження видалення всіх студентів
confirmDeleteAllBtn.addEventListener('click', async () => {
  const checkboxes = document.querySelectorAll('.rowCheckbox:checked');
  const idsToDelete = [];

  // Збираємо всі ID студентів, яких потрібно видалити
  checkboxes.forEach(checkbox => {
    const row = checkbox.closest('tr');
    const id = row.getAttribute('data-id');
    idsToDelete.push(id);
  });

  // Видаляємо студентів з бази даних
  try {
    const response = await fetch('/Lab_1/app/api/controller.php?action=deleteAll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: idsToDelete })
    });

    const result = await response.json();

    if (result.success) {
      // Видаляємо студентів із локального масиву
      studentsData = studentsData.filter(student => !idsToDelete.includes(student.id));

      // Оновлюємо таблицю та пагінацію
      renderStudents();
      renderPagination();

      // Скидаємо стан
      selectAllCheckbox.checked = false;
      deleteAllBtn.style.display = 'none';
      deleteAllModal.style.display = 'none';
    } else {
      console.error('Error deleting students:', result.error);
    }
  } catch (error) {
    console.error('Error deleting students:', error);
  }
});

// ======== Ініціалізація ======== //
loadStudents();
setInterval(loadStudents, 3000);

