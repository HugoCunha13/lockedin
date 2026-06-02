class Utilizador {
    constructor(nome, email, password) {
        this.nome = nome;
        this.email = email;
        this.password = password;
        this.role = "user";
        this.xp = 0;
        this.tarefas = [];
        this.sessoes = [];
        this.conquistas = [];
        this.estatisticas = {
            totalTarefasConcluidas: 0,
            totalSessoes: 0,
            minutosEstudo: 0,
            conquistasDesbloqueadas: 0,
            xpTotal: 0
        };
    }

    getNivel() {
        return Math.floor(this.xp / 200) + 1;
    }
}

export default Utilizador;