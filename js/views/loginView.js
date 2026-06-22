const form = document.getElementById("loginForm");//Guarda uma referência ao formulário

form.addEventListener("submit", async function(e) {//Executa a função quando o utilizador carrega em "Entrar"
    e.preventDefault();// Impede o comportamento padrão de envio do formulário para evitar recarregar a página

    // Obtém os valores dos campos de email e password do formulário
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("http://localhost:3000/login", {//Envia os dados do formulário para o servidor para autenticação
            method: "POST",//Usa POST porque estamos a enviar dados
            headers: { "Content-Type": "application/json" },//Indica que os dados estão em formato JSON
            body: JSON.stringify({ email, password })//Converte os dados do formulário em uma string JSON para enviar no corpo do pedido
        });

        if (!response.ok) {
            mostrarErro("Email ou palavra-passe incorretos.");
            return;
        }// Se a resposta não for bem-sucedida, exibe uma mensagem de erro e retorna

        const data = await response.json();//Le a resposta do servidor e converte em objeto JavaScript

        // Armazena o token de acesso e os dados do utilizador no localStorage para manter a sessão ativa
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("sessaoAtiva", JSON.stringify(data.user));

        window.location.href = "/html/principal.html";

    } catch (err) {
        mostrarErro("Erro ao ligar ao servidor.");
    }// SE ocorrer algum erro durante o try mostra a mensagem de erro
});

// Função para exibir mensagens de erro no formulário de login
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