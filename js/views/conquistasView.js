import { renderNavbar } from "./navbarView.js";

const sessao = JSON.parse(localStorage.getItem("sessaoAtiva"));
const token = localStorage.getItem("token");

if (!sessao || !token) {
    window.location.href = "/html/login.html";
}

renderNavbar("Conquistas");

async function carregarConquistas() {

    const [resUtilizador, resConquistas] = await Promise.all([
        fetch(`http://localhost:3000/users/${sessao.id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("http://localhost:3000/conquistas", {
            headers: { "Authorization": `Bearer ${token}` }
        })
    ]);

    if (!resUtilizador.ok) {
        window.location.href = "/html/login.html";
        return;
    }

    const utilizador = await resUtilizador.json();
    const todasConquistas = await resConquistas.json();

    const conquistadas = todasConquistas.filter(c => utilizador.conquistas.includes(c.id));
    const naoConquistadas = todasConquistas.filter(c => !utilizador.conquistas.includes(c.id));

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

carregarConquistas();