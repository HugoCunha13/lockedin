import { renderNavbar } from "./navbarView.js";
import Sessao from "../models/sessaoModel.js";

const sessao = JSON.parse(localStorage.getItem("sessaoAtiva"));
const token = localStorage.getItem("token");

if (!sessao || !token) {
    window.location.href = "/html/login.html";
}

renderNavbar("Sessões");

const content = document.getElementById("content");

let utilizador = null;
let sessaoAtual = null;
let tarefaAtual = null;

let tempoTotal = 0;
let tempoRestante = 0;
let intervalo = null;
let emPausa = false;
let sessaoTerminada = false;

async function carregarPagina() {
    const response = await fetch(`http://localhost:3000/users/${sessao.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) {
        window.location.href = "/html/login.html";
        return;
    }

    utilizador = await response.json();
    renderCriarSessao();
}

function renderCriarSessao() {
    document.getElementById("sidebar").classList.remove("hidden");
    document.querySelector(".foco-page").classList.remove("sessao-ativa");

    content.innerHTML = `
        <section class="foco-header">
            <h1>Sessão de foco</h1>
            <p>Melhora o teu foco</p>
        </section>

        <section class="foco-card">
            <h2>Cria a tua sessão de foco</h2>
            <p>Define o teu objetivo de foco antes de começar</p>

            <div class="modos-foco">
                <button id="btnModoFocado" class="modo-card">
                    <strong>Modo focado</strong>
                    <span>Escolhe uma tarefa e inicia a sessão</span>
                </button>

                <button id="btnModoLivre" class="modo-card">
                    <strong>Modo livre</strong>
                    <span>Iniciar uma sessão sem tarefa</span>
                </button>
            </div>

            <div id="areaModoLivre" class="area-livre hidden">
                <label>Duração da sessão</label>
                <input id="duracaoLivre" type="range" min="10" max="45" step="5" value="30">
                <p><span id="duracaoTexto">30</span> minutos</p>

                <button id="btnComecarLivre" class="btn-principal">
                    Começar sessão
                </button>
            </div>

            <button class="notificacoes-btn">
                <span>🔕</span>
                <div>
                    <strong>Remove as notificações</strong>
                    <small>Foca-te sem distrações</small>
                </div>
                <b>›</b>
            </button>
        </section>

        <div id="modalTarefas" class="modal hidden">
            <div class="modal-card">
                <h2>Escolhe uma tarefa</h2>
                <div id="listaTarefas"></div>
                <button id="btnFecharModal" class="btn-cancelar">Cancelar</button>
            </div>
        </div>
    `;

    document.getElementById("btnModoFocado").addEventListener("click", abrirModalTarefas);
    document.getElementById("btnModoLivre").addEventListener("click", mostrarModoLivre);

    document.getElementById("duracaoLivre").addEventListener("input", function () {
        document.getElementById("duracaoTexto").textContent = this.value;
    });

    document.getElementById("btnComecarLivre").addEventListener("click", function () {
        const duracao = Number(document.getElementById("duracaoLivre").value);
        iniciarSessao("livre", duracao);
    });

    document.getElementById("btnFecharModal").addEventListener("click", function () {
        document.getElementById("modalTarefas").classList.add("hidden");
    });
}

function mostrarModoLivre() {
    document.getElementById("areaModoLivre").classList.toggle("hidden");
}

function abrirModalTarefas() {
    const modal = document.getElementById("modalTarefas");
    const lista = document.getElementById("listaTarefas");

    const tarefas = utilizador.tarefas || [];
    const tarefasAtivas = tarefas.filter(tarefa => !tarefa.concluida);

    if (tarefasAtivas.length === 0) {
        lista.innerHTML = `<p class="sem-tarefas">Não tens tarefas ativas.</p>`;
    } else {
        lista.innerHTML = tarefasAtivas.map(tarefa => {
            const duracao = tarefa.duracaoSessao || tarefa.duracao || 25;
            const concluidas = tarefa.sessoesConcluidas || 0;
            const total = tarefa.numeroSessoes || tarefa.numSessoes || 1;

            return `
                <button class="tarefa-opcao" data-id="${tarefa.id}">
                    <strong>${tarefa.nome}</strong>
                    <span>${duracao} min</span>
                    <small>${concluidas}/${total} sessões</small>
                </button>
            `;
        }).join("");
    }

    modal.classList.remove("hidden");

    document.querySelectorAll(".tarefa-opcao").forEach(btn => {
        btn.addEventListener("click", function () {
            const tarefaId = this.dataset.id;
            const tarefa = tarefasAtivas.find(t => String(t.id) === String(tarefaId));

            if (!tarefa) return;

            const duracao = Number(tarefa.duracaoSessao || tarefa.duracao || 25);

            modal.classList.add("hidden");
            iniciarSessao("focado", duracao, tarefa);
        });
    });
}

function iniciarSessao(modo, duracao, tarefa = null) {
    clearInterval(intervalo);

    tarefaAtual = tarefa;
    sessaoTerminada = false;

    sessaoAtual = new Sessao(
        modo,
        duracao,
        tarefa ? tarefa.id : null,
        tarefa ? tarefa.nome : null
    );
    
    tempoTotal = duracao * 60;

    tempoRestante = tempoTotal;
    emPausa = false;

    document.getElementById("sidebar").classList.add("hidden");
    document.querySelector(".foco-page").classList.add("sessao-ativa");

    renderSessaoEmCurso(modo, tarefa);
    atualizarInterface();

    intervalo = setInterval(() => {
        if (emPausa || sessaoTerminada) return;

        tempoRestante--;

        if (tempoRestante <= 0) {
            tempoRestante = 0;
            atualizarInterface();
            concluirSessao();
            return;
        }

        atualizarInterface();
    }, 1000);
}

function renderSessaoEmCurso(modo, tarefa) {
    content.innerHTML = `
        <section class="foco-header">
            <h1>Sessão de foco</h1>
            <p>${modo === "focado" ? "Completa a tua tarefa" : ""}</p>
        </section>

        <section class="sessao-layout">
            <div class="timer-card">
                <h2>Foco</h2>

                <div class="circulo">
                    <svg id="progressSvg" viewBox="0 0 260 260">
                        <circle class="circle-bg" cx="130" cy="130" r="115"></circle>
                        <circle id="progressCircle" class="circle-progress" cx="130" cy="130" r="115"></circle>
                    </svg>

                    <div class="cadeado-area">
                        <svg id="lsvg" viewBox="0 0 60 80" width="95" height="125">
                            <g id="sg">
                                <path class="ls" d="M 12 35 L 12 29 A 18 14 0 0 1 48 29 L 48 35"></path>
                            </g>

                            <rect class="lb" x="4" y="42" width="52" height="34" rx="5"></rect>

                            <circle class="lh" cx="30" cy="57" r="6"></circle>
                            <rect class="lh" x="27" y="60" width="6" height="9" rx="3"></rect>
                        </svg>

                        <strong id="tempoPrincipal">00:00</strong>
                    </div>
                </div>

                <button id="btnPausar" class="btn-pausar">Ⅱ</button>
            </div>

            <div class="info-sessao">
                <div class="info-card">
                    <h3>Progresso da sessão</h3>

                    <div class="progresso-topo">
                        <div>
                            <p><strong>Tempo decorrido:</strong><br><span id="tempoDecorrido">0:00</span></p>
                            <p><strong>Tempo restante:</strong><br><span id="tempoRestante">0:00</span></p>
                        </div>

                        <button id="btnTerminar" class="btn-terminar">
                            <span>⏻</span>
                            <small>Terminar sessão</small>
                        </button>
                    </div>
                </div>

                <div class="info-card">
                    <h3>${modo === "focado" ? "Tarefa desta sessão" : "Modo livre"}</h3>

                    ${
                        modo === "focado"
                        ? `<p><strong>Tarefa a concluir:</strong></p><p>${tarefa.nome}</p>`
                        : `<p>Estás a focar-te sem tarefa definida.</p>`
                    }

                    <p><strong>Sessão em curso</strong></p>

                    <div class="barra">
                        <div id="barraProgresso"></div>
                    </div>

                    <span id="percentagem">0%</span>
                </div>
            </div>
        </section>

        <div id="modalTerminarSessao" class="modal hidden">
            <div class="modal-card modal-confirmacao">
                <h2>Terminar sessão?</h2>

                <p class="modal-pergunta">
                    Certeza que queres terminar esta sessão?
                </p>

                <p>Se desistires, não irás conseguir abrir o cadeado.</p>

                <div class="modal-acoes">
                    <button id="btnCancelarTerminar" class="btn-cancelar">Cancelar</button>
                    <button id="btnConfirmarTerminar" class="btn-confirmar btn-confirmar-perigo">Terminar sessão</button>
                </div>
            </div>
        </div>

        <div id="modalSessaoConcluida" class="modal hidden">
            <div class="modal-card modal-confirmacao">
                <h2>Sessão concluída! 🔓</h2>
                <p>Boa! Terminaste a tua sessão de foco com sucesso.</p>
                <p><strong>+50 XP</strong></p>

                <button id="btnVoltarSessoes" class="btn-confirmar">
                    Voltar às sessões
                </button>
            </div>
        </div>
    `;

    const progressCircle = document.getElementById("progressCircle");
    const circleLength = 2 * Math.PI * 115;

    progressCircle.style.strokeDasharray = circleLength;
    progressCircle.style.strokeDashoffset = circleLength;

    document.getElementById("btnPausar").addEventListener("click", pausarSessao);
    document.getElementById("btnTerminar").addEventListener("click", terminarSessao);
}

function atualizarInterface() {
    const tempoDecorrido = tempoTotal - tempoRestante;
    const percentagem = Math.round((tempoDecorrido / tempoTotal) * 100);

    if (!document.getElementById("tempoPrincipal")) return;

    document.getElementById("tempoPrincipal").textContent = formatarTempo(tempoRestante);
    document.getElementById("tempoDecorrido").textContent = formatarTempo(tempoDecorrido);
    document.getElementById("tempoRestante").textContent = formatarTempo(tempoRestante);

    document.getElementById("barraProgresso").style.width = `${percentagem}%`;
    document.getElementById("percentagem").textContent = `${percentagem}%`;

    const progressCircle = document.getElementById("progressCircle");
    const circleLength = 2 * Math.PI * 115;

    progressCircle.style.strokeDashoffset = circleLength - (percentagem / 100) * circleLength;
}

function pausarSessao() {
    emPausa = !emPausa;

    const btn = document.getElementById("btnPausar");
    btn.textContent = emPausa ? "▶" : "Ⅱ";
}

function terminarSessao() {
    const modal = document.getElementById("modalTerminarSessao");

    modal.classList.remove("hidden");

    document.getElementById("btnCancelarTerminar").onclick = function () {
        modal.classList.add("hidden");
    };

    document.getElementById("btnConfirmarTerminar").onclick = function () {
        clearInterval(intervalo);
        intervalo = null;
        sessaoTerminada = true;

        modal.classList.add("hidden");

        document.getElementById("sidebar").classList.remove("hidden");
        document.querySelector(".foco-page").classList.remove("sessao-ativa");

        renderCriarSessao();
    };
}

function concluirSessao() {
    if (sessaoTerminada) return;

    sessaoTerminada = true;
    clearInterval(intervalo);
    intervalo = null;

    document.getElementById("sg").classList.add("open");
    document.getElementById("btnPausar").textContent = "✓";

    sessaoAtual.concluida = true;
    sessaoAtual.dataFim = new Date().toISOString();

    prepararDadosSessao();
    mostrarModalSessaoConcluida();
}

function prepararDadosSessao() {
    if (tarefaAtual) {
        tarefaAtual.sessoesConcluidas = (tarefaAtual.sessoesConcluidas || 0) + 1;

        const totalSessoes = tarefaAtual.numeroSessoes || tarefaAtual.numSessoes || 1;

        if (tarefaAtual.sessoesConcluidas >= totalSessoes) {
            tarefaAtual.concluida = true;
        }
    }

    utilizador.sessoes = utilizador.sessoes || [];
    utilizador.sessoes.push(sessaoAtual);

    utilizador.estatisticas = utilizador.estatisticas || {};
    utilizador.estatisticas.totalSessoes = (utilizador.estatisticas.totalSessoes || 0) + 1;
    utilizador.estatisticas.minutosEstudo = (utilizador.estatisticas.minutosEstudo || 0) + sessaoAtual.duracao;
    utilizador.estatisticas.xpTotal = (utilizador.estatisticas.xpTotal || 0) + 50;

    utilizador.xp = (utilizador.xp || 0) + 50;
}

function mostrarModalSessaoConcluida() {
    setTimeout(() => {
        const modal = document.getElementById("modalSessaoConcluida");
        const btnVoltar = document.getElementById("btnVoltarSessoes");

        if (!modal || !btnVoltar) {
            console.error("Modal de sessão concluída não encontrada.");
            return;
        }

        modal.classList.remove("hidden");

        btnVoltar.onclick = async function () {
            await guardarSessao();

            modal.classList.add("hidden");

            document.getElementById("sidebar").classList.remove("hidden");
            document.querySelector(".foco-page").classList.remove("sessao-ativa");

            renderCriarSessao();
        };
    }, 900);
}

async function guardarSessao() {
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
        console.error("Erro ao guardar sessão:", erro);
    }
}

function formatarTempo(segundos) {
    const minutos = Math.floor(segundos / 60);
    const seg = String(segundos % 60).padStart(2, "0");

    return `${minutos}:${seg}`;
}

carregarPagina();