export function verificarMissoesConcluidas(utilizador, missoes) {// Função para verificar quais missões foram concluídas com base nos dados do utilizador e nas missões disponíveis
    const concluidas = new Set(utilizador.missoesConcluidas || []);// Cria um conjunto para armazenar as missões concluídas, inicializando com as missões já existentes do utilizador, SET para evitar duplicados

    //Percorre todas a missões
    missoes.forEach(m => {
        if (concluidas.has(m.id)) return;//Ignora as ja concluídas

        //Calcula o progresso da missão com base no tipo e nos dados do utilizador
        const desde = m.criadaEm ? new Date(m.criadaEm) : new Date(0);
        const sessoes = (utilizador.sessoes || []).filter(s => s.concluida && new Date(s.dataInicio) >= desde);
        const totalMinutos = sessoes.reduce((total, s) => total + (s.duracao || 0), 0);
        const tarefasConcluidas = (utilizador.tarefas || []).filter(t => t.concluida && new Date(t.criadaEm || 0) >= desde).length;

        if (m.tipo === "sessao" && sessoes.length >= (m.meta || 1)) concluidas.add(m.id);// 
        if (m.tipo === "tarefa" && tarefasConcluidas >= (m.meta || 1)) concluidas.add(m.id);
        if (m.tipo === "tempo" && totalMinutos >= (m.meta || 30)) concluidas.add(m.id);
    });

    return [...concluidas];
}

//Esta função nao verifica se consluiu, ela calcula quanto falta 
export function calcularProgressoMissao(utilizador, missao) {
    const desde = missao.criadaEm ? new Date(missao.criadaEm) : new Date(0);// Define a data a partir da qual a missão começa a contar progresso; se não existir, considera todos os registos
    const sessoes = (utilizador.sessoes || []).filter(s => s.concluida && new Date(s.dataInicio) >= desde);// Filtra apenas as sessões concluídas realizadas após a criação da missão
    const totalMinutos = sessoes.reduce((total, s) => total + (s.duracao || 0), 0);// Soma a duração de todas as sessões válidas para obter o tempo total estudado
    const tarefasConcluidas = (utilizador.tarefas || []).filter(t => t.concluida && new Date(t.criadaEm || 0) >= desde).length;// Conta quantas tarefas concluídas foram criadas após o início da missão

    if (missao.tipo === "sessao") return { atual: sessoes.length, meta: missao.meta };// Para missões do tipo "sessao", devolve o número de sessões concluídas e a meta definida
    if (missao.tipo === "tarefa") return { atual: tarefasConcluidas, meta: missao.meta };// Para missões do tipo "tarefa", devolve o número de tarefas concluídas e a meta definida
    if (missao.tipo === "tempo") return { atual: totalMinutos, meta: missao.meta };// Para missões do tipo "tempo", devolve o total de minutos estudados e a meta definida

    return { atual: 0, meta: missao.meta || 1 };
}