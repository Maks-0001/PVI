const loginForm = document.getElementById("loginForm"); //

loginForm.addEventListener("submit", async (e) => { //
  e.preventDefault(); //

  const username = document.getElementById("username").value.trim(); //
  const password = document.getElementById("password").value.trim(); //

  try {
    const response = await fetch("/Lab_1/server/controllers/authorization.php?action=login", { //
      method: "POST", //
      headers: { "Content-Type": "application/json" }, //
      credentials: "include", //
      body: JSON.stringify({ username, password }), //
    });

    const result = await response.json(); //

    if (result.success) { //
      // Зберігаємо ім'я користувача у локальному сховищі
      localStorage.setItem("username", result.username); //
      // Зберігаємо ID користувача та токен для чату
      if (result.user_id) {
        localStorage.setItem("user_id", result.user_id);
      }
      if (result.chat_token) {
        localStorage.setItem("chat_token", result.chat_token);
      }

      // Переходимо до основної сторінки
      window.location.href = "/Lab_1/app/index.php"; //
    } else {
      alert(result.error || "Access denied. Invalid username or password."); //
    }
  } catch (error) {
    console.error("Error during login:", error); //
    alert("An error occurred while trying to log in. Please try again."); //
  }
});