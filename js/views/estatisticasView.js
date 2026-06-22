import { renderNavbar } from "./navbarView.js";

// Verifica se há uma sessão ativa e um token de autenticação no localStorage, caso contrário redireciona para a página de login
const sessao = JSON.parse(localStorage.getItem("sessaoAtiva"));
const token = localStorage.getItem("token");

// Se não houver sessão ativa ou token, redireciona para a página de login
if (!sessao || !token) {
    window.location.href = "/html/login.html";
}

renderNavbar("Estatísticas");// Renderiza a barra de navegação com a página "Estatísticas" como ativa

// Função principal para carregar e exibir as estatísticas do utilizador
async function carregarEstatisticas() {

    // Faz uma requisição para obter os dados do utilizador usando o ID da sessão ativa e o token de autenticação
    const resposta = await fetch(`http://localhost:3000/users/${sessao.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    // Se a resposta não for bem-sucedida, redireciona para a página de login
    if (!resposta.ok) {
        window.location.href = "/html/login.html";
        return;
    }

    // Converte a resposta em JSON para obter os dados do utilizador
    const utilizador = await resposta.json();
    const sessoes = utilizador.sessoes || [];

    // Calcula o nível do utilizador, XP atual, XP faltando para o próximo nível e a percentagem de progresso para o próximo nível
    const nivel = Math.floor(utilizador.xp / 200) + 1;
    const xpAtual = utilizador.xp % 200;
    const xpFalta = 200 - xpAtual;
    const xpPercent = Math.round((xpAtual / 200) * 100);

    // Calcula o total de sessões, minutos focados hoje, minutos focados na semana, consistência diária, dados para o gráfico semanal, análise geral e progresso para o objetivo mensal
    const totalSessoes = utilizador.estatisticas?.totalSessoes || sessoes.length;
    const minutosHoje = calcularMinutosHoje(sessoes);
    const minutosSemana = calcularMinutosSemana(sessoes);
    const consistencia = calcularConsistencia(sessoes);
    const dadosSemana = calcularDadosSemana(sessoes);
    const analise = calcularAnalise(sessoes, utilizador);
    const objetivoMensal = calcularObjetivoMensal(sessoes);

    // Seleciona o elemento de conteúdo da página e insere o HTML para exibir as estatísticas do utilizador, incluindo gráficos, barras de progresso e informações detalhadas
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

    // Cria um gráfico de barras usando a biblioteca Chart.js para mostrar os minutos focados em cada dia da semana
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

// Função para calcular os minutos focados hoje, filtrando as sessões que ocorreram no dia atual e somando suas durações
function calcularMinutosHoje(sessoes) {
    const hoje = new Date().toDateString();
    return sessoes
        .filter(s => new Date(s.dataInicio).toDateString() === hoje)
        .reduce((total, s) => total + (s.duracao || 0), 0);
}

// Função para calcular os minutos focados na semana atual, filtrando as sessões que ocorreram desde o início da semana e somando suas durações
function calcularMinutosSemana(sessoes) {
    const agora = new Date();
    const inicioSemana = new Date(agora);
    inicioSemana.setDate(agora.getDate() - agora.getDay());
    inicioSemana.setHours(0, 0, 0, 0);
    return sessoes
        .filter(s => new Date(s.dataInicio) >= inicioSemana)
        .reduce((total, s) => total + (s.duracao || 0), 0);
}

// Função para calcular a consistência diária do utilizador, verificando se houve sessões em cada um dos últimos 7 dias e retornando um array de booleanos indicando a presença ou ausência de sessões
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

// Função para calcular os minutos focados em cada dia da semana, filtrando as sessões que ocorreram na semana atual e somando suas durações por dia
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

// Função para calcular uma análise geral do utilizador, incluindo o dia mais focado, a duração média das sessões, o XP ganho na semana e uma dica personalizada com base nos hábitos de foco do utilizador
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

// Função para calcular o progresso do utilizador em relação a um objetivo mensal de 25 horas, filtrando as sessões que ocorreram no mês atual, somando suas durações e calculando a percentagem do objetivo alcançada
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

// Função para formatar os minutos focados em um formato legível, convertendo para horas e minutos quando apropriado
function formatarMinutos(minutos) {
    if (minutos === 0) return "0min";
    if (minutos < 60) return `${minutos}min`;
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

carregarEstatisticas(); 