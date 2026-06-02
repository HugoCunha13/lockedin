export function renderNavbar(activePage) {
    const utilizador = JSON.parse(localStorage.getItem("sessaoAtiva"));

    if (!utilizador) {
        window.location.href = "/html/login.html";
        return;
    }

    const nivel = Math.floor(utilizador.xp / 200) + 1;

    const pages = [
        { nome: "Início", href: "/html/principal.html", icon: "fa-house" },
        { nome: "Sessões", href: "/html/foco.html", icon: "fa-stopwatch" },
        { nome: "Tarefas", href: "/html/tarefas.html", icon: "fa-list-check" },
        { nome: "Conquistas", href: "/html/conquistas.html", icon: "fa-trophy" },
        { nome: "Estatísticas", href: "/html/estatisticas.html", icon: "fa-chart-simple" },
        { nome: "Definições", href: utilizador.role === "admin" ? "/html/admin.html" : "/html/perfil.html", icon: "fa-gear" }
    ];


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