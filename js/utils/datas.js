// Funções puras de datas usadas pelo calendário de tarefas.
// Não tocam no DOM nem fazem fetch: recebem valores e devolvem valores.

export const NOMES_MESES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// A semana começa à segunda, como num calendário português
export const NOMES_DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

// Chave estável de um dia no formato "YYYY-MM-DD".
// É o que guardamos em cada tarefa e o que comparamos no calendário.
// NÃO usamos toISOString(): esse converte para UTC e a tarefa podia saltar
// para o dia anterior. Construímos a chave a partir das partes locais da data.
export function chaveDia(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

export function hojeChave() {
    return chaveDia(new Date());
}

// Converte uma chave "YYYY-MM-DD" de volta para um objeto Date local
export function chaveParaData(chave) {
    const [ano, mes, dia] = chave.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
}

// Texto amigável de um dia, ex: "Segunda, 8 de Junho"
export function diaPorExtenso(chave) {
    const data = chaveParaData(chave);
    const semana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    return `${semana[data.getDay()]}, ${data.getDate()} de ${NOMES_MESES[data.getMonth()]}`;
}

// Gera as 42 células (6 semanas x 7 dias) da grelha de um mês.
// Inclui dias do mês anterior e seguinte para preencher a grelha, como
// qualquer calendário mostra. Devolve um array de objetos Date.
export function gerarGrelhaMes(ano, mes) {
    const primeiro = new Date(ano, mes, 1);
    // getDay(): 0=Domingo..6=Sábado. Convertemos para 0=Segunda..6=Domingo
    // para saber quantos dias recuar até à segunda anterior.
    const deslocamento = (primeiro.getDay() + 6) % 7;

    const celulas = [];
    for (let i = 0; i < 42; i++) {
        celulas.push(new Date(ano, mes, 1 - deslocamento + i));
    }
    return celulas;
}