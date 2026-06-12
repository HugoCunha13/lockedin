import { renderNavbar } from "./navbarView.js";
import Tarefa from "../models/tarefaModel.js";
import Sessao from "../models/sessaoModel.js";
import {
    NOMES_MESES, NOMES_DIAS, chaveDia, hojeChave,
    chaveParaData, diaPorExtenso, gerarGrelhaMes
} from "../utils/datas.js";

// Guarda de autenticação (mesmo padrão das outras páginas)
const sessao = JSON.parse(localStorage.getItem("sessaoAtiva"));
const token = localStorage.getItem("token");

if (!sessao || !token) {
    window.location.href = "login.html";
}

renderNavbar("Tarefas");

const content = document.getElementById("content");

// Estado da página
// As tarefas vivem dentro do utilizador (utilizador.tarefas), tal como no foco.
// Guardamos só o que muda: o utilizador, o mês mostrado e o dia selecionado.
let utilizador = null;
let dataVista = new Date();          // controla o mês desenhado no calendário
let diaSelecionado = hojeChave();    // dia cujo detalhe aparece no painel
let termoPesquisa = "";              // texto da barra de pesquisa (vazio = sem pesquisa)
let filtroEstado = "ativas";         // "ativas" ou "concluidas" dentro do dia selecionado

// Estado da sessão rápida
// O painel da direita tem dois modos: "lista" (tarefas do dia) e "sessao"
// (cronómetro Pomodoro embutido). Mantemos só uma sessão de cada vez e um
// único intervalo, para o cronómetro nunca correr duplicado.
let modoPainel = "lista";            // "lista" ou "sessao"
let tarefaSessao = null;             // tarefa que está a ser cronometrada
let intervalo = null;
let tempoTotal = 0;                  // segundos da sessão
let tempoRestante = 0;
let emPausa = false;
let timeoutAlternar = null;          // timeout do momento de recompensa no toggle

async function carregarPagina() {
    const response = await fetch(`http://localhost:3000/users/${sessao.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) {
        window.location.href = "login.html";
        return;
    }

    utilizador = await response.json();
    // Garantimos que os campos que a sessão rápida atualiza existem desde já,
    // para os cálculos de XP e estatísticas não falharem em utilizadores novos.
    utilizador.tarefas = utilizador.tarefas || [];
    utilizador.sessoes = utilizador.sessoes || [];
    utilizador.estatisticas = utilizador.estatisticas || {};

    montarLayout();
    render();
}

// Consultas sobre as tarefas do utilizador

// Conta tarefas por dia, para o calendário mostrar o indicador em cada célula
function contagemPorDia() {
    const contagem = {};
    for (const t of utilizador.tarefas) {
        if (!t.dia) continue;
        contagem[t.dia] = (contagem[t.dia] || 0) + 1;
    }
    return contagem;
}

// Tarefas de um dia, já filtradas pelo toggle "Ativas / Concluídas"
function tarefasDoDia(dia) {
    return utilizador.tarefas
        .filter(t => t.dia === dia)
        .filter(t => filtroEstado === "concluidas" ? t.concluida : !t.concluida);
}

// Pesquisa por nome em TODAS as tarefas, de qualquer dia. Filtro simples por
// inclusão de texto (sem bibliotecas externas): para dezenas de tarefas chega,
// e mantém a interface previsível para quem tem TDAH.
function pesquisar(termo) {
    const t = termo.trim().toLowerCase();
    if (!t) return [];
    return utilizador.tarefas
        .filter(tarefa => tarefa.nome.toLowerCase().includes(t))
        .sort((a, b) => (a.dia || "").localeCompare(b.dia || ""));
}

// Desenho
// Monta a estrutura fixa da página uma só vez e liga os tratadores de eventos.
// A barra de pesquisa fica no cabeçalho (não é redesenhada nos re-renders), por
// isso o texto e o cursor mantêm-se enquanto se escreve.
function montarLayout() {
    content.innerHTML = `
        <div class="page-header">
            <h1>Tarefas</h1>
            <p>Escolhe um dia no calendário para ver e criar tarefas desse dia</p>
            <div class="cabecalho-inferior">
                <div class="pesquisa">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input id="campo-pesquisa" type="search" placeholder="Pesquisar tarefa..." aria-label="Pesquisar tarefa" />
                </div>
                <button class="cal-hoje" data-acao="ir-hoje">Hoje</button>
            </div>
        </div>

        <div class="tarefas-layout">
            <section id="calendario" class="card"></section>
            <aside id="painel-dia" class="card"></aside>
        </div>
    `;

    ligarEventos();
}

// Redesenha o calendário e o painel. Chamado sempre que os dados ou o estado mudam.
function render() {
    clearTimeout(timeoutAlternar);
    timeoutAlternar = null;
    renderCalendario();
    renderPainel();
}

function renderCalendario() {
    const ano = dataVista.getFullYear();
    const mes = dataVista.getMonth();
    const celulas = gerarGrelhaMes(ano, mes);
    const contagem = contagemPorDia();
    const hoje = hojeChave();

    const cabecalho = NOMES_DIAS
        .map(d => `<div class="cal-nome-dia">${d}</div>`)
        .join("");

    const grelha = celulas.map(data => {
        const chave = chaveDia(data);
        const doMes = data.getMonth() === mes;
        const total = contagem[chave] || 0;

        const classes = ["cal-dia"];
        if (!doMes) classes.push("fora-mes");
        if (chave === hoje) classes.push("hoje");
        if (chave === diaSelecionado) classes.push("selecionado");

        return `
            <button class="${classes.join(" ")}" data-acao="selecionar-dia" data-dia="${chave}">
                <span class="cal-numero">${data.getDate()}</span>
                ${total > 0 ? `<span class="cal-indicador">${total}</span>` : ""}
            </button>
        `;
    }).join("");

    document.getElementById("calendario").innerHTML = `
        <div class="cal-topo">
            <button class="cal-nav" data-acao="mes-anterior" aria-label="Mês anterior">&#8249;</button>
            <span class="cal-titulo">${NOMES_MESES[mes]} ${ano}</span>
            <button class="cal-nav" data-acao="mes-seguinte" aria-label="Mês seguinte">&#8250;</button>
        </div>
        <div class="cal-grelha cal-cabecalho">${cabecalho}</div>
        <div class="cal-grelha cal-grelha-dias">${grelha}</div>
    `;
}

// Decide o que mostrar no painel da direita: resultados de pesquisa, a sessão
// rápida em curso, ou a lista de tarefas do dia. A pesquisa tem prioridade
// para a resposta a escrever ser imediata.
function renderPainel() {
    clearTimeout(timeoutAlternar);
    timeoutAlternar = null;
    if (termoPesquisa.trim()) {
        renderResultadosPesquisa();
        return;
    }
    if (modoPainel === "sessao") {
        renderSessaoRapida();
        return;
    }
    renderPainelDia();
}

// Percentagem da barra de progresso. Uma tarefa concluída mostra sempre a barra
// cheia (mesmo que tenha sido marcada à mão sem terminar todas as sessões); uma
// tarefa ativa mostra o progresso real das sessões. Assim a barra nunca
// contradiz o estado do visto.
function percentagemTarefa(t) {
    if (t.concluida) return 100;
    const total = t.numeroSessoes || 1;
    const feitas = t.sessoesConcluidas || 0;
    return Math.min(100, Math.round((feitas / total) * 100));
}

// Template de uma linha de tarefa. Isolado para ser reutilizado no render do
// painel e na atualização cirúrgica de uma só linha (no toggle do visto), sem
// redesenhar o painel inteiro.
function templateTarefa(t) {
    const total = t.numeroSessoes || 1;
    const percentagem = percentagemTarefa(t);

    return `
        <div class="tarefa ${t.concluida ? "feita" : ""}">
            <button class="tarefa-check" data-acao="alternar" data-id="${t.id}" aria-label="Concluir">
                ${t.concluida ? "&#10003;" : ""}
            </button>
            <div class="tarefa-corpo">
                <p class="tarefa-nome">${t.nome}</p>
                <p class="tarefa-info">${total} x ${t.duracaoSessao} min &middot; +${t.xpRecompensa} XP</p>
                <div class="barra"><div class="barra-fill" style="width: ${percentagem}%"></div></div>
            </div>
            ${t.concluida ? "" : `
                <button class="tarefa-iniciar" data-acao="iniciar" data-id="${t.id}">
                    <i class="fa-solid fa-play"></i> Iniciar
                </button>
            `}
            <button class="tarefa-remover" data-acao="remover" data-id="${t.id}" aria-label="Remover">&times;</button>
        </div>
    `;
}

function renderPainelDia() {
    const tarefas = tarefasDoDia(diaSelecionado);

    const lista = tarefas.length === 0
        ? `<p class="painel-vazio">${filtroEstado === "concluidas"
            ? "Ainda não há tarefas concluídas neste dia."
            : "Sem tarefas neste dia. Cria a primeira."}</p>`
        : tarefas.map(templateTarefa).join("");

    document.getElementById("painel-dia").innerHTML = `
        <div class="painel-topo">
            <h3>${diaPorExtenso(diaSelecionado)}</h3>
            <button class="btn-primario" data-acao="abrir-modal">+ Nova tarefa</button>
        </div>
        <div class="painel-filtros">
            <button class="filtro ${filtroEstado === "ativas" ? "ativo" : ""}" data-acao="filtro" data-filtro="ativas">Ativas</button>
            <button class="filtro ${filtroEstado === "concluidas" ? "ativo" : ""}" data-acao="filtro" data-filtro="concluidas">Concluídas</button>
        </div>
        <div class="painel-lista">${lista}</div>
    `;
}

// Resultados de pesquisa: tarefas de qualquer dia, com o dia indicado em cada
// linha. Clicar numa leva o calendário até esse dia e limpa a pesquisa.
function renderResultadosPesquisa() {
    const resultados = pesquisar(termoPesquisa);

    const lista = resultados.length === 0
        ? `<p class="painel-vazio">Nenhuma tarefa encontrada.</p>`
        : resultados.map(t => `
            <button class="resultado ${t.concluida ? "feita" : ""}" data-acao="ir-dia" data-dia="${t.dia}">
                <span class="resultado-nome">${t.nome}</span>
                <span class="resultado-dia">${diaPorExtenso(t.dia)}</span>
            </button>
        `).join("");

    document.getElementById("painel-dia").innerHTML = `
        <div class="painel-topo">
            <h3>Resultados</h3>
        </div>
        <div class="painel-lista">${lista}</div>
    `;
}

// Sessão rápida (Pomodoro embutido)

// Desenha o painel em modo sessão. Só a estrutura: os valores que mudam a cada
// segundo (tempo e barra) são atualizados depois por atualizarSessao(), sem
// voltar a redesenhar tudo - assim o textarea das notas nunca perde o foco.
function renderSessaoRapida() {
    const t = tarefaSessao;

    document.getElementById("painel-dia").innerHTML = `
        <div class="painel-topo">
            <h3>Sessão rápida</h3>
            <button class="btn-secundario" data-acao="qs-terminar">Terminar</button>
        </div>

        <div class="qs-tarefa">${t.nome}</div>

        <div class="qs-timer" id="qs-tempo">${formatarTempo(tempoRestante)}</div>
        <div class="barra"><div class="barra-fill" id="qs-barra" style="width: 0%"></div></div>

        <button class="btn-primario qs-pausar" data-acao="qs-pausar" id="qs-pausar">Pausar</button>

        <label class="campo qs-notas">
            <span>Notas da sessão</span>
            <textarea id="qs-notas" rows="4" placeholder="Escreve o que precisares...">${t.notas || ""}</textarea>
        </label>

        <p class="qs-xp">Ganhas +${t.xpRecompensa} XP ao terminar a sessão</p>
    `;
}

// Arranca o cronómetro para a tarefa escolhida e passa o painel a modo sessão.
function iniciarSessaoRapida(tarefa) {
    pararTimer();                          // segurança: nunca dois intervalos

    tarefaSessao = tarefa;
    tempoTotal = (tarefa.duracaoSessao || 25) * 60;
    tempoRestante = tempoTotal;
    emPausa = false;
    modoPainel = "sessao";

    renderSessaoRapida();

    intervalo = setInterval(() => {
        if (emPausa) return;

        tempoRestante--;
        atualizarSessao();

        if (tempoRestante <= 0) {
            completarSessaoRapida();
        }
    }, 1000);
}

// Atualiza só os elementos que mudam (tempo + barra), sem redesenhar o painel
function atualizarSessao() {
    const elTempo = document.getElementById("qs-tempo");
    if (!elTempo) return;                  // painel já mudou de modo

    const decorrido = tempoTotal - tempoRestante;
    const percentagem = Math.round((decorrido / tempoTotal) * 100);

    elTempo.textContent = formatarTempo(tempoRestante);
    document.getElementById("qs-barra").style.width = `${percentagem}%`;
}

function alternarPausa() {
    emPausa = !emPausa;
    document.getElementById("qs-pausar").textContent = emPausa ? "Retomar" : "Pausar";
}

// Para o intervalo e limpa o estado da sessão (sem mexer no painel)
function pararTimer() {
    clearInterval(intervalo);
    intervalo = null;
    emPausa = false;
}

// Terminar sem completar: o utilizador parou a meio. Guardamos as notas (para
// não se perderem) mas não há XP nem sessão contada.
function terminarSessaoRapida() {
    pararTimer();
    tarefaSessao = null;
    modoPainel = "lista";
    renderPainel();
    guardar();
}

// Cronómetro chegou a zero: conta a sessão, dá XP e atualiza estatísticas com a
// mesma lógica da página de foco, para os números baterem certo entre as duas.
function completarSessaoRapida() {
    pararTimer();

    const tarefa = tarefaSessao;
    tarefa.sessoesConcluidas = (tarefa.sessoesConcluidas || 0) + 1;
    if (tarefa.sessoesConcluidas >= (tarefa.numeroSessoes || 1)) {
        tarefa.concluida = true;
    }

    // Regista a sessão para as estatísticas e o histórico (modo "rapida" para
    // distinguir das sessões abertas na página de foco)
    const registo = new Sessao("rapida", tarefa.duracaoSessao, tarefa.id, tarefa.nome);
    registo.concluida = true;
    registo.dataFim = new Date().toISOString();
    utilizador.sessoes.push(registo);

    utilizador.estatisticas.totalSessoes = (utilizador.estatisticas.totalSessoes || 0) + 1;
    utilizador.estatisticas.minutosEstudo = (utilizador.estatisticas.minutosEstudo || 0) + tarefa.duracaoSessao;
    utilizador.estatisticas.xpTotal = (utilizador.estatisticas.xpTotal || 0) + tarefa.xpRecompensa;
    utilizador.xp = (utilizador.xp || 0) + tarefa.xpRecompensa;

    tarefaSessao = null;
    modoPainel = "lista";
    render();          // atualiza também o calendário (indicadores podem mudar)
    guardar();
}

// Modal de criação
// Substitui o "Para hoje? sim/não" do protótipo. O dia já vem escolhido pelo
// calendário, mas deixamos um seletor de data para reagendar sem fechar o modal.
function abrirModal() {
    const fundo = document.createElement("div");
    fundo.className = "modal-fundo";
    fundo.innerHTML = `
        <div class="modal-card">
            <h2>Nova tarefa</h2>

            <label class="campo">
                <span>Nome da tarefa</span>
                <input id="m-nome" type="text" placeholder="Ex.: Estudar matemática" autofocus />
            </label>

            <label class="campo">
                <span>Dia</span>
                <input id="m-dia" type="date" value="${diaSelecionado}" />
            </label>

            <div class="campo-linha">
                <label class="campo">
                    <span>Número de sessões</span>
                    <div class="stepper">
                        <button type="button" data-acao="menos">-</button>
                        <span id="m-sessoes">2</span>
                        <button type="button" data-acao="mais">+</button>
                    </div>
                </label>

                <label class="campo">
                    <span>Duração das sessões</span>
                    <select id="m-duracao">
                        <option value="25">25 minutos</option>
                        <option value="45">45 minutos</option>
                        <option value="60">60 minutos</option>
                    </select>
                </label>
            </div>

            <div class="modal-acoes">
                <button class="btn-primario" data-acao="criar">Criar</button>
                <button class="btn-secundario" data-acao="fechar">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(fundo);

    const elSessoes = fundo.querySelector("#m-sessoes");

    fundo.addEventListener("click", (e) => {
        const acao = e.target.dataset.acao;

        if (acao === "menos") {
            elSessoes.textContent = Math.max(1, Number(elSessoes.textContent) - 1);
        }
        if (acao === "mais") {
            elSessoes.textContent = Number(elSessoes.textContent) + 1;
        }
        if (acao === "criar") {
            const nome = fundo.querySelector("#m-nome").value.trim();
            const dia = fundo.querySelector("#m-dia").value;
            const duracao = Number(fundo.querySelector("#m-duracao").value);
            const sessoes = Number(elSessoes.textContent);
            if (!nome || !dia) return;   // validação mínima

            utilizador.tarefas.push(new Tarefa(nome, dia, sessoes, duracao));
            diaSelecionado = dia;              // saltar para o dia da nova tarefa
            dataVista = chaveParaData(dia);    // e mostrar o mês desse dia, se for outro
            filtroEstado = "ativas";           // a tarefa nova entra como ativa
            fundo.remove();
            render();
            guardar();
        }
        // Fechar ao clicar em Cancelar ou no fundo escuro fora do cartão
        if (acao === "fechar" || e.target === fundo) {
            fundo.remove();
        }
    });
}

// Tratadores de eventos (delegação)
// Um listener de cliques e um de input, ambos no #content (que não é
// substituído nos re-renders), por isso continuam a funcionar a cada render.
function ligarEventos() {
    content.addEventListener("input", (e) => {
        if (e.target.id === "campo-pesquisa") {
            termoPesquisa = e.target.value;
            // Escrever na pesquisa abandona uma sessão a decorrer (mudamos de vista)
            if (modoPainel === "sessao") {
                pararTimer();
                tarefaSessao = null;
                modoPainel = "lista";
            }
            renderPainel();
        }
        if (e.target.id === "qs-notas") {
            // Guarda em memória a cada tecla; o flush para o servidor é no fim da sessão
            if (tarefaSessao) tarefaSessao.notas = e.target.value;
        }
    });

    content.addEventListener("click", (e) => {
        const alvo = e.target.closest("[data-acao]");
        if (!alvo) return;
        const { acao, dia, id, filtro } = alvo.dataset;

        // Botões da própria sessão rápida
        if (acao === "qs-pausar") {
            alternarPausa();
            return;
        }
        if (acao === "qs-terminar") {
            terminarSessaoRapida();
            return;
        }

        // Qualquer navegação abandona uma sessão a decorrer antes de seguir
        if (modoPainel === "sessao" &&
            ["selecionar-dia", "mes-anterior", "mes-seguinte", "abrir-modal", "ir-dia", "filtro"].includes(acao)) {
            pararTimer();
            tarefaSessao = null;
            modoPainel = "lista";
        }

        if (acao === "mes-anterior") {
            dataVista = new Date(dataVista.getFullYear(), dataVista.getMonth() - 1, 1);
            renderCalendario();
        }
        if (acao === "mes-seguinte") {
            dataVista = new Date(dataVista.getFullYear(), dataVista.getMonth() + 1, 1);
            renderCalendario();
        }
        if (acao === "selecionar-dia") {
            diaSelecionado = dia;
            render();
        }
        if (acao === "ir-dia") {
            // Saltar de um resultado de pesquisa para o dia da tarefa
            diaSelecionado = dia;
            dataVista = chaveParaData(dia);
            termoPesquisa = "";
            document.getElementById("campo-pesquisa").value = "";
            render();
        }
        if (acao === "filtro") {
            filtroEstado = filtro;
            renderPainel();
        }
        if (acao === "abrir-modal") {
            abrirModal();
        }
        if (acao === "iniciar") {
            const tarefa = utilizador.tarefas.find(t => t.id === id);
            if (tarefa) iniciarSessaoRapida(tarefa);
        }
        if (acao === "ir-hoje") {
            diaSelecionado = hojeChave();
            dataVista = new Date();
            render();
        }
        if (acao === "alternar") {
            const tarefa = utilizador.tarefas.find(t => t.id === id);
            if (!tarefa) return;
            tarefa.concluida = !tarefa.concluida;
            // Mostra o novo estado (visto + riscado) imediatamente na linha,
            // depois passa para o filtro correto. Se outro re-render acontecer
            // antes dos 450ms, renderPainel() cancela o timeout → zero duplicados.
            const linha = alvo.closest(".tarefa");
            if (linha) linha.outerHTML = templateTarefa(tarefa);
            clearTimeout(timeoutAlternar);
            timeoutAlternar = setTimeout(() => renderPainel(), 450);
            guardar();
        }
        if (acao === "remover") {
            utilizador.tarefas = utilizador.tarefas.filter(t => t.id !== id);
            render();
            guardar();
        }
    });
}

// Persistência
// Tudo o que a página altera (tarefas, sessões, estatísticas, XP) vai num só
// PATCH a /users/:id, como no guardarSessao do focoView. Atualizamos também a
// sessaoAtiva em localStorage para a navbar e o nível ficarem coerentes.
async function guardar() {
    try {
        await fetch(`http://localhost:3000/users/${utilizador.id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                tarefas: utilizador.tarefas,
                sessoes: utilizador.sessoes,
                estatisticas: utilizador.estatisticas,
                xp: utilizador.xp
            })
        });

        localStorage.setItem("sessaoAtiva", JSON.stringify(utilizador));
    } catch (erro) {
        console.error("Erro ao guardar tarefas:", erro);
    }
}

function formatarTempo(segundos) {
    const minutos = String(Math.floor(segundos / 60)).padStart(2, "0");
    const seg = String(segundos % 60).padStart(2, "0");
    return `${minutos}:${seg}`;
}

carregarPagina();
