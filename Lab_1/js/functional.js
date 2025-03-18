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

// Вибір усіх чекбоксів
const selectAllCheckbox = document.getElementById("selectAll");
const rowCheckboxes = document.querySelectorAll(".rowCheckbox");

selectAllCheckbox.addEventListener("change", function () {
    rowCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
    toggleButtons();
});

// Обробка окремих чекбоксів
rowCheckboxes.forEach(checkbox => {
    checkbox.addEventListener("change", function () {
        // Якщо хоча б один не вибраний, знімаємо галочку з головного
        selectAllCheckbox.checked = [...rowCheckboxes].every(cb => cb.checked);
        toggleButtons();
    });
});

// Функція блокування кнопок
function toggleButtons() {
    const anyChecked = [...rowCheckboxes].some(cb => cb.checked);
    document.querySelectorAll(".edit, .delete").forEach(btn => {
        btn.disabled = !anyChecked;
        btn.style.opacity = anyChecked ? "1" : "0.5";
        btn.style.pointerEvents = anyChecked ? "auto" : "none";
    });
}

// Виклик при завантаженні сторінки
toggleButtons();
