const pontos = document.querySelectorAll(".ponto");
const diapositivos = document.querySelectorAll(".diapositivo-previsualizacao");

pontos.forEach(ponto => {
    ponto.addEventListener("click", () => {
        const indiceDiapositivo = ponto.dataset.slide;

        pontos.forEach(p => p.classList.remove("ativo"));
        diapositivos.forEach(d => d.classList.remove("ativo"));

        ponto.classList.add("ativo");

        const diapositivoSelecionado = document.getElementById(
            `diapositivo-${indiceDiapositivo}`
        );

        if (diapositivoSelecionado) {
            diapositivoSelecionado.classList.add("ativo");
        }
    });
});