import { renderNavbar } from "./navbarView.js";
import Tarefa from "../models/tarefaModel.js";//cria a estrututra das tarefas como id, nome, dia, número de sessões, duração das sessões, sessões concluídas, se está concluída ou não, XP de recompensa e notas
import {
    NOMES_MESES, NOMES_DIAS, chaveDia, hojeChave,
    chaveParaData, diaPorExtenso, gerarGrelhaMes
} from "../utils/datas.js";
import { verificarConquistas } from "../utils/conquistas.js";//Verifica as conquistas desbloqueadas
import { verificarMissoesConcluidas } from "../utils/missoes.js";//Verifica as missões concluídas

// Verifica se existe sessão ativa e token de autenticação
const sessao = JSON.parse(localStorage.getItem("sessaoAtiva"));
const token = localStorage.getItem("token");

//Se não houver login, manda para o login
if (!sessao || !token) {
    window.location.href = "login.html";
}

renderNavbar("Tarefas");//Desenha a sidebar e mete “Tarefas” como página ativa

const content = document.getElementById("content");//Guarda a zona onde o JavaScript vai escrever o conteúdo da página

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
    });//Vai buscar ao servidor o utilizador atual, para obter as tarefas, sessões e estatísticas mais recentes. Usa o token para autenticação.

    if (!response.ok) {
        window.location.href = "login.html";
        return;
    }//Se o pedido falhar, volta para login

    utilizador = await response.json();

    // Garante que os campos principais existem em utilizadores novos
    utilizador.tarefas = utilizador.tarefas || [];
    utilizador.sessoes = utilizador.sessoes || [];
    utilizador.estatisticas = utilizador.estatisticas || {};

    montarLayout();//Monta a estrutura fixa da página
    render();//Desenha o layout da página e mostra o calendário e as tarefas do dia selecionado
}

// Conta quantas tarefas existem em cada dia, para mostrar o indicador no calendário
function contagemPorDia() {
    const contagem = {};//Cria um objeto vazio

    for (const t of utilizador.tarefas) {
        if (!t.dia) continue;
        contagem[t.dia] = (contagem[t.dia] || 0) + 1;
    }//Percorre todas as tarefas e conta quantas há em cada dia

    return contagem;
}//Esta função permite mostrar no calendário um indicador com o número de tarefas de cada dia

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
    const t = termo.trim().toLowerCase();//Limpa espaços e transforma para minúsculas

    if (!t) return [];//Se não houver pesquisa, não devolve nada

    //Procura tarefas cujo nome contenha o texto pesquisado
    return utilizador.tarefas
        .filter(tarefa => tarefa.nome.toLowerCase().includes(t))
        .sort((a, b) => (a.dia || "").localeCompare(b.dia || ""));//Ordena por data
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

// Redesenha o calendário e o painel de tarefas (Sempre que muda o mês, dia ou filtro, chamo render() para atualizar a interface)
function render() {
    clearTimeout(timeoutAlternar);
    timeoutAlternar = null;

    renderCalendario();
    renderPainel();
}

function renderCalendario() {
    //Vai buscar o ano e mês atual que está a ser mostrado
    const ano = dataVista.getFullYear();
    const mes = dataVista.getMonth();

    const celulas = gerarGrelhaMes(ano, mes);//Gera 42 dias para o calendário
    
    //Vai buscar:número de tarefas por dia; data de hoje
    const contagem = contagemPorDia();
    const hoje = hojeChave();

    const cabecalho = NOMES_DIAS //Cria o cabeçalho: seg, ter, qua, qui, sex, sáb, dom
        .map(d => `<div class="cal-nome-dia">${d}</div>`)
        .join("");

    const grelha = celulas.map(data => {//Percorre todos os dias da grelha
        //Para cada dia: cria chave "YYYY-MM-DD"; vê se pertence ao mês atual; vê quantas tarefas tem.
        const chave = chaveDia(data);
        const doMes = data.getMonth() === mes;
        const total = contagem[chave] || 0;

        const classes = ["cal-dia"];//Começa com a classe base
        //Adiciona classes conforme o estado: fora do mês, hoje, selecionado
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
//Se houver texto na pesquisa, mostra resultados da pesquisa, se não houver pesquisa, mostra tarefas do dia selecionado.
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
    const tarefas = tarefasDoDia(diaSelecionado);//Vai buscar as tarefas daquele dia já filtradas
    //Depois define mensagem se não houver tarefas
    const mensagem =
        filtroEstado === "concluidas"
            ? "Ainda não há tarefas concluídas neste dia."
            : filtroEstado === "atrasadas"
                ? "Não tens tarefas atrasadas neste dia."
                : "Sem tarefas neste dia. Cria a primeira.";
    //Mensagem muda conforme o filtro
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
    const resultados = pesquisar(termoPesquisa);//Procura tarefas cujo nome contenha o texto pesquisado, em todos os dias, e ordena por data

    //Mostra mensagem ou resultados
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

    document.body.appendChild(fundo);//Adiciona o modal ao body do HTML

    const elSessoes = fundo.querySelector("#m-sessoes");// Guarda o elemento que mostra o número de sessões, para poder atualizar quando o utilizador clicar nos botões + e -

    fundo.addEventListener("click", (e) => {//Isto é delegação de eventos dentro do modal
        const acao = e.target.dataset.acao;

        if (acao === "menos") {
            elSessoes.textContent = Math.max(1, Number(elSessoes.textContent) - 1);//Se clicar no - , diminui o número de sessões, mas nunca deixa ser menor que 1
        }

        if (acao === "mais") {
            elSessoes.textContent = Number(elSessoes.textContent) + 1;// Se clicar no + , aumenta o número de sessões   
        }

        if (acao === "criar") {// Se clicar no botão de criar, cria a nova tarefa com os dados do modal
            const nome = fundo.querySelector("#m-nome").value.trim();
            const dia = fundo.querySelector("#m-dia").value;
            const duracao = Number(fundo.querySelector("#m-duracao").value);
            const sessoes = Number(elSessoes.textContent);

            if (!nome || !dia) return;

            utilizador.tarefas.push(new Tarefa(nome, dia, sessoes, duracao));// cria a nova tarefa e adiciona ao array de tarefas do utilizador

            // Atualiza o dia selecionado e a data vista para o dia da nova tarefa, para que o painel mostre a nova tarefa criada
            diaSelecionado = dia;
            dataVista = chaveParaData(dia);
            filtroEstado = "ativas";

            // Fecha o modal, redesenha a página e guarda as alterações no servidor
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
        if (e.target.id === "campo-pesquisa") {//Sempre que escreves, atualiza o termo e redesenha o painel
            termoPesquisa = e.target.value;
            renderPainel();
        }
    });

    content.addEventListener("click", (e) => {//Sempre que clicas, verifica se clicaste num botão com data-acao e executa a ação correspondente
        const alvo = e.target.closest("[data-acao]");

        if (!alvo) return;//Se não clicaste num botão com data-acao, não faz nada

        const { acao, dia, id, filtro } = alvo.dataset;//vai buscar os dados do botão clicado

        if (acao === "mes-anterior") {
            dataVista = new Date(dataVista.getFullYear(), dataVista.getMonth() - 1, 1);//Muda para o mês anterior e redesenha o calendário
            renderCalendario();
        }

        if (acao === "mes-seguinte") {
            dataVista = new Date(dataVista.getFullYear(), dataVista.getMonth() + 1, 1);//Muda para o mês seguinte e redesenha o calendário
            renderCalendario();
        }

        if (acao === "selecionar-dia") {//Muda o dia selecionado e redesenha o painel de tarefas
            diaSelecionado = dia;
            render();
        }

        if (acao === "ir-dia") {//Muda o dia selecionado para o dia da tarefa clicada e redesenha o painel de tarefas
            diaSelecionado = dia;
            dataVista = chaveParaData(dia);
            termoPesquisa = "";
            document.getElementById("campo-pesquisa").value = "";
            render();
        }

        if (acao === "filtro") {//Muda filtro para "ativas", "concluidas" ou "atrasadas" e redesenha o painel de tarefas
            filtroEstado = filtro;
            renderPainel();
        }

        if (acao === "abrir-modal") {
            abrirModal();
        }

        if (acao === "iniciar") {
            const tarefa = utilizador.tarefas.find(t => t.id === id);//Vai buscar a tarefa clicada pelo id

            //Se encontrou a tarefa, guarda-a no localStorage e redireciona para a página de foco
            if (tarefa) {
                localStorage.setItem("tarefaParaFoco", JSON.stringify(tarefa));
                window.location.href = "/html/foco.html";
            }
        }

        if (acao === "ir-hoje") {//ao clicar volta para o dia atual
            diaSelecionado = hojeChave();
            dataVista = new Date();
            render();
        }

        if (acao === "alternar") {
            const tarefa = utilizador.tarefas.find(t => t.id === id);//procura a tarefa

            if (!tarefa) return;

            tarefa.concluida = !tarefa.concluida;//inverte o estado

            const linha = alvo.closest(".tarefa");

            if (linha) linha.outerHTML = templateTarefa(tarefa);

            clearTimeout(timeoutAlternar);
            timeoutAlternar = setTimeout(() => renderPainel(), 450);//Redesenha o painel depois de 450ms para mostrar a animação de conclusão da tarefa

            guardar();//Guarda as alterações no servidor
        }

        if (acao === "remover") {//Remove a tarefa do array, redesenha e guarda
            utilizador.tarefas = utilizador.tarefas.filter(t => t.id !== id);
            render();
            guardar();
        }
    });
}

// Guarda as alterações feitas às tarefas no servidor e atualiza a sessão local
async function guardar() {
    try {
        utilizador.conquistas = verificarConquistas(utilizador);//Atualiza conquistas

        const resMissoes = await fetch("http://localhost:3000/missoes", {//Vai buscar as missões ao servidor.
            headers: { "Authorization": `Bearer ${token}` }
        });
        const missoes = await resMissoes.json();

        //compara missões antigas com novas
        const antigasMissoes = utilizador.missoesConcluidas || [];
        const novasMissoes = verificarMissoesConcluidas(utilizador, missoes);

        //Calcula XP só das missões novas, isto evita ganhar XP repetido pela mesma missão
        const xpMissoes = missoes
            .filter(m => novasMissoes.includes(m.id) && !antigasMissoes.includes(m.id))
            .reduce((total, m) => total + m.xpRecompensa, 0);

        utilizador.missoesConcluidas = novasMissoes;
        utilizador.xp = (utilizador.xp || 0) + xpMissoes;
        utilizador.estatisticas.xpTotal = (utilizador.estatisticas.xpTotal || 0) + xpMissoes;

        await fetch(`http://localhost:3000/users/${utilizador.id}`, {//Faz patch porque só queremos atualizar alguns campos do utilizador
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

        localStorage.setItem("sessaoAtiva", JSON.stringify(utilizador));//Atualiza também a localStorage
    } catch (erro) {
        console.error("Erro ao guardar tarefas:", erro);
    }
}

carregarPagina();
