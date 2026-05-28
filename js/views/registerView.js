import Utilizador from "../models/utilizadorModel.js";

const form = document.getElementById("registerForm");

form.addEventListener("submit", function(e) {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmar = document.getElementById("confirmPassword").value;

    if (password !== confirmar) {
        mostrarErro("As palavras-passe não coincidem.");
        return;
    }

    const utilizadores = JSON.parse(localStorage.getItem("utilizadores")) || [];

    const jaExiste = utilizadores.find(function(u) {
        return u.email === email;
    });

    if (jaExiste) {
        mostrarErro("Já existe uma conta com este email.");
        return;
    }

    const novoUtilizador = new Utilizador(nome, email, password);
    utilizadores.push(novoUtilizador);
    localStorage.setItem("utilizadores", JSON.stringify(utilizadores));

    localStorage.setItem("sessaoAtiva", JSON.stringify(novoUtilizador));
    window.location.href = "principal.html";
});

function mostrarErro(mensagem) {
    let erro = document.getElementById("erroRegister");

    if (!erro) {
        erro = document.createElement("p");
        erro.id = "erroRegister";
        erro.style.color = "red";
        erro.style.fontSize = "0.85rem";
        erro.style.marginTop = "8px";
        erro.style.textAlign = "center";
        form.appendChild(erro);
    }

    erro.textContent = mensagem;
}