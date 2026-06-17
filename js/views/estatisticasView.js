import { renderNavbar } from "./navbarView.js";

const sessao = JSON.parse(localStorage.getItem("sessaoAtiva"));
const token = localStorage.getItem("token");

if (!sessao || !token) {
    window.location.href = "/html/login.html";
}

renderNavbar("Estatísticas");

async function carregarEstatisticas() {

    const resposta = await fetch(`http://localhost:3000/users/${sessao.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!resposta.ok) {
        window.location.href = "/html/login.html";
        return;
    }

    const utilizador = await resposta.json();
    const sessoes = utilizador.sessoes || [];

    const nivel = Math.floor(utilizador.xp / 200) + 1;
    const xpAtual = utilizador.xp % 200;
    const xpFalta = 200 - xpAtual;
    const xpPercent = Math.round((xpAtual / 200) * 100);

    const totalSessoes = utilizador.estatisticas?.totalSessoes || sessoes.length;
    const minutosHoje = calcularMinutosHoje(sessoes);
    const minutosSemana = calcularMinutosSemana(sessoes);
    const consistencia = calcularConsistencia(sessoes);
    const dadosSemana = calcularDadosSemana(sessoes);
    const analise = calcularAnalise(sessoes, utilizador);
    const objetivoMensal = calcularObjetivoMensal(sessoes);

    const content = document.getElementById("content");

    content.innerHTML = `
        <div class="stats-grid">

            <div class="row row-2">
                <div class="card">
                    <h3>Gráfico semanal:</h3>
                    <canvas id="graficoSemanal" height="90"></canvas>
                </div>
                <div class="card-centrado">
                    <h3>O teu progresso:</h3>
                    <div class="nivel-container">
                        <div class="nivel-icon">
                            <i class="fa-solid fa-trophy"></i>
                        </div>
                        <div class="nivel-texto">
                            <h2>Nível ${nivel}</h2>
                        </div>
                    </div>
                    <div class="xp-bar">
                        <div class="xp-fill" style="width: ${xpPercent}%"></div>
                    </div>
                    <p class="xp-info">Falta ${xpFalta} XP para o próximo nível</p>
                    <p class="xp-info">${xpPercent}% completo</p>
                </div>
            </div>

            <div class="row row-2">
                <div class="card">
                    <h3>Tempo focado</h3>
                    <div class="tempo-item">
                        <p class="label">Sessões concluídas</p>
                        <p class="valor">${totalSessoes} 🔥</p>
                    </div>                    
                    <div class="tempo-item">
                        <p class="label">Hoje</p>
                        <p class="valor">${formatarMinutos(minutosHoje)}</p>
                    </div>
                    <div class="tempo-item">
                        <p class="label">Semana</p>
                        <p class="valor">${formatarMinutos(minutosSemana)}</p>
                    </div>
                </div>
                <div class="card-centrado">
                    <h3>A tua consistência:</h3>
                    <div class="consistencia-dots">
                        ${consistencia.map(ativo => `
                            <div class="dot ${ativo ? "ativo" : "inativo"}"></div>
                        `).join("")}
                    </div>
                    <p class="consistencia-label">Últimos 7 dias</p>
                </div>
            </div>

            <div class="row row-2">
                <div class="card">
                    <h3>Análise geral:</h3>
                    <ul class="analise-lista">
                        <li>Dia mais focado: ${analise.diaMaisFocado}</li>
                        <li>Sessão média: ${analise.sessaoMedia} min</li>
                        <li>+${analise.xpSemana} XP esta semana</li>
                        <li>${analise.dica}</li>
                    </ul>
                </div>
                <div class="card">
                    <h3>Objetivo mensal</h3>
                    <p class="objetivo-sub">Definido automaticamente em: 25h</p>
                    <div class="objetivo-valores">
                        <span class="objetivo-atual">${formatarMinutos(objetivoMensal.atual)}</span>
                        <span class="objetivo-total">/25h</span>
                    </div>
                    <div class="objetivo-bar">
                        <div class="objetivo-fill" style="width: ${objetivoMensal.percent}%"></div>
                    </div>
                    <p class="objetivo-info">${objetivoMensal.percent}% do objetivo</p>
                </div>
            </div>
        </div>
    `;

    new Chart(document.getElementById("graficoSemanal"), {
        type: "bar",
        data: {
            labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
            datasets: [{
                data: dadosSemana,
                backgroundColor: "#2b78ff",
                borderRadius: 6
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    ticks: { callback: v => v + " min" },
                    grid: { color: "#f0f0f0" }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

function calcularMinutosHoje(sessoes) {
    const hoje = new Date().toDateString();
    return sessoes
        .filter(s => new Date(s.dataInicio).toDateString() === hoje)
        .reduce((total, s) => total + (s.duracao || 0), 0);
}

function calcularMinutosSemana(sessoes) {
    const agora = new Date();
    const inicioSemana = new Date(agora);
    inicioSemana.setDate(agora.getDate() - agora.getDay());
    inicioSemana.setHours(0, 0, 0, 0);
    return sessoes
        .filter(s => new Date(s.dataInicio) >= inicioSemana)
        .reduce((total, s) => total + (s.duracao || 0), 0);
}

function calcularConsistencia(sessoes) {
    const resultado = [];
    const hoje = new Date();
    for (let i = 6; i >= 0; i--) {
        const dia = new Date(hoje);
        dia.setDate(hoje.getDate() - i);
        const diaStr = dia.toDateString();
        const teveSessao = sessoes.some(s => new Date(s.dataInicio).toDateString() === diaStr);
        resultado.push(teveSessao);
    }
    return resultado;
}

function calcularDadosSemana(sessoes) {
    const dias = [0, 0, 0, 0, 0, 0, 0];
    const agora = new Date();
    const inicioSemana = new Date(agora);
    inicioSemana.setDate(agora.getDate() - agora.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    sessoes
        .filter(s => new Date(s.dataInicio) >= inicioSemana)
        .forEach(s => {
            let diaSemana = new Date(s.dataInicio).getDay();
            diaSemana = diaSemana === 0 ? 6 : diaSemana - 1;
            dias[diaSemana] += s.duracao || 0;
        });

    return dias;
}

function calcularAnalise(sessoes, utilizador) {
    const diasNomes = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
    const porDia = [0, 0, 0, 0, 0, 0, 0];

    sessoes.forEach(s => {
        const dia = new Date(s.dataInicio).getDay();
        porDia[dia] += s.duracao || 0;
    });

    const maxDia = porDia.indexOf(Math.max(...porDia));
    const diaMaisFocado = sessoes.length > 0 ? diasNomes[maxDia] : "---";

    const sessaoMedia = sessoes.length > 0
        ? Math.round(sessoes.reduce((t, s) => t + (s.duracao || 0), 0) / sessoes.length)
        : 0;

    const agora = new Date();
    const inicioSemana = new Date(agora);
    inicioSemana.setDate(agora.getDate() - agora.getDay());
    inicioSemana.setHours(0, 0, 0, 0);
    const sessoesSemana = sessoes.filter(s => new Date(s.dataInicio) >= inicioSemana).length;
    const xpSemana = sessoesSemana * 50;

    const dica = sessoes.length === 0
        ? "Começa a tua primeira sessão!"
        : "Focas-te mais ao final do dia";

    return { diaMaisFocado, sessaoMedia, xpSemana, dica };
}

function calcularObjetivoMensal(sessoes) {
    const agora = new Date();
    const minutosMes = sessoes
        .filter(s => {
            const d = new Date(s.dataInicio);
            return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear();
        })
        .reduce((total, s) => total + (s.duracao || 0), 0);

    const objetivo = 1500;
    const percent = Math.min(Math.round((minutosMes / objetivo) * 100), 100);

    return { atual: minutosMes, percent };
}

function formatarMinutos(minutos) {
    if (minutos === 0) return "0min";
    if (minutos < 60) return `${minutos}min`;
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

carregarEstatisticas(); 