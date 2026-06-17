import { renderNavbar } from "./navbarView.js";
import Missao from "../models/missaoModel.js";

const sessao = JSON.parse(localStorage.getItem("sessaoAtiva"));
const token = localStorage.getItem("token");

if (!sessao || !token) {
    window.location.href = "/html/login.html";
}

if (sessao.role !== "admin") {
    window.location.href = "/html/principal.html";
}

renderNavbar("Admin");

async function carregarAdmin() {

    const [resUtilizador, resUsers] = await Promise.all([
        fetch(`http://localhost:3000/users/${sessao.id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("http://localhost:3000/users", {
            headers: { "Authorization": `Bearer ${token}` }
        })
    ]);

    if (!resUtilizador.ok) {
        window.location.href = "/html/login.html";
        return;
    }

    const utilizador = await resUtilizador.json();
    const todosUtilizadores = await resUsers.json();
    const nivel = Math.floor(utilizador.xp / 200) + 1;
    const inicial = utilizador.nome[0].toUpperCase();

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
                    <h3>Gerir utilizadores</h3>
                    <p class="card-subtitle">Gere os utilizadores da plataforma</p>
                    <table class="users-table">
                        <thead>
                            <tr>
                                <th>Nome/id</th>
                                <th>Cargo</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${todosUtilizadores.map(u => `
                                <tr>
                                    <td>${u.nome}/${u.id}</td>
                                    <td>${u.role === "admin" ? "admin" : "utilizador"}</td>
                                    <td class="user-actions">
                                        ${u.role === "admin"
                                            ? `<button class="btn-role btn-tirar" data-id="${u.id}">Tirar admin</button>`
                                            : `<button class="btn-role btn-dar" data-id="${u.id}">Dar admin</button>`
                                        }
                                        <button class="btn-excluir" data-id="${u.id}">Excluir conta</button>
                                    </td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>

                <div class="card">
                    <h3>Criar missões</h3>
                    <p class="card-subtitle">Cria missões para os utilizadores</p>
                    <div class="field">
                        <span class="field-label">Título</span>
                        <input type="text" id="missaoTitulo" class="missao-input" placeholder="Título da missão" />
                    </div>
                    <div class="field">
                        <span class="field-label">Descrição</span>
                        <input type="text" id="missaoDescricao" class="missao-input" placeholder="Descrição" />
                    </div>
                    <div class="field">
                        <span class="field-label">Tipo</span>
                        <select id="missaoTipo" class="missao-input">
                            <option value="sessao">Completar sessões de foco</option>
                            <option value="tarefa">Completar tarefas</option>
                            <option value="tempo">Estudar X minutos</option>
                        </select>
                    </div>
                    <div class="field">
                        <span class="field-label">Meta</span>
                        <input type="number" id="missaoMeta" class="missao-input" placeholder="Ex: 1 sessão, 30 minutos" />
                    </div>
                    <div class="field">
                        <span class="field-label">Recompensa</span>
                        <input type="number" id="missaoXP" class="missao-input" placeholder="XP" />
                    </div>
                    <button class="btn-send" id="btnCriarMissao">Criar missão</button>
                </div>

            </div>
        </div>
    `;

    document.getElementById("btnLogout").addEventListener("click", function () {
        localStorage.removeItem("sessaoAtiva");
        localStorage.removeItem("token");
        window.location.href = "/html/login.html";
    });

    document.querySelectorAll(".btn-role").forEach(btn => {
        btn.addEventListener("click", async function () {
            const id = this.dataset.id;
            const novoRole = this.classList.contains("btn-dar") ? "admin" : "user";
            await fetch(`http://localhost:3000/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ role: novoRole })
            });
            carregarAdmin();
        });
    });

    document.querySelectorAll(".btn-excluir").forEach(btn => {
        btn.addEventListener("click", async function () {
            const id = this.dataset.id;
            await fetch(`http://localhost:3000/users/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            carregarAdmin();
        });
    });

    document.getElementById("btnCriarMissao").addEventListener("click", async function () {
        const titulo = document.getElementById("missaoTitulo").value.trim();
        const descricao = document.getElementById("missaoDescricao").value.trim();
        const tipo = document.getElementById("missaoTipo").value;
        const meta = parseInt(document.getElementById("missaoMeta").value);
        const xp = parseInt(document.getElementById("missaoXP").value);

        if (!titulo || !descricao || !meta || !xp) return;

        const novaMissao = new Missao(titulo, descricao, tipo, meta, xp);

        await fetch("http://localhost:3000/missoes", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(novaMissao)
        });

        document.getElementById("missaoTitulo").value = "";
        document.getElementById("missaoDescricao").value = "";
        document.getElementById("missaoMeta").value = "";
        document.getElementById("missaoXP").value = "";

        this.textContent = "Missão criada!";
        this.disabled = true;
        setTimeout(() => { this.textContent = "Criar missão"; this.disabled = false; }, 2000);
    });
}

carregarAdmin();