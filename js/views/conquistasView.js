import { renderNavbar } from "./navbarView.js";

// Obtém a sessão ativa e o token do localStorage
const sessao = JSON.parse(localStorage.getItem("sessaoAtiva"));
const token = localStorage.getItem("token");

// Se não houver sessão ativa ou token, redireciona para a página de login
if (!sessao || !token) {
    window.location.href = "/html/login.html";
}

renderNavbar("Conquistas");// Renderiza a barra de navegação com a página "Conquistas" como ativa

// Função para carregar e exibir as conquistas do utilizador
async function carregarConquistas() {

    // Faz duas requisições em paralelo: uma para obter os dados do utilizador e outra para obter todas as conquistas disponíveis
    const [resUtilizador, resConquistas] = await Promise.all([
        fetch(`http://localhost:3000/users/${sessao.id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("http://localhost:3000/conquistas", {
            headers: { "Authorization": `Bearer ${token}` }
        })
    ]);

    // Se a requisição do utilizador falhar, redireciona para a página de login
    if (!resUtilizador.ok) {
        window.location.href = "/html/login.html";
        return;
    }

    //obtem os dados do utilizador e todas as conquistas disponíveis
    const utilizador = await resUtilizador.json();
    const todasConquistas = await resConquistas.json();

    // Filtra as conquistas do utilizador em duas categorias: conquistadas e não conquistadas
    const conquistadas = todasConquistas.filter(c => utilizador.conquistas.includes(c.id));
    const naoConquistadas = todasConquistas.filter(c => !utilizador.conquistas.includes(c.id));

    // Seleciona o elemento de conteúdo da página para exibir as conquistas
    const content = document.getElementById("content");

    content.innerHTML = `
        <div class="conquistas-card">
            <div class="tabs">
                <button class="tab active" data-tab="nao-conquistadas">
                    Não conquistadas (${naoConquistadas.length})
                </button>
                <button class="tab" data-tab="conquistadas">
                    Conquistadas (${conquistadas.length})
                </button>
            </div>

            <div class="tab-content" id="tab-nao-conquistadas">
                <div class="conquistas-grid">
                    ${naoConquistadas.map(c => `
                        <div class="conquista-item">
                            <div class="conquista-icon bloqueada">
                                <i class="fa-solid ${c.icone}"></i>
                            </div>
                            <div class="conquista-info">
                                <p class="conquista-nome">${c.nome}</p>
                                <p class="conquista-desc">${c.descricao}</p>
                            </div>
                            <i class="fa-solid fa-lock conquista-status lock"></i>
                        </div>
                    `).join("")}
                </div>
            </div>

            <div class="tab-content hidden" id="tab-conquistadas">
                <div class="conquistas-grid">
                    ${conquistadas.map(c => `
                        <div class="conquista-item conquistada">
                            <div class="conquista-icon" style="background: ${c.cor}">
                                <i class="fa-solid ${c.icone}"></i>
                            </div>
                            <div class="conquista-info">
                                <p class="conquista-nome">${c.nome}</p>
                                <p class="conquista-desc">${c.descricao}</p>
                            </div>
                            <i class="fa-solid fa-circle-check conquista-status check"></i>
                        </div>
                    `).join("")}
                </div>
            </div>
        </div>
    `;

    // Adiciona event listeners aos botões de aba para alternar entre as conquistas conquistadas e não conquistadas
    document.querySelectorAll(".tab").forEach(btn => {
        btn.addEventListener("click", function () {
            document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
            this.classList.add("active");

            const tabId = this.dataset.tab;
            document.querySelectorAll(".tab-content").forEach(t => t.classList.add("hidden"));
            document.getElementById(`tab-${tabId}`).classList.remove("hidden");
        });
    });
}

carregarConquistas();// Chama a função para carregar e exibir as conquistas do utilizador ao carregar a página