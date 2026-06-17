export function verificarMissoesConcluidas(utilizador, missoes) {
    const concluidas = new Set(utilizador.missoesConcluidas || []);

    missoes.forEach(m => {
        if (concluidas.has(m.id)) return;

        const desde = m.criadaEm ? new Date(m.criadaEm) : new Date(0);
        const sessoes = (utilizador.sessoes || []).filter(s => s.concluida && new Date(s.dataInicio) >= desde);
        const totalMinutos = sessoes.reduce((total, s) => total + (s.duracao || 0), 0);
        const tarefasConcluidas = (utilizador.tarefas || []).filter(t => t.concluida && new Date(t.criadaEm || 0) >= desde).length;

        if (m.tipo === "sessao" && sessoes.length >= (m.meta || 1)) concluidas.add(m.id);
        if (m.tipo === "tarefa" && tarefasConcluidas >= (m.meta || 1)) concluidas.add(m.id);
        if (m.tipo === "tempo" && totalMinutos >= (m.meta || 30)) concluidas.add(m.id);
    });

    return [...concluidas];
}

export function calcularProgressoMissao(utilizador, missao) {
    const desde = missao.criadaEm ? new Date(missao.criadaEm) : new Date(0);
    const sessoes = (utilizador.sessoes || []).filter(s => s.concluida && new Date(s.dataInicio) >= desde);
    const totalMinutos = sessoes.reduce((total, s) => total + (s.duracao || 0), 0);
    const tarefasConcluidas = (utilizador.tarefas || []).filter(t => t.concluida && new Date(t.criadaEm || 0) >= desde).length;

    if (missao.tipo === "sessao") return { atual: sessoes.length, meta: missao.meta };
    if (missao.tipo === "tarefa") return { atual: tarefasConcluidas, meta: missao.meta };
    if (missao.tipo === "tempo") return { atual: totalMinutos, meta: missao.meta };

    return { atual: 0, meta: missao.meta || 1 };
}