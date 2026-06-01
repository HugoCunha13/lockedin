const form = document.getElementById("registerForm");

form.addEventListener("submit", async function(e) {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmar = document.getElementById("confirmPassword").value;

    if (password !== confirmar) {
        mostrarErro("As palavras-passe não coincidem.");
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nome,
                email,
                password,
                xp: 0,
                tarefas: [],
                sessoes: [],
                conquistas: [],
                estatisticas: {
                    totalTarefasConcluidas: 0,
                    totalSessoes: 0,
                    minutosEstudo: 0,
                    conquistasDesbloqueadas: 0,
                    xpTotal: 0
                }
            })
        });

        if (!response.ok) {
            mostrarErro("Já existe uma conta com este email.");
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