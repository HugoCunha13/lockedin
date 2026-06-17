import { renderNavbar } from "./navbarView.js";
import { calcularProgressoMissao } from "../utils/missoes.js";

const sessao = JSON.parse(localStorage.getItem("sessaoAtiva"));
const token = localStorage.getItem("token");

if (!sessao || !token) {
    window.location.href = "/html/login.html";
}

renderNavbar("Início");

async function carregarPrincipal() {

    const [resUtilizador, resMissoes] = await Promise.all([
        fetch(`http://localhost:3000/users/${sessao.id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("http://localhost:3000/missoes", {
            headers: { "Authorization": `Bearer ${token}` }
        })
    ]);

    if (!resUtilizador.ok || !resMissoes.ok) {
        localStorage.removeItem("sessaoAtiva");
        localStorage.removeItem("token");
        window.location.href = "/html/login.html";
        return;
    }

    const utilizador = await resUtilizador.json();
    const dadosMissoes = await resMissoes.json();
    const missoes = Array.isArray(dadosMissoes) ? dadosMissoes : [];
    const hoje = calcularMinutosHoje(utilizador.sessoes);
    const semana = calcularMinutosSemana(utilizador.sessoes);
    const sequencia = calcularSequencia(utilizador.sessoes);

    const content = document.getElementById("content");

    content.innerHTML = `
        <div class="page-header">
            <h1>Bem-vindo de volta ${utilizador.nome}</h1>
            <p>Foca-te no que importa e ganha recompensas pelo teu progresso</p>
        </div>

        <div class="principal-grid">

            <div class="card">
                <h3>Próxima missão</h3>
                ${(() => {
                    const missoesPendentes = missoes.filter(m => !(utilizador.missoesConcluidas || []).includes(m.id));
                    return missoesPendentes.length === 0
                        ? `<p class="sem-missoes">Sem missões disponíveis</p>`
                        : missoesPendentes.map(m => {
                            const { atual, meta } = calcularProgressoMissao(utilizador, m);
                            const atualLimitado = Math.min(atual, meta);
                            const percentagem = Math.min(100, Math.round((atual / meta) * 100));
                            return `
                            <div class="missao-item">
                                <div class="missao-top">
                                    <p class="missao-titulo">${m.titulo}</p>
                                    <span class="missao-progresso">${atualLimitado}/${meta}</span>
                                </div>
                                <p class="missao-xp">Ganha ${m.xpRecompensa} XP</p>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${percentagem}%"></div>
                                </div>
                            </div>
                        `;
                        }).join("");
                })()}
            </div>

            <div class="right-col">
                <div class="focus-card" onclick="window.location.href='/html/foco.html'" style="cursor: pointer">
                    <p>stay focused</p>
                    <div class="focus-icon">
                        <i class="fa-solid fa-lock"></i>
                    </div>
                    <h2>LOCKED IN</h2>
                </div>

                <div class="stats-row">
                    <div class="stat-card">
                        <span class="stat-label"><i class="fa-solid fa-check"></i> Hoje</span>
                        <span class="stat-value">${formatarMinutos(hoje)}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label"><i class="fa-solid fa-calendar"></i> Esta semana</span>
                        <span class="stat-value">${formatarMinutos(semana)}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">🔥 Sequência</span>
                        <span class="stat-value">${sequencia} dias</span>
                    </div>
                </div>
            </div>

        </div>
    `;
}

function calcularMinutosHoje(sessoes) {
    if (!sessoes || sessoes.length === 0) return 0;
    const hoje = new Date().toDateString();
    return sessoes
        .filter(s => new Date(s.dataInicio).toDateString() === hoje)
        .reduce((total, s) => total + (s.duracao || 0), 0);
}

function calcularMinutosSemana(sessoes) {
    if (!sessoes || sessoes.length === 0) return 0;
    const agora = new Date();
    const inicioSemana = new Date(agora);
    inicioSemana.setDate(agora.getDate() - agora.getDay());
    inicioSemana.setHours(0, 0, 0, 0);
    return sessoes
        .filter(s => new Date(s.dataInicio) >= inicioSemana)
        .reduce((total, s) => total + (s.duracao || 0), 0);
}

function calcularSequencia(sessoes) {
    if (!sessoes || sessoes.length === 0) return 0;
    const dias = [...new Set(sessoes.map(s => new Date(s.dataInicio).toDateString()))];
    let sequencia = 0;
    const hoje = new Date();
    for (let i = 0; i < 365; i++) {
        const dia = new Date(hoje);
        dia.setDate(hoje.getDate() - i);
        if (dias.includes(dia.toDateString())) {
            sequencia++;
        } else {
            break;
        }
    }
    return sequencia;
}

function formatarMinutos(minutos) {
    if (minutos < 60) return `${minutos}min`;
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

carregarPrincipal();