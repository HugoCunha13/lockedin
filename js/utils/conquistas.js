export function verificarConquistas(utilizador) {// Função para verificar quais conquistas foram desbloqueadas com base nos dados do utilizador
    const desbloqueadas = new Set(utilizador.conquistas || []);// Cria um conjunto para armazenar as conquistas desbloqueadas, inicializando com as conquistas já existentes do utilizador
    const sessoes = utilizador.sessoes || [];// Obtém as sessões do utilizador, ou um array vazio se não houver sessões
    const tarefas = utilizador.tarefas || [];// Obtém as tarefas do utilizador, ou um array vazio se não houver tarefas

    // Calcula o número de sessões e tarefas concluídas, bem como a sequência de dias focados consecutivos
    const sessoesConcluidas = sessoes.filter(s => s.concluida).length;
    const tarefasConcluidas = tarefas.filter(t => t.concluida).length;
    const sequencia = calcularSequencia(sessoes);

    if (tarefas.length > 0) desbloqueadas.add(1);// Se o utilizador tiver pelo menos uma tarefa, desbloqueia a conquista 1

    if (sessoes.length > 0) desbloqueadas.add(2);// Se o utilizador tiver pelo menos uma sessão, desbloqueia a conquista 2

    if (tarefas.length > 0 && tarefas.every(t => t.concluida)) desbloqueadas.add(3);// Se o utilizador tiver tarefas e todas estiverem concluídas, desbloqueia a conquista 3

    if (sequencia >= 3) desbloqueadas.add(4);// Se o utilizador tiver uma sequência de pelo menos 3 dias focados, desbloqueia a conquista 4

    if (sessoesConcluidas >= 10) desbloqueadas.add(5);// Se o utilizador tiver concluído pelo menos 10 sessões, desbloqueia a conquista 5

    if (tarefasConcluidas >= 25) desbloqueadas.add(6);// Se o utilizador tiver concluído pelo menos 25 tarefas, desbloqueia a conquista 6

    if (sequencia >= 7) desbloqueadas.add(7);// Se o utilizador tiver uma sequência de pelo menos 7 dias focados, desbloqueia a conquista 7

    if (sessoesConcluidas >= 50) desbloqueadas.add(8);// Se o utilizador tiver concluído pelo menos 50 sessões, desbloqueia a conquista 8

    if (tarefasConcluidas >= 250) desbloqueadas.add(9);// Se o utilizador tiver concluído pelo menos 250 tarefas, desbloqueia a conquista 9

    if (sequencia >= 100) desbloqueadas.add(10);// Se o utilizador tiver uma sequência de pelo menos 100 dias focados, desbloqueia a conquista 10

    if (sessoes.some(s => s.concluida && s.duracao <= 10)) desbloqueadas.add(12);// Se o utilizador tiver pelo menos uma sessão concluída com duração de 10 minutos ou menos, desbloqueia a conquista 12

    if (sessoes.some(s => !s.concluida)) desbloqueadas.add(13);// Se o utilizador tiver pelo menos uma sessão não concluída, desbloqueia a conquista 13

    if (sessoesConcluidas >= 100) desbloqueadas.add(15);// Se o utilizador tiver concluído pelo menos 100 sessões, desbloqueia a conquista 15

    return [...desbloqueadas];
}

// Função auxiliar para calcular a sequência de dias focados consecutivos
function calcularSequencia(sessoes) {
    const dias = [...new Set(sessoes.map(s => new Date(s.dataInicio).toDateString()))];
    const hoje = new Date();
    let sequencia = 0;
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