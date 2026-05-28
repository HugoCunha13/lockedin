class Tarefa {
    constructor(titulo) {
        this.id = crypto.randomUUID();
        this.titulo = titulo;
        this.concluida = false;
        this.xpRecompensa = 50;
    }
}

export default Tarefa;