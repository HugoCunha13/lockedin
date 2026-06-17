import { renderNavbar } from "./navbarView.js";
import Tarefa from "../models/tarefaModel.js";
import {
    NOMES_MESES, NOMES_DIAS, chaveDia, hojeChave,
    chaveParaData, diaPorExtenso, gerarGrelhaMes
} from "../utils/datas.js";
import { verificarConquistas } from "../utils/conquistas.js";
import { verificarMissoesConcluidas } from "../utils/missoes.js";

// Verifica se existe sessão ativa e token de autenticação
const sessao = JSON.parse(localStorage.getItem("sessaoAtiva"));
const token = localStorage.getItem("token");

if (!sessao || !token) {
    window.location.href = "login.html";
}

renderNavbar("Tarefas");

const content = document.getElementById("content");

// Estado principal da página de tarefas
let utilizador = null;
let dataVista = new Date();          // Mês atualmente mostrado no calendário
let diaSelecionado = hojeChave();    // Dia selecionado no painel lateral
let termoPesquisa = "";              // Texto escrito na barra de pesquisa
let filtroEstado = "ativas";         // Filtro atual: "ativas", "concluidas" ou "atrasadas"

// Timeout usado para atualizar a lista depois de alternar uma tarefa
let timeoutAlternar = null;

async function carregarPagina() {
    const response = await fetch(`http://localhost:3000/users/${sessao.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) {
        window.location.href = "login.html";
        return;
    }

    utilizador = await response.json();

    // Garante que os campos principais existem em utilizadores novos
    utilizador.tarefas = utilizador.tarefas || [];
    utilizador.sessoes = utilizador.sessoes || [];
    utilizador.estatisticas = utilizador.estatisticas || {};

    montarLayout();
    render();
}

// Conta quantas tarefas existem em cada dia, para mostrar o indicador no calendário
function contagemPorDia() {
    const contagem = {};

    for (const t of utilizador.tarefas) {
        if (!t.dia) continue;
        contagem[t.dia] = (contagem[t.dia] || 0) + 1;
    }

    return contagem;
}

// Uma tarefa está atrasada quando ainda não foi concluída e pertence a um dia anterior ao atual
function tarefaAtrasada(tarefa) {
    return !tarefa.concluida && tarefa.dia < hojeChave();
}

// Devolve as tarefas do dia selecionado, aplicando o filtro atual
function tarefasDoDia(dia) {
    return utilizador.tarefas
        .filter(t => t.dia === dia)
        .filter(t => {
            if (filtroEstado === "concluidas") {
                return t.concluida;
            }

            if (filtroEstado === "atrasadas") {
                return tarefaAtrasada(t);
            }

            return !t.concluida && !tarefaAtrasada(t);
        });
}

// Pesquisa tarefas pelo nome, em todos os dias
function pesquisar(termo) {
    const t = termo.trim().toLowerCase();

    if (!t) return [];

    return utilizador.tarefas
        .filter(tarefa => tarefa.nome.toLowerCase().includes(t))
        .sort((a, b) => (a.dia || "").localeCompare(b.dia || ""));
}

// Monta a estrutura fixa da página
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

// Redesenha o calendário e o painel de tarefas
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

// Decide se mostra resultados de pesquisa ou tarefas do dia selecionado
function renderPainel() {
    clearTimeout(timeoutAlternar);
    timeoutAlternar = null;

    if (termoPesquisa.trim()) {
        renderResultadosPesquisa();
        return;
    }

    renderPainelDia();
}

// Calcula a percentagem de progresso da tarefa
function percentagemTarefa(t) {
    if (t.concluida) return 100;

    const total = t.numeroSessoes || 1;
    const feitas = t.sessoesConcluidas || 0;

    return Math.min(100, Math.round((feitas / total) * 100));
}

// Cria o HTML de uma tarefa individual
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

    const mensagem =
        filtroEstado === "concluidas"
            ? "Ainda não há tarefas concluídas neste dia."
            : filtroEstado === "atrasadas"
                ? "Não tens tarefas atrasadas neste dia."
                : "Sem tarefas neste dia. Cria a primeira.";

    const lista = tarefas.length === 0
        ? `<p class="painel-vazio">${mensagem}</p>`
        : tarefas.map(templateTarefa).join("");

    document.getElementById("painel-dia").innerHTML = `
        <div class="painel-topo">
            <h3>${diaPorExtenso(diaSelecionado)}</h3>
            <button class="btn-primario" data-acao="abrir-modal">+ Nova tarefa</button>
        </div>
        <div class="painel-filtros">
            <button class="filtro ${filtroEstado === "ativas" ? "ativo" : ""}" data-acao="filtro" data-filtro="ativas">Ativas</button>
            <button class="filtro ${filtroEstado === "concluidas" ? "ativo" : ""}" data-acao="filtro" data-filtro="concluidas">Concluídas</button>
            <button class="filtro ${filtroEstado === "atrasadas" ? "ativo" : ""}" data-acao="filtro" data-filtro="atrasadas">Atrasadas</button>
        </div>
        <div class="painel-lista">${lista}</div>
    `;
}

// Mostra os resultados encontrados pela pesquisa
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

// Abre o modal para criar uma nova tarefa
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
                        <option value="10">10 minutos</option>
                        <option value="15">15 minutos</option>
                        <option value="20">20 minutos</option>
                        <option value="25" selected>25 minutos</option>
                        <option value="30">30 minutos</option>
                        <option value="35">35 minutos</option>
                        <option value="40">40 minutos</option>
                        <option value="45">45 minutos</option>
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

            if (!nome || !dia) return;

            utilizador.tarefas.push(new Tarefa(nome, dia, sessoes, duracao));

            diaSelecionado = dia;
            dataVista = chaveParaData(dia);
            filtroEstado = "ativas";

            fundo.remove();
            render();
            guardar();
        }

        if (acao === "fechar" || e.target === fundo) {
            fundo.remove();
        }
    });
}

// Liga os eventos da página através de delegação
function ligarEventos() {
    content.addEventListener("input", (e) => {
        if (e.target.id === "campo-pesquisa") {
            termoPesquisa = e.target.value;
            renderPainel();
        }
    });

    content.addEventListener("click", (e) => {
        const alvo = e.target.closest("[data-acao]");

        if (!alvo) return;

        const { acao, dia, id, filtro } = alvo.dataset;

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

            if (tarefa) {
                localStorage.setItem("tarefaParaFoco", JSON.stringify(tarefa));
                window.location.href = "/html/foco.html";
            }
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

// Guarda as alterações feitas às tarefas no servidor e atualiza a sessão local
async function guardar() {
    try {
        utilizador.conquistas = verificarConquistas(utilizador);

        const resMissoes = await fetch("http://localhost:3000/missoes", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const missoes = await resMissoes.json();

        const antigasMissoes = utilizador.missoesConcluidas || [];
        const novasMissoes = verificarMissoesConcluidas(utilizador, missoes);

        const xpMissoes = missoes
            .filter(m => novasMissoes.includes(m.id) && !antigasMissoes.includes(m.id))
            .reduce((total, m) => total + m.xpRecompensa, 0);

        utilizador.missoesConcluidas = novasMissoes;
        utilizador.xp = (utilizador.xp || 0) + xpMissoes;
        utilizador.estatisticas.xpTotal = (utilizador.estatisticas.xpTotal || 0) + xpMissoes;

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
                xp: utilizador.xp,
                conquistas: utilizador.conquistas,
                missoesConcluidas: utilizador.missoesConcluidas
            })
        });

        localStorage.setItem("sessaoAtiva", JSON.stringify(utilizador));
    } catch (erro) {
        console.error("Erro ao guardar tarefas:", erro);
    }
}

carregarPagina();
