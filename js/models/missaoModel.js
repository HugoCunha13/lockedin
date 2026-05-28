class Missao {
    constructor(titulo, descricao, pontos) {
        this.id = crypto.randomUUID();
        this.titulo = titulo;
        this.descricao = descricao;
        this.pontos = pontos;
        this.concluida = false;
        this.xpRecompensa = pontos;
    }
}

export default Missao;