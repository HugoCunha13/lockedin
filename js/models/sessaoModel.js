class Sessao {
    constructor(modo, duracao, tarefaId = null, nomeTarefa = null) {
        this.id = crypto.randomUUID();
        this.modo = modo;
        this.duracao = duracao;
        this.tarefaId = tarefaId;
        this.nomeTarefa = nomeTarefa;
        this.concluida = false;
        this.dataInicio = new Date().toISOString();
        this.dataFim = null;
    }
}

export default Sessao;