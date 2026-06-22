import Utilizador from "../models/utilizadorModel.js";//importa o model deutilizador, pois o model garante que todos utilizadores tenham a mesma estrutura 


const form = document.getElementById("registerForm");//Vai buscar o formulário de registo do HTML para adicionar um event listener que vai lidar com o envio do formulário

form.addEventListener("submit", async function(e) {//Escuta o envio do formulário e executa a função assíncrona para lidar com o registro do utilizador
    e.preventDefault();// Impede o comportamento padrão de envio do formulário para evitar recarregar a página

    const nome = document.getElementById("nome").value.trim();// Obtém o valor do campo de nome e remove espaços em branco extras com .trim()
    const email = document.getElementById("email").value.trim();// Obtém o valor do campo de email e remove espaços em branco extras com .trim()
    const password = document.getElementById("password").value;// Obtém o valor do campo de password
    const confirmar = document.getElementById("confirmPassword").value;// Obtém o valor do campo de confirmação de password

    if (password !== confirmar) {
        mostrarErro("As palavras-passe não coincidem.");
        return;
    }// Verifica se as palavras-passe coincidem e exibe uma mensagem de erro se não coincidirem

    try {//tudo o que está dentro do try é tentado, e se houver algum erro, o catch é executado para lidar com o erro
        const novoUtilizador = new Utilizador(nome, email, password);//Cria um novo objeto com o model

        const response = await fetch("http://localhost:3000/register", {//Ele serve para criar conta e devolver automaticamente um token
            method: "POST",//Usa POST porque estamos a criar
            headers: { "Content-Type": "application/json" },//Diz ao servidor que o corpo do pedido esta JSON
            body: JSON.stringify(novoUtilizador)//Converte o objeto para uma string JSON para enviar no corpo do pedido
        });

        if (!response.ok) {
            mostrarErro("Já existe uma conta com este email.");
            return;
        }// SE der erro, mostra a mensagem de erro

        const data = await response.json();//Transforma a resposta do servidor em objeto JavaScript

        localStorage.setItem("token", data.accessToken);//Guarda o token de acesso no localStorage para autenticação futura
        localStorage.setItem("sessaoAtiva", JSON.stringify(data.user));//Guarda os dados do utilizador no localStorage para manter a sessão ativa

        window.location.href = "/html/principal.html";//Redireciona o utilizador para a página principal após o registo bem-sucedido

    } catch (err) {
        mostrarErro("Erro ao ligar ao servidor.");
    }// SE ocorrer algum erro durante o try mostra a mensagem de erro
});

function mostrarErro(mensagem) {
    let erro = document.getElementById("erroRegister");// Verifica se o elemento de erro já existe no DOM

    // Se não existir, cria um novo elemento <p> para exibir a mensagem de erro
    if (!erro) {
        erro = document.createElement("p");
        erro.id = "erroRegister";
        erro.style.color = "red";
        erro.style.fontSize = "0.85rem";
        erro.style.marginTop = "8px";
        erro.style.textAlign = "center";
        form.appendChild(erro);
    }

    erro.textContent = mensagem;// Atualiza o conteúdo do elemento de erro com a mensagem fornecida
}