const pontos = document.querySelectorAll(".ponto");// Seleciona todos os pontos de navegação e os diapositivos correspondentes
const diapositivos = document.querySelectorAll(".diapositivo-previsualizacao");// Adiciona um event listener a cada ponto para mostrar o diapositivo correspondente quando clicado

pontos.forEach(ponto => {
    ponto.addEventListener("click", () => {// Obtém o índice do diapositivo a mostrar a partir do atributo data-slide do ponto clicado
        const indiceDiapositivo = ponto.dataset.slide;

        pontos.forEach(p => p.classList.remove("ativo"));// Remove a classe "ativo" de todos os pontos para desativar o destaque do ponto anterior
        diapositivos.forEach(d => d.classList.remove("ativo"));// Remove a classe "ativo" de todos os diapositivos para esconder o diapositivo anterior

        ponto.classList.add("ativo");// Adiciona a classe "ativo" ao ponto clicado para destacar o ponto atual

        // Seleciona o diapositivo correspondente ao índice obtido e adiciona a classe "ativo" para mostrar o diapositivo atual
        const diapositivoSelecionado = document.getElementById(
            `diapositivo-${indiceDiapositivo}`
        );

        // Verifica se o diapositivo existe antes de tentar adicionar a classe "ativo"
        if (diapositivoSelecionado) {
            diapositivoSelecionado.classList.add("ativo");
        }
    });
});