export function renderNavbar(activePage) {// Função para renderizar a barra de navegação com base na página ativa
    // Obtém o utilizador da sessão ativa do localStorage
    const utilizador = JSON.parse(localStorage.getItem("sessaoAtiva"));

    // Se não houver utilizador na sessão ativa, redireciona para a página de login
    if (!utilizador) {
        window.location.href = "/html/login.html";
        return;
    }

    const nivel = Math.floor(utilizador.xp / 200) + 1;// Calcula o nível do utilizador com base no XP

    // Define as páginas da barra de navegação com base no papel do utilizador (admin ou não)
    const pages = [
        { nome: "Início", href: "/html/principal.html", icon: "fa-house" },
        { nome: "Sessões", href: "/html/foco.html", icon: "fa-stopwatch" },
        { nome: "Tarefas", href: "/html/tarefas.html", icon: "fa-list-check" },
        { nome: "Conquistas", href: "/html/conquistas.html", icon: "fa-trophy" },
        { nome: "Estatísticas", href: "/html/estatisticas.html", icon: "fa-chart-simple" },
        { nome: "Definições", href: utilizador.role === "admin" ? "/html/admin.html" : "/html/perfil.html", icon: "fa-gear" }
    ];

    // Renderiza a barra lateral com o logotipo, menu de navegação e perfil do utilizador
    document.getElementById("sidebar").innerHTML = `
        <aside class="sidebar">
            <img src="/img/logotipo.png" class="logo" />
            <nav class="menu">
                ${pages.map(p => `
                    <a href="${p.href}" class="menu-item ${activePage === p.nome ? "active" : ""}">
                        <i class="fa-solid ${p.icon}"></i>
                        <span>${p.nome}</span>
                    </a>
                `).join("")}
            </nav>
            <div class="user-profile">
                <i class="fa-solid fa-circle-user fa-2x"></i>
                <h4>${utilizador.nome}</h4>
                <p>Nível ${nivel} ›</p>
            </div>
        </aside>
    `;
}