import { renderNavbar } from "./navbarView.js";

//Vai buscar a sessao ativa e o token do localStorage
const sessao = JSON.parse(localStorage.getItem("sessaoAtiva"));
const token = localStorage.getItem("token");

//Se não houver sessao ativa ou token, redireciona para a página de login
if (!sessao || !token) {
    window.location.href = "/html/login.html";
}

renderNavbar("Definições");//Renderiza a barra de navegação com a página "Definições" como ativa

//Função para carregar e exibir o perfil do utilizador
async function carregarPerfil() {

    //Faz uma requisição para obter os dados do utilizador com base no ID da sessão ativa
    const resposta = await fetch(`http://localhost:3000/users/${sessao.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    //Se a requisição falhar, redireciona para a página de login
    if (!resposta.ok) {
        window.location.href = "/html/login.html";
        return;
    }

    //Obtém os dados do utilizador da resposta da requisição
    const utilizador = await resposta.json();
    const nivel = Math.floor(utilizador.xp / 200) + 1;
    const inicial = utilizador.nome[0].toUpperCase();

    //Seleciona o elemento de conteúdo da página para exibir o perfil do utilizador
    const content = document.getElementById("content");

    content.innerHTML = `
        <div class="cards-grid">

            <div class="card">
                <h3>Perfil</h3>
                <div class="profile-user">
                    <div class="profile-avatar">${inicial}</div>
                    <div>
                        <p class="profile-name">${utilizador.nome}</p>
                        <p class="profile-level">Nível ${nivel}</p>
                    </div>
                </div>
                <div class="profile-fields">
                    <div class="field">
                        <span class="field-label">Nome</span>
                        <span class="field-value">${utilizador.nome}</span>
                        <span>›</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Email</span>
                        <span class="field-value">${utilizador.email}</span>
                        <span>›</span>
                    </div>
                    <div class="field">
                        <span class="field-label">Palavra-passe</span>
                        <span class="field-value">••••••••••</span>
                        <span>›</span>
                    </div>
                </div>
                <button class="btn-logout" id="btnLogout">
                    🚪 Terminar sessão
                </button>
            </div>

            <div class="right-col">

                <div class="card">
                    <h3>Notificações</h3>
                    <p class="card-subtitle">As tuas preferências de notificações</p>
                    <div class="notif-list">
                        <div class="notif-item">
                            <span>🔔</span>
                            <div class="notif-text">
                                <p class="notif-title">Lembretes de sessões</p>
                                <p class="notif-sub">Recebe lembretes para as tuas sessões de foco</p>
                            </div>
                            <label class="toggle">
                                <input type="checkbox" checked />
                                <span class="slider"></span>
                            </label>
                        </div>
                        <div class="notif-item">
                            <span>📋</span>
                            <div class="notif-text">
                                <p class="notif-title">Notificação de tarefas</p>
                                <p class="notif-sub">Recebe atualizações sobre as tuas tarefas</p>
                            </div>
                            <label class="toggle">
                                <input type="checkbox" checked />
                                <span class="slider"></span>
                            </label>
                        </div>
                        <div class="notif-item">
                            <span>📣</span>
                            <div class="notif-text">
                                <p class="notif-title">Dicas e sugestões</p>
                                <p class="notif-sub">Recebe dicas para seres mais produtivo</p>
                            </div>
                            <label class="toggle">
                                <input type="checkbox" />
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3>Dá-nos ideias</h3>
                    <p class="card-subtitle">Sugere funcionalidades ou melhorias para o Locked In</p>
                    <textarea id="ideiaInput" class="idea-textarea" placeholder="A tua ideia..." maxlength="500"></textarea>
                    <div class="idea-counter"><span id="counter">0</span>/500</div>
                    <button class="btn-send">➤ Enviar ideia</button>
                </div>

            </div>
        </div>
    `;

    // Adiciona event listeners para os botões e campos de entrada do perfil
    document.getElementById("btnLogout").addEventListener("click", function () {
        localStorage.removeItem("sessaoAtiva");
        localStorage.removeItem("token");
        window.location.href = "/html/login.html";
    });

    // Atualiza o contador de caracteres à medida que o utilizador digita na textarea
    document.getElementById("ideiaInput").addEventListener("input", function () {
        document.getElementById("counter").textContent = this.value.length;
    });

    // Adiciona um event listener ao botão de envio de ideias para enviar o feedback do utilizador
    document.querySelector(".btn-send").addEventListener("click", function () {
        const input = document.getElementById("ideiaInput");
        if (input.value.trim() === "") return;

        input.value = "";
        document.getElementById("counter").textContent = "0";

        const btn = this;
        btn.textContent = "Obrigado pelo feedback!";
        btn.disabled = true;

        setTimeout(() => {
            btn.textContent = "➤ Enviar ideia";
            btn.disabled = false;
        }, 2500);
    });
}

carregarPerfil();