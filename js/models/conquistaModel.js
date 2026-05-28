class Conquista {
    constructor(titulo, descricao, icone) {
        this.id = crypto.randomUUID();
        this.titulo = titulo;
        this.descricao = descricao;
        this.icone = icone;
        this.desbloqueada = false;
        this.xpRecompensa = 100;
    }
}

export default Conquista;