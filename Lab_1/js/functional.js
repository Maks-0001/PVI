const bell = document.getElementById('bell');
const indicator = document.getElementById('notification-indicator');
const aDashboard = document.getElementById('dashboard');
const aIndex = document.getElementById('index');
const aTasks = document.getElementById('tasks');

let count = 1;

// Дзіночок та індикатор
if (localStorage.getItem('notificationsHidden') === 'true') {
  indicator.style.display = 'none';
}

bell.onclick = function () {
  localStorage.setItem('notificationsHidden', 'true');
  indicator.style.display = 'none';
  window.location.href = "messages.html";
};

bell.onanimationend = function () {
  indicator.style.display = 'block';
};

// Виділення активної сторінки
const currentPage = window.location.pathname;

if (currentPage.endsWith('dashboard.html')) {
  aDashboard.classList.add('active');
} else if (currentPage.endsWith('index.html')) {
  aIndex.classList.add('active');
} else if (currentPage.endsWith('tasks.html')) {
  aTasks.classList.add('active');
}

// Видалення студента
const deleteModal = document.getElementById("deleteStudentModal");
const closeDeleteModalBtn = document.querySelector(".close-delete");
const cancelDeleteBtn = document.getElementById("cancelDelete");
const confirmDeleteBtn = document.getElementById("confirmDelete");
let studentToDelete = null;

document.addEventListener("click", function (event) {
  if (event.target.closest(".delete")) {
    studentToDelete = event.target.closest("tr");
    document.getElementById("deleteMessage").textContent = `Are you sure you want to delete ${studentToDelete.children[2].textContent}?`;
    deleteModal.style.display = "block";
  }
});

[closeDeleteModalBtn, cancelDeleteBtn].forEach(btn => {
  btn.addEventListener("click", () => deleteModal.style.display = "none");
});

confirmDeleteBtn.addEventListener("click", function () {
  if (studentToDelete) {
    studentToDelete.remove();
  }
  deleteModal.style.display = "none";
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
    message: "First name must start with a capital letter, contain only English letters, apostrophes or hyphens, and be no longer than 11 characters."
  },
  lastName: {
    regex: /^[A-Z][a-z'-]{0,10}$/,
    message: "Last name must start with a capital letter and contain only English letters, hyphens or apostrophes, and be no longer than 11 characters."
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
  let isValid;
  if (rule.regex) {
    isValid = rule.regex.test(input.value.trim());
  } else if (rule.validate) {
    isValid = rule.validate(input.value.trim());
  }

  const errorSpan = createErrorSpan(input);

  // Перевірка чи правильне введення
  if (!isValid && input.value.trim() !== "") { 
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

// Перевірка форми при сабміті
submitButton.addEventListener("click", (event) => {
  checkFormValidity(); 
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

// Підтвердити надсилання форми
studentForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (submitButton.disabled) return;

  const group = groupInput.value;
  const firstName = firstNameInput.value.trim();
  const lastName = lastNameInput.value.trim();
  const gender = genderInput.value;
  const birthday = birthdayInput.value.trim();

  if (!group || !firstName || !lastName || !gender || !birthday) return;

  const tbody = document.querySelector("tbody");

  const idField = document.getElementById("studentId");
  let studentId = idField.value;

  if (editingStudentRow) {
    // якщо редагування
    editingStudentRow.children[1].textContent = group;
    editingStudentRow.children[2].innerHTML = `<strong>${firstName} ${lastName}</strong>`;
    editingStudentRow.children[3].textContent = gender;
    editingStudentRow.children[4].innerHTML = `<strong>${birthday}</strong>`;

    const student = {
      id: studentId,
      group,
      firstName,
      lastName,
      gender,
      birthday
    };

    console.log("Edited student:", JSON.stringify(student, null, 2));

  } else {
    // якщо створення
    studentId = studentIdCounter++;
    const newRow = document.createElement("tr");
    newRow.setAttribute("data-id", studentId); 

    newRow.innerHTML = `
      <td><input type="checkbox" class="rowCheckbox"></td>
      <td>${group}</td>
      <td><strong>${firstName} ${lastName}</strong></td>
      <td>${gender}</td>
      <td><strong>${birthday}</strong></td>
      <td><span class="status gray"></span></td>
      <td>
        <button class="edit" aria-label="Edit Student"><i class="fas fa-edit"></i></button>
        <button class="delete" aria-label="Delete Student"><i class="fas fa-times"></i></button>
      </td>`;
    tbody.appendChild(newRow);

    toggleRowButtons(newRow, newRow.querySelector("rowCheckbox"));
  }

  studentModal.style.display = "none";
  studentForm.reset();
  resetValidation();
  editingStudentRow = null;
});


deleteAllBtn.addEventListener("click", () => deleteAllModal.style.display = "block");

[closeDeleteAllModalBtn, cancelDeleteAllBtn].forEach(btn => {
  btn.addEventListener("click", () => deleteAllModal.style.display = "none");
});

confirmDeleteAllBtn.addEventListener("click", () => {
  document.querySelector("tbody").innerHTML = "";
  selectAllCheckbox.checked = false;
  deleteAllBtn.style.display = "none";
  deleteAllModal.style.display = "none";
});
