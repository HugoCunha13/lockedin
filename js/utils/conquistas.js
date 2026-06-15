export function verificarConquistas(utilizador) {
    const desbloqueadas = new Set(utilizador.conquistas || []);
    const sessoes = utilizador.sessoes || [];
    const tarefas = utilizador.tarefas || [];

    const sessoesConcluidas = sessoes.filter(s => s.concluida).length;
    const tarefasConcluidas = tarefas.filter(t => t.concluida).length;
    const sequencia = calcularSequencia(sessoes);

    if (tarefas.length > 0) desbloqueadas.add(1);

    if (sessoes.length > 0) desbloqueadas.add(2);

    if (tarefas.length > 0 && tarefas.every(t => t.concluida)) desbloqueadas.add(3);

    if (sequencia >= 3) desbloqueadas.add(4);

    if (sessoesConcluidas >= 10) desbloqueadas.add(5);

    if (tarefasConcluidas >= 25) desbloqueadas.add(6);

    if (sequencia >= 7) desbloqueadas.add(7);

    if (sessoesConcluidas >= 50) desbloqueadas.add(8);

    if (tarefasConcluidas >= 250) desbloqueadas.add(9);

    if (sequencia >= 100) desbloqueadas.add(10);

    if (sessoes.some(s => s.concluida && s.duracao <= 10)) desbloqueadas.add(12);

    if (sessoes.some(s => !s.concluida)) desbloqueadas.add(13);

    if (sessoesConcluidas >= 100) desbloqueadas.add(15);

    return [...desbloqueadas];
}

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