const bell = document.getElementById('bell');
const indicator = document.getElementById('notification-indicator');
const aDashboard = document.getElementById('dashboard');
const aIndex = document.getElementById('index');
const aTasks = document.getElementById('tasks');

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

// Відкриття модального вікна для додавання студентів
const addModal = document.getElementById("addStudentModal");
const openModalBtn = document.getElementById("openModal");
const closeModalBtns = document.querySelectorAll(".close, .cancel-btn");

openModalBtn.addEventListener("click", function () {
    addModal.style.display = "block";
});

closeModalBtns.forEach(btn => {
    btn.addEventListener("click", function () {
        addModal.style.display = "none";
    });
});

window.addEventListener("click", function (event) {
    if (event.target === addModal) {
        addModal.style.display = "none";
    }
});

// Додавання нового студента
const addStudentForm = document.getElementById("addStudentForm");
addStudentForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const group = document.getElementById("group").value;
    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const gender = document.getElementById("gender").value;
    const birthday = document.getElementById("birthday").value;

    if (!group || !firstName || !lastName || !gender || !birthday) {
        alert("Please fill in all fields.");
        return;
    }

    const tbody = document.querySelector("tbody");
    const newRow = document.createElement("tr");

    newRow.innerHTML = `
        <td><input type="checkbox" class="rowCheckbox"></td>
        <td>${group}</td>
        <td><strong>${firstName} ${lastName}</strong></td>
        <td>${gender}</td>
        <td><strong>${birthday}</strong></td>
        <td><span class="status gray"></span></td>
        <td>
            <button class="edit"><i class="fas fa-edit"></i></button>
            <button class="delete"><i class="fas fa-times"></i></button>
        </td>
    `;

    tbody.appendChild(newRow);
    toggleRowButtons(newRow, false); 
    addModal.style.display = "none";
    addStudentForm.reset();
});

// Редагування студента
const editModal = document.getElementById("editStudentModal");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const closeEditModalBtn = document.querySelector(".close-edit");

function openEditModal(studentRow) {
    const group = studentRow.children[1].textContent;
    const name = studentRow.children[2].textContent.split(" ");
    const gender = studentRow.children[3].textContent;
    const birthday = studentRow.children[4].textContent;

    document.getElementById("editGroup").value = group;
    document.getElementById("editFirstName").value = name[0];
    document.getElementById("editLastName").value = name[1];
    document.getElementById("editGender").value = gender;
    document.getElementById("editBirthday").value = birthday;

    editModal.style.display = "block";
}

[closeEditModalBtn, cancelEditBtn].forEach(btn => {
    btn.addEventListener("click", () => editModal.style.display = "none");
});

window.addEventListener("click", function (event) {
    if (event.target === editModal) {
        editModal.style.display = "none";
    }
});

document.addEventListener("click", function (event) {
    if (event.target.closest(".edit")) {
        openEditModal(event.target.closest("tr"));
    }
});

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
document.addEventListener("change", function (event) {
    if (event.target.classList.contains("rowCheckbox")) {
        const studentRow = event.target.closest("tr");
        toggleRowButtons(studentRow, event.target.checked);

        const rowCheckboxes = document.querySelectorAll(".rowCheckbox");
        const anyChecked = Array.from(rowCheckboxes).some(checkbox => checkbox.checked);
        deleteAllBtn.style.display = anyChecked ? "block" : "none";

        const allChecked = Array.from(rowCheckboxes).every(checkbox => checkbox.checked);
        selectAllCheckbox.checked = allChecked;
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

// Автоматичне встановлення чекбоксу "selectAll", якщо всі студенти обрані
document.addEventListener("change", function (event) {
    if (event.target.classList.contains("rowCheckbox")) {
        const rowCheckboxes = document.querySelectorAll(".rowCheckbox");
        const allChecked = Array.from(rowCheckboxes).every(checkbox => checkbox.checked);
        selectAllCheckbox.checked = allChecked;
    }
});

// Ініціалізація стану кнопок для існуючих рядків
document.querySelectorAll("tbody tr").forEach(row => {
    const checkbox = row.querySelector(".rowCheckbox");
    toggleRowButtons(row, checkbox.checked);
});

// Показати або приховати кнопку видалення всіх студентів
const deleteAllBtn = document.getElementById("delete-selected");
deleteAllBtn.style.display = "none";

selectAllCheckbox.addEventListener("change", function () {
    const rowCheckboxes = document.querySelectorAll(".rowCheckbox");
    rowCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
    deleteAllBtn.style.display = selectAllCheckbox.checked ? "inline-block" : "none";
});

document.addEventListener("change", function (event) {
    if (event.target.classList.contains("rowCheckbox")) {
        const rowCheckboxes = document.querySelectorAll(".rowCheckbox");
        const allChecked = Array.from(rowCheckboxes).every(checkbox => checkbox.checked);
        const anyChecked = Array.from(rowCheckboxes).some(checkbox => checkbox.checked);
        selectAllCheckbox.checked = allChecked;
        deleteAllBtn.style.display = allChecked ? "inline-block" : "none";
    }
});

// Видалення всіх студентів
deleteAllBtn.addEventListener("click", function () {
    const tbody = document.querySelector("tbody");
    tbody.innerHTML = "";
    selectAllCheckbox.checked = false;
    deleteAllBtn.style.display = "none";
});



