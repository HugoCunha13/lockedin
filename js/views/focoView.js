import { renderNavbar } from "./navbarView.js";
import Sessao from "../models/sessaoModel.js";
import { chaveDia, hojeChave, diaPorExtenso } from "../utils/datas.js";
import { verificarConquistas } from "../utils/conquistas.js";
import { verificarMissoesConcluidas } from "../utils/missoes.js";

const sessao = JSON.parse(localStorage.getItem("sessaoAtiva")); // Verifica se há uma sessão ativa no localStorage
const token = localStorage.getItem("token"); // Verifica se há um token de autenticação no localStorage

if (!sessao || !token) {
    window.location.href = "login.html";  // Se nao existir sessão ativa ou token, redireciona para a página de login
}

renderNavbar("Sessões"); //Desenha a navbar

const content = document.getElementById("content"); // Elemento principal onde o conteúdo da página será renderizado

let utilizador = null; // Todos os dados do user
let sessaoAtual = null; //sessão que está a decorrer
let tarefaAtual = null; // tarefa associada se estiver no modo focado

let tempoTotal = 0; // duração total da sessão em segundos
let tempoRestante = 0; //quanto tempo falta para terminar a sessão, em segundos
let intervalo = null; //guarda o intervalo do setInterval para poder limpar depois
let emPausa = false; //diz se esta pausado
let sessaoTerminada = false; // evita concluir duas vezes
//Estas variáveis representam o estado da sessão de foco atual a decorrer

async function carregarPagina() { //Função que vai buscar dados ao servidor
    const response = await fetch(`http://localhost:3000/users/${sessao.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
    }); //Vai buscar o utilizador atual ao servidor usando o ID e o token

    if (!response.ok) {
        window.location.href = "login.html";
        return;
    }//Se o pedido falhar, manda para login

    utilizador = await response.json();//Converte a resposta para objeto

    const tarefaGuardada = JSON.parse(localStorage.getItem("tarefaParaFoco"));//Isto verifica se o utilizador clicou em Iniciar numa tarefa da página de tarefas

    if (tarefaGuardada) {
        const tarefa = utilizador.tarefas.find(t => String(t.id) === String(tarefaGuardada.id));//Procura essa tarefa dentro das tarefas reais do utilizador

        localStorage.removeItem("tarefaParaFoco");//Remove do localStorage para não iniciar a mesma tarefa outra vez

        if (tarefa) {
            iniciarSessao("focado", Number(tarefa.duracaoSessao || 25), tarefa);
            return;
        }//Se encontrou a tarefa, inicia logo uma sessão em modo focado
    }

renderCriarSessao();//Se não houver tarefa guardada, mostra a página normal para criar sessão.
}

function renderCriarSessao() { //Esta função desenha a interface inicial da página de foco
    
    //Garante que a sidebar aparece e que a página sai do layout de sessão ativa
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

    document.getElementById("btnModoFocado").addEventListener("click", abrirModalTarefas);//Quando clica em modo focado, abre a lista de tarefas
    document.getElementById("btnModoLivre").addEventListener("click", mostrarModoLivre);//Quando clica em modo livre, mostra o slider de duração

    document.getElementById("duracaoLivre").addEventListener("input", function () {
        document.getElementById("duracaoTexto").textContent = this.value;
    });//Atualiza o texto do slider em tempo real

    document.getElementById("btnComecarLivre").addEventListener("click", function () {
        const duracao = Number(document.getElementById("duracaoLivre").value);
        iniciarSessao("livre", duracao);
    });//Começa uma sessão livre com a duração escolhida

    document.getElementById("btnFecharModal").addEventListener("click", function () {
        document.getElementById("modalTarefas").classList.add("hidden");
    });//Fecha o modal de tarefas quando clica em cancelar
}

function mostrarModoLivre() {
    document.getElementById("areaModoLivre").classList.toggle("hidden");
}//Mostra ou esconde a área de configuração do modo livre atraves do toggle

function abrirModalTarefas() {
    const modal = document.getElementById("modalTarefas");
    const lista = document.getElementById("listaTarefas");

    //Vai buscar as tarefas do utilizador e filtra só as que ainda não estão concluídas
    const tarefas = utilizador.tarefas || [];
    const tarefasAtivas = tarefas.filter(tarefa => !tarefa.concluida);

    //Se não houver tarefas, mostra mensagem
    if (tarefasAtivas.length === 0) {
        lista.innerHTML = `<p class="sem-tarefas">Não tens tarefas ativas.</p>`;
    } else {//Se tiver tarefas
        
        // Agrupar as tarefas ativas pelo dia agendado, em vez de uma lista plana.
        // Hoje aparece primeiro (é o mais relevante para quem vai focar agora) e os
        // restantes dias por ordem cronológica. Nada é escondido, só organizado -
        // o mesmo princípio do calendário da página de tarefas.
        
        const hoje = hojeChave();
        const agora = new Date();
        const amanha = chaveDia(new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1));

        //Cria um objeto em que cada dia tem uma lista de tarefas
        const porDia = {};
        for (const tarefa of tarefasAtivas) {
            const dia = tarefa.dia || "sem-data";
            if (!porDia[dia]) porDia[dia] = [];
            porDia[dia].push(tarefa);
        }

        // Ordena os dias cronologicamente ("sem-data" fica no fim por ordenação de
        // texto) e puxa o dia de hoje para o topo da lista.
        const chaves = Object.keys(porDia).sort();
        const i = chaves.indexOf(hoje);
        if (i > 0) {
            chaves.splice(i, 1);
            chaves.unshift(hoje);
        }

        const rotuloDia = (chave) => {
            if (chave === "sem-data") return "Sem data definida";
            if (chave === hoje) return "Hoje";
            if (chave === amanha) return "Amanhã";
            return diaPorExtenso(chave);
        };

        lista.innerHTML = chaves.map(chave => {
            const itens = porDia[chave].map(tarefa => {
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

            return `
                <div class="grupo-dia">
                    <p class="grupo-dia-titulo">${rotuloDia(chave)}</p>
                    ${itens}
                </div>
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
            iniciarSessao("focado", duracao, tarefa);//Começa a sessão focada com essa tarefa
        });
    });
}

function iniciarSessao(modo, duracao, tarefa = null) {
    clearInterval(intervalo);//Limpa qualquer temporizador anterior

    //Guarda a tarefa atual e marca que a sessão ainda não terminou
    tarefaAtual = tarefa;
    sessaoTerminada = false;

    //Aqui é criado o registo da sessão atual usando o model Sessao
    sessaoAtual = new Sessao(
        modo,
        duracao,
        tarefa ? tarefa.id : null,
        tarefa ? tarefa.nome : null
    );

    tempoTotal = duracao * 60;//Multiplica o tempo escolhido anteriormente por 60, assim passando de segundos para minutos

    tempoRestante = tempoTotal;
    emPausa = false;

    //Esconde a sidebar e ativa o layout próprio da sessão
    document.getElementById("sidebar").classList.add("hidden");
    document.querySelector(".foco-page").classList.add("sessao-ativa");

    //Desenha a interface do temporizador e atualiza os valores iniciais
    renderSessaoEmCurso(modo, tarefa);
    atualizarInterface();

    intervalo = setInterval(() => { //Começa um temporizador que corre a cada segundo
        if (emPausa || sessaoTerminada) return;//Se estiver em pausa ou terminada, não faz nada

        tempoRestante--;//vai diminuir 1 segundo

        //Se acabou o tempo, conclui a sessão
        if (tempoRestante <= 0) {
            tempoRestante = 0;
            atualizarInterface();
            concluirSessao();
            return;
        }

        atualizarInterface();
    }, 1000);
}//O temporizador funciona com setInterval, que executa uma função a cada 1000 milissegundos. A cada segundo reduzimos o tempo restante e atualizamos a interface

function renderSessaoEmCurso(modo, tarefa) { //Esta função desenha a interface da sessão ativa
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

                    ${modo === "focado"
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
    const circleLength = 2 * Math.PI * 115;//Calcula o comprimento do círculo

    //Isto permite controlar visualmente o progresso do círculo
    //O progresso circular é feito com SVG. Alteramos o strokeDashoffset para simular o preenchimento do círculo
    progressCircle.style.strokeDasharray = circleLength;
    progressCircle.style.strokeDashoffset = circleLength;

    //Liga botões aos eventos de pausar e terminar sessão
    document.getElementById("btnPausar").addEventListener("click", pausarSessao);
    document.getElementById("btnTerminar").addEventListener("click", terminarSessao);
}


//Esta função é chamada a cada segundo para sincronizar os números, a barra e o círculo visual com o tempo real
function atualizarInterface() {
    const tempoDecorrido = tempoTotal - tempoRestante;//Calcula quanto tempo já passou
    const percentagem = Math.round((tempoDecorrido / tempoTotal) * 100);//Calcula a percentagem de tempo decorrido em relação ao total

    if (!document.getElementById("tempoPrincipal")) return;

    document.getElementById("tempoPrincipal").textContent = formatarTempo(tempoRestante);//Atualiza o tempo principal
    document.getElementById("tempoDecorrido").textContent = formatarTempo(tempoDecorrido);//Atualiza tempo decorrido
    document.getElementById("tempoRestante").textContent = formatarTempo(tempoRestante);//Atualiza tempo restante

    //Atualiza a barra de progresso e a percentagem
    document.getElementById("barraProgresso").style.width = `${percentagem}%`;
    document.getElementById("percentagem").textContent = `${percentagem}%`;

    const progressCircle = document.getElementById("progressCircle");
    const circleLength = 2 * Math.PI * 115;

    progressCircle.style.strokeDashoffset = circleLength - (percentagem / 100) * circleLength;//Atualiza o círculo SVG
}

function pausarSessao() {
    emPausa = !emPausa;//Inverte o estado

    const btn = document.getElementById("btnPausar");
    btn.textContent = emPausa ? "▶" : "Ⅱ";//Muda o ícone do botão
}

function terminarSessao() {
    const modal = document.getElementById("modalTerminarSessao");//Vai buscar o modal de confirmação

    modal.classList.remove("hidden");//Mostra o modal de confirmação para terminar a sessão

    //Adiciona event listeners aos botões do modal
    document.getElementById("btnCancelarTerminar").onclick = function () { 
        modal.classList.add("hidden");
    };

    //Se confirmar que quer terminar, marca a sessão como terminada, para evitar que a função de concluir sessão seja chamada depois, e mostra a interface normal de criar sessão
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

function concluirSessao() {//Esta função corre quando o tempo chega a zero
    if (sessaoTerminada) return;//Evita executar duas vezes

    //Marca como terminada e para o temporizador
    sessaoTerminada = true;
    clearInterval(intervalo);
    intervalo = null;

    document.getElementById("sg").classList.add("open");//Abre visualmente o cadeado
    document.getElementById("btnPausar").textContent = "✓";//Muda o botão para check

    //Marca a sessão como concluída e guarda a hora de fim
    sessaoAtual.concluida = true;
    sessaoAtual.dataFim = new Date().toISOString();

    //Atualiza dados e mostra modal de sucesso
    prepararDadosSessao();
    mostrarModalSessaoConcluida();
}

function prepararDadosSessao() {
    if (tarefaAtual) {
        tarefaAtual.sessoesConcluidas = (tarefaAtual.sessoesConcluidas || 0) + 1;//Aumenta o número de sessões concluídas nessa tarefa

        const totalSessoes = tarefaAtual.numeroSessoes || tarefaAtual.numSessoes || 1;

        //Se completou todas as sessões necessárias, marca a tarefa como concluída
        if (tarefaAtual.sessoesConcluidas >= totalSessoes) {
            tarefaAtual.concluida = true;
        }
    }

    utilizador.sessoes = utilizador.sessoes || [];
    utilizador.sessoes.push(sessaoAtual);//Guarda a sessao atual no histórico do utilizador

    //Atualiza estatísticas
    utilizador.estatisticas = utilizador.estatisticas || {};
    utilizador.estatisticas.totalSessoes = (utilizador.estatisticas.totalSessoes || 0) + 1;
    utilizador.estatisticas.minutosEstudo = (utilizador.estatisticas.minutosEstudo || 0) + sessaoAtual.duracao;
    utilizador.estatisticas.xpTotal = (utilizador.estatisticas.xpTotal || 0) + 50;

    utilizador.xp = (utilizador.xp || 0) + 50;
}

function mostrarModalSessaoConcluida() {
    setTimeout(() => {//Espera para dar tempo da animação do cadeado aparecer
        const modal = document.getElementById("modalSessaoConcluida");
        const btnVoltar = document.getElementById("btnVoltarSessoes");

        if (!modal || !btnVoltar) {
            console.error("Modal de sessão concluída não encontrada.");
            return;
        }

        modal.classList.remove("hidden");//Mostra modal de sessão concluída

        btnVoltar.onclick = async function () {
            await guardarSessao();//Guarda os dados no servidor

            //Fecha modal, mostra sidebar e volta ao menu de sessões
            modal.classList.add("hidden");
            document.getElementById("sidebar").classList.remove("hidden");
            document.querySelector(".foco-page").classList.remove("sessao-ativa");
            renderCriarSessao();
        };
    }, 900);
}

async function guardarSessao() {
    try {
        utilizador.conquistas = verificarConquistas(utilizador);//Atualiza conquistas

        const resMissoes = await fetch("http://localhost:3000/missoes", {
            headers: { "Authorization": `Bearer ${token}` }//Vai buscar as missões ao servidor.
        });
        const missoes = await resMissoes.json();

        //Compara missões antigas com novas
        const antigasMissoes = utilizador.missoesConcluidas || [];
        const novasMissoes = verificarMissoesConcluidas(utilizador, missoes);

        //Calcula XP só das missões novas, isto evita ganhar XP repetido pela mesma missão
        const xpMissoes = missoes
            .filter(m => novasMissoes.includes(m.id) && !antigasMissoes.includes(m.id))
            .reduce((total, m) => total + m.xpRecompensa, 0);

        utilizador.missoesConcluidas = novasMissoes;
        utilizador.xp = (utilizador.xp || 0) + xpMissoes;
        utilizador.estatisticas.xpTotal = (utilizador.estatisticas.xpTotal || 0) + xpMissoes;

        //Atualiza parcialmente o utilizador no servidor, guarda tarefas,sessoes, estatísticas, XP, conquistas e missões concluídas
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

        localStorage.setItem("sessaoAtiva", JSON.stringify(utilizador));//Atualiza também a sessão local
    } catch (erro) {
        console.error("Erro ao guardar sessão:", erro);
    }
}

function formatarTempo(segundos) {//Esta função serve só para mostrar o tempo num formato legível
    const minutos = Math.floor(segundos / 60);
    const seg = String(segundos % 60).padStart(2, "0");

    return `${minutos}:${seg}`;
}

carregarPagina();//Chama a função inicial quando o ficheiro carrega