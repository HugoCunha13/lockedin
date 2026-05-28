class SessaoFoco {
    constructor(duracao) {
        this.id = crypto.randomUUID();
        this.duracao = duracao;
        this.dataInicio = new Date();
        this.xpRecompensa = 30;
    }
}

export default SessaoFoco;