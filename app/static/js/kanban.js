document.querySelectorAll(".coluna").forEach(coluna => {

    new Sortable(coluna, {
        group: "kanban",
        animation: 200,
        draggable: ".card-task",
        filter: ".menu-card, .btn-menu-card",
        preventOnFilter: false,

        ghostClass: "sortable-ghost",
        chosenClass: "sortable-chosen",
        dragClass: "sortable-drag",

        forceFallback: true,
        fallbackOnBody: true,
        swapThreshold: 0.65,

        onEnd: function (evt) {

        const card = evt.item;
        const novaColuna = evt.to.dataset.coluna;
        const colunaAntiga = evt.from.dataset.coluna;
        const cardId = card.dataset.id;
        
        const csrf = document.querySelector("[name=csrfmiddlewaretoken]").value;

        fetch("/card/mover/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrf
            },
            body: JSON.stringify({
                id: cardId,
                coluna: novaColuna
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === "ok") {

                // ✅ ATUALIZA A COLUNA NO CARD
                card.dataset.coluna = novaColuna;

                // 🔢 Atualiza contadores só se salvou
                if (novaColuna !== colunaAntiga) {
                    atualizarContador(colunaAntiga, -1);
                    atualizarContador(novaColuna, +1);
                }

            } else {
                alert("Erro ao mover card");
            }
        })
        .catch(err => {
            console.error("Erro:", err);
        });
    }
}); 
});
