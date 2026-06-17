class Missao {
    constructor(titulo, descricao, tipo, meta, xpRecompensa) {
        this.id = crypto.randomUUID();
        this.titulo = titulo;
        this.descricao = descricao;
        this.tipo = tipo;
        this.meta = meta;
        this.xpRecompensa = xpRecompensa;
        this.criadaEm = new Date().toISOString();
    }
}

export default Missao;