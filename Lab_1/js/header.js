
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
