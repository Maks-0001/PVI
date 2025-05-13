document.addEventListener("DOMContentLoaded", () => {
  fetch("header.php")
    .then((response) => response.text())
    .then((data) => {
      document.getElementById("header-placeholder").innerHTML = data;

      
// Відображення імені користувача
const username = localStorage.getItem("username");
if (username) {
  const nameElement = document.getElementById("name");
  if (nameElement) {
    nameElement.textContent = username;
  }
}

      const script = document.createElement("script");
      script.src = "./js/functional.js";
      script.type = "text/javascript";
      document.head.appendChild(script);
    })
    .catch((error) => console.error('Error loading ${file}:', error));
});
