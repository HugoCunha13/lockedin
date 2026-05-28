import Utilizador from "../models/utilizadorModel.js";

const form = document.getElementById("loginForm");

form.addEventListener("submit", function(e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const utilizadores = JSON.parse(localStorage.getItem("utilizadores")) || [];

    const encontrado = utilizadores.find(function(u) {
        return u.email === email && u.password === password;
    });

    if (!encontrado) {
        mostrarErro("Email ou palavra-passe incorretos.");
        return;
    }

    localStorage.setItem("sessaoAtiva", JSON.stringify(encontrado));
    window.location.href = "principal.html";
});

function mostrarErro(mensagem) {
    let erro = document.getElementById("erroLogin");

    if (!erro) {
        erro = document.createElement("p");
        erro.id = "erroLogin";
        erro.style.color = "red";
        erro.style.fontSize = "0.85rem";
        erro.style.marginTop = "8px";
        erro.style.textAlign = "center";
        form.appendChild(erro);
    }

    erro.textContent = mensagem;
}