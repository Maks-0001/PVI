document.addEventListener("DOMContentLoaded", () => {
  fetch("header.html")
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("header-placeholder").innerHTML = data;
      const script = document.createElement("script");
      script.src = "./js/functional.js";
      script.type = "text/javascript";
      document.head.appendChild(script);
    })
    .catch((error) => console.error('Error loading ${file}:', error));
});


// Універсальне модальне вікно для додавання та редагування студентів

// const groupInput = document.getElementById("group");
// const firstNameInput = document.getElementById("firstName");
// const lastNameInput = document.getElementById("lastName");
// const genderInput = document.getElementById("gender");
// const birthdayInput = document.getElementById("birthday");

// const validationRules = {
// firstName: {
//     regex: /^[A-Z][a-z']*$/,
//     message: "First name must start with a capital letter and contain only English letters and optional apostrophes."
// },
// lastName: {
//     regex: /^[A-Z][a-z'-]*$/,
//     message: "Last name must start with a capital letter and contain only English letters, hyphens or apostrophes."
// },
// birthday: {
//     validate: (dateStr) => {
//     const date = new Date(dateStr);
//     const year = date.getFullYear();
//     return year >= 2000 && year <= 2007;
//     },
//     message: "Birthday must be between 2000 and 2007."
// }
// };

// function createErrorSpan(input) {
// let span = input.nextElementSibling;
// if (!span || !span.classList.contains("error-message")) {
//     span = document.createElement("span");
//     span.classList.add("error-message");
//     input.insertAdjacentElement("afterend", span);
// }
// return span;
// }

// function validateInput(input, rule) {
// let isValid;
// if (rule.regex) {
//     isValid = rule.regex.test(input.value.trim());
// } else if (rule.validate) {
//     isValid = rule.validate(input.value.trim());
// }

// const errorSpan = createErrorSpan(input);

// if (!isValid) {
//     input.classList.add("input-error");
//     errorSpan.textContent = rule.message;
//     errorSpan.style.color = "red";
//     return false;
// } else {
//     input.classList.remove("input-error");
//     errorSpan.textContent = "";
//     return true;
// }
// }

// function checkFormValidity() {
// const isFirstNameValid = validateInput(firstNameInput, validationRules.firstName);
// const isLastNameValid = validateInput(lastNameInput, validationRules.lastName);
// const isBirthdayValid = validateInput(birthdayInput, validationRules.birthday);
// submitButton.disabled = !(isFirstNameValid && isLastNameValid && isBirthdayValid);
// }

// function resetValidation() {
// [firstNameInput, lastNameInput, birthdayInput].forEach(input => {
//     input.classList.remove("input-error");
//     const errorSpan = input.nextElementSibling;
//     if (errorSpan && errorSpan.classList.contains("error-message")) {
//     errorSpan.textContent = "";
//     }
// });
// submitButton.disabled = true;
// }

// document.addEventListener("click", function (event) {
// if (event.target.closest(".edit")) {
//     const studentRow = event.target.closest("tr");
//     const group = studentRow.children[1].textContent;
//     const name = studentRow.children[2].textContent.split(" ");
//     const gender = studentRow.children[3].textContent;
//     const birthday = studentRow.children[4].textContent;

//     groupInput.value = group;
//     firstNameInput.value = name[0];
//     lastNameInput.value = name[1];
//     genderInput.value = gender;
//     birthdayInput.value = birthday;

//     editingStudentRow = studentRow;
//     openModal("Edit Student", "Save");
// }
// });

// [closeModalButton, cancelButton].forEach(button => {
// button.addEventListener("click", () => {
//     studentModal.style.display = "none";
//     studentForm.reset();
//     editingStudentRow = null;
// });
// });

// window.addEventListener("click", function (event) {
// if (event.target === studentModal) {
//     studentModal.style.display = "none";
//     studentForm.reset();
//     editingStudentRow = null;
// }
// });


// const studentModal = document.getElementById("studentModal");
// const modalTitle = document.getElementById("modalTitle");
// const studentForm = document.getElementById("studentForm");
// const submitButton = document.getElementById("submitButton");
// const cancelButton = document.getElementById("cancelButton");
// const closeModalButton = document.querySelector(".close");

// let editingStudentRow = null;

// [firstNameInput, lastNameInput, birthdayInput].forEach(input => {
// input.addEventListener("input", () => {
// validateInput(input, validationRules[input.id]);
// checkFormValidity();
// });
// });

// function resetValidation() {
// [firstNameInput, lastNameInput, birthdayInput].forEach(input => {
// input.classList.remove("input-error");
// const errorSpan = input.nextElementSibling;
// if (errorSpan && errorSpan.classList.contains("error-message")) {
//   errorSpan.textContent = "";
// }
// });
// submitButton.disabled = true;
// }

// function openStudentModal(isEdit, studentData = null) {
// studentForm.reset();
// resetValidation();
// editingStudentRow = null;

// if (isEdit && studentData) {
// modalTitle.textContent = "Edit Student";
// submitButton.textContent = "Save";

// groupInput.value = studentData.group;
// firstNameInput.value = studentData.firstName;
// lastNameInput.value = studentData.lastName;
// genderInput.value = studentData.gender;
// birthdayInput.value = studentData.birthday;

// editingStudentRow = studentData.row;
// } else {
// modalTitle.textContent = "Add Student";
// submitButton.textContent = "Create";
// }

// studentModal.style.display = "block";
// checkFormValidity();
// }

// document.getElementById("openModal").addEventListener("click", () => openStudentModal(false));

// document.addEventListener("click", (e) => {
// if (e.target.closest(".edit")) {
// const row = e.target.closest("tr");
// const group = row.children[1].textContent;
// const [firstName, lastName] = row.children[2].textContent.trim().split(" ");
// const gender = row.children[3].textContent;
// const birthday = row.children[4].textContent;

// openStudentModal(true, { group, firstName, lastName, gender, birthday, row });
// }
// });

// [closeModalButton, cancelButton].forEach(btn => {
// btn.addEventListener("click", () => {
// studentModal.style.display = "none";
// studentForm.reset();
// editingStudentRow = null;
// resetValidation();
// });
// });

// window.addEventListener("click", (e) => {
// if (e.target === studentModal) {
// studentModal.style.display = "none";
// studentForm.reset();
// editingStudentRow = null;
// resetValidation();
// }
// });

// studentForm.addEventListener("submit", (e) => {
// e.preventDefault();
// if (submitButton.disabled) return;

// const group = groupInput.value;
// const firstName = firstNameInput.value.trim();
// const lastName = lastNameInput.value.trim();
// const gender = genderInput.value;
// const birthday = birthdayInput.value.trim();

// if (!group || !firstName || !lastName || !gender || !birthday) return;

// const tbody = document.querySelector("tbody");

// if (editingStudentRow) {
// editingStudentRow.children[1].textContent = group;
// editingStudentRow.children[2].innerHTML = `<strong>${firstName} ${lastName}</strong>`;
// editingStudentRow.children[3].textContent = gender;
// editingStudentRow.children[4].textContent = birthday;
// } else {
// const newRow = document.createElement("tr");
// newRow.innerHTML = `
//   <td><input type="checkbox" class="rowCheckbox"></td>
//   <td>${group}</td>
//   <td><strong>${firstName} ${lastName}</strong></td>
//   <td>${gender}</td>
//   <td>${birthday}</td>
//   <td><span class="status gray"></span></td>
//   <td>
//     <button class="edit" aria-label="Edit Student"><i class="fas fa-edit"></i></button>
//     <button class="delete" aria-label="Delete Student"><i class="fas fa-times"></i></button>
//   </td>`;
// tbody.appendChild(newRow);
// }

// studentModal.style.display = "none";
// studentForm.reset();
// resetValidation();
// editingStudentRow = null;
// });


// // ======= Delete All Selected Students ======= //
// const deleteAllModal = document.getElementById("deleteAllStudentsModal");
// const closeDeleteAllModalBtn = document.querySelector(".close-delete-all");
// const cancelDeleteAllBtn = document.getElementById("cancelDeleteAll");
// const confirmDeleteAllBtn = document.getElementById("confirmDeleteAll");

// selectAllCheckbox.addEventListener("change", () => {
// document.querySelectorAll(".rowCheckbox").forEach(cb => cb.checked = selectAllCheckbox.checked);
// deleteAllBtn.style.display = selectAllCheckbox.checked ? "inline-block" : "none";
// });

// document.addEventListener("change", (e) => {
// if (e.target.classList.contains("rowCheckbox")) {
//     const checkboxes = document.querySelectorAll(".rowCheckbox");
//     const allChecked = Array.from(checkboxes).every(cb => cb.checked);
//     selectAllCheckbox.checked = allChecked;
//     deleteAllBtn.style.display = Array.from(checkboxes).some(cb => cb.checked) ? "inline-block" : "none";
// }
// });

// deleteAllBtn.addEventListener("click", () => deleteAllModal.style.display = "block");

// [closeDeleteAllModalBtn, cancelDeleteAllBtn].forEach(btn => {
// btn.addEventListener("click", () => deleteAllModal.style.display = "none");
// });

// confirmDeleteAllBtn.addEventListener("click", () => {
// document.querySelector("tbody").innerHTML = "";
// selectAllCheckbox.checked = false;
// deleteAllBtn.style.display = "none";
// deleteAllModal.style.display = "none";
// });
