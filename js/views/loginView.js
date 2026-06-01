const form = document.getElementById("loginForm");

form.addEventListener("submit", async function(e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            mostrarErro("Email ou palavra-passe incorretos.");
            return;
        }

        const data = await response.json();

        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("sessaoAtiva", JSON.stringify(data.user));

        window.location.href = "/html/principal.html";

    } catch (err) {
        mostrarErro("Erro ao ligar ao servidor.");
    }
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