class Tarefa {
    constructor(nome, dia, numeroSessoes = 1, duracaoSessao = 25) {
        this.id = crypto.randomUUID();
        this.nome = nome;
        this.dia = dia;                      // "YYYY-MM-DD" do dia agendado (usado pelo calendário)
        this.numeroSessoes = numeroSessoes;  // quantas sessões de foco
        this.duracaoSessao = duracaoSessao;  // minutos por sessão
        this.sessoesConcluidas = 0;          // incrementado no foco a cada sessão terminada
        this.concluida = false;
        this.xpRecompensa = 50;
        this.notas = "";                     // notas escritas durante a sessão rápida desta tarefa
    }
}

export default Tarefa;