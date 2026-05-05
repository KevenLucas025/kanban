function fecharNovoCard(){
    document.getElementById("modalNovoCard").style.display = "none";
}

function salvarNovoCard(){

    const nome = document.getElementById("nomeNovoCard").value.trim();
    

    if(nome === ""){
        return;
    }

    const csrf =
        document.querySelector("[name=csrfmiddlewaretoken]").value;

    fetch("/card/criar/", {
        method:"POST",
        headers:{
            "Content-Type":"application/json",
            "X-CSRFToken": csrf
        },
        body: JSON.stringify({
            titulo: nome,
            coluna: colunaSelecionada.dataset.coluna
            
        })
    })
    .then(res => res.json())
    .then(data => {

        const novo = document.createElement("div");

        novo.className = "card-task";

        // 🔥 IMPORTANTE
        novo.setAttribute("data-id", data.id);
        novo.setAttribute("data-vencimento", data.vencimento);
        novo.setAttribute("data-status", data.status);
        novo.setAttribute("data-coluna", colunaSelecionada.dataset.coluna);

        novo.innerHTML = `
            <div class="topo-card">

                <span class="status ${data.status}"></span>
                <span class="titulo-card">${data.titulo}</span>

                <small class="data-card">
                    📅 ${data.data}
                </small>

                <button class="btn-menu-card"
                    onclick="toggleMenuCard(this)">
                    ⋮
                </button>

                <div class="menu-card">
                    <a href="javascript:void(0)" onclick="abrirDetalhesCard('${data.id}')">ℹ️ Detalhes</a>
                    <a href="javascript:void(0)" onclick="renomearCard(this)">✏️ Renomear</a>
                    <a href="javascript:void(0)" onclick="excluirCard(this)">🗑️ Excluir</a>
                </div>

            </div>
        `;

        colunaSelecionada.appendChild(novo);

        atualizarContador(colunaSelecionada.dataset.coluna, 1);

        recalcularTotalGlobal();

        fecharNovoCard();

        
    });

}
function salvarCardsGlobal() {
    const nome = document.getElementById("tituloCardsGlobal").value.trim();
    const botao = document.querySelector("#modalNovoCardGlobal .btn-salvar");
    

    if (botao.disabled) return;

    // trava botão e mostra carregando
    botao.disabled = true;
    botao.innerText = "Salvando...";

    if (nome === "") {
        mostrarAlerta("⚠️ Digite um título", "erro");
        botao.disabled = false;
        botao.innerText = "Salvar em todas selecionadas";
        return;
    }

    const checkboxes = document.querySelectorAll(".checkbox-colunas input:checked");

    const colunas = Array.from(checkboxes)
        .filter(cb => cb.id !== "checkAllColunas")
        .map(cb => cb.value);

    if (colunas.length === 0) {
        mostrarAlerta("⚠️ Selecione pelo menos uma coluna", "erro");
        botao.disabled = false;
        botao.innerText = "Salvar em todas selecionadas";
        return;
    }

    const csrf = document.querySelector("[name=csrfmiddlewaretoken]")?.value;

    fetch("/card/criar-global/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrf
        },
        body: JSON.stringify({
            titulo: nome,
            colunas: colunas
            
        })
    })
    .then(res => {
        if (!res.ok) throw new Error("Erro no servidor");
        return res.json();
    })
    .then(data => {

        colunas.forEach(colunaCodigo => {

            const containerColuna = document.querySelector(
                `[data-coluna="${colunaCodigo}"]`
            );

            if (!containerColuna) return;

            const cardInfo = data.cards[colunaCodigo];
            if (!cardInfo) return;

            const novoCard = document.createElement("div");

            novoCard.className = "card-task";

            // 🔥 IMPORTANTE
            novoCard.setAttribute("data-id", cardInfo.id);
            novoCard.setAttribute("data-vencimento", cardInfo.vencimento);
            novoCard.setAttribute("data-status", cardInfo.status);
            novoCard.setAttribute("data-coluna", colunaCodigo);

            novoCard.innerHTML = `
                <div class="topo-card">

                    <span class="status ${cardInfo.status}"></span>
                    <span class="titulo-card">${data.titulo}</span>

                    <small class="data-card">📅 ${cardInfo.data}</small>

                    <button class="btn-menu-card"
                        onclick="toggleMenuCard(this)">
                        ⋮
                    </button>

                    <div class="menu-card">
                        <a href="javascript:void(0)" onclick="abrirDetalhesCard('${cardInfo.id}')">
                            ℹ️ Detalhes
                        </a>

                        <a href="javascript:void(0)" onclick="renomearCard(this)">
                            ✏️ Renomear
                        </a>

                        <a href="javascript:void(0)" onclick="excluirCard(this)">
                            🗑️ Excluir
                        </a>
                    </div>
                </div>
            `;

            containerColuna.appendChild(novoCard);

            atualizarContador(colunaCodigo, 1);
        });

        recalcularTotalGlobal();

        // pequeno tempo pro usuário ver o "Salvando..."
        setTimeout(() => {

            fecharCardsGlobal();

            mostrarAlerta("✅ Cards adicionados com sucesso", "sucesso");

            botao.disabled = false;
            botao.innerText = "Salvar em todas selecionadas";

        }, 3000);

    })
    .catch(error => {

        mostrarAlerta("❌ Erro ao criar cards.", "erro");
        console.error("Detalhes do erro:", error);

        botao.disabled = false;
        botao.innerText = "Salvar em todas selecionadas";
    });
}


let cardParaExcluir = null;

function excluirCard(link){

    const card = link.closest(".card-task");
    const menu = link.closest(".menu-card");

    //fecha o menu aberto
    menu.style.display = "none";
    card.classList.remove("menu-open");

    // guardar o card selecionado
    cardParaExcluir = card;

    // abre modal
    document.getElementById("modalExcluirCard").style.display = "flex";
}

function fecharExcluirCard(){
    document.getElementById("modalExcluirCard").style.display = "none";
    cardParaExcluir = null;
}

function confirmarExcluirCard(){

    if(!cardParaExcluir) return;

    const cardId = cardParaExcluir.getAttribute("data-id");

    const csrf = document.querySelector("[name=csrfmiddlewaretoken]").value;

    fetch(`/card/excluir/${cardId}/`, {
        method: "POST",
        headers: {
            "X-CSRFToken": csrf
        }
    })
    .then(res => res.json())
    .then(data => {

        if(data.status === "ok"){
            const coluna = cardParaExcluir.closest(".coluna");
            const colunaCodigo = coluna.dataset.coluna;

            cardParaExcluir.remove();

            // 1. Diminui o número da coluna específica
            atualizarContador(colunaCodigo, -1);

            // 2. Recalcula o topo baseado nos novos valores das colunas
            recalcularTotalGlobal();

            fecharExcluirCard();
        }

    });

}

let tituloEditando = null;

function renomearCard(link){

    const card = link.closest(".card-task");

    link.closest(".menu-card").style.display = "none";

    card.classList.remove("menu-open");

    tituloEditando = card.querySelector(".titulo-card");

    document.getElementById("inputRenomearCard").value =
        tituloEditando.innerText;

    document.getElementById("modalRenomearCard").style.display = "flex";
}
function fecharRenomearCard(){
    document.getElementById("modalRenomearCard").style.display = "none";
}

function salvarRenomearCard(){

    const novoNome = document.getElementById("inputRenomearCard").value.trim();

    if(novoNome === ""){
        return;
    }

    const cardId = tituloEditando.closest(".card-task").getAttribute("data-id");

    const csrf = document.querySelector("[name=csrfmiddlewaretoken]").value;

    fetch(`/card/renomear/${cardId}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrf
        },
        body: JSON.stringify({
            titulo: novoNome
        })
    })
    .then(res => res.json())
    .then(data => {

        if(data.status === "ok"){
            tituloEditando.innerText = novoNome;
            fecharRenomearCard();
        }

    });

}
document.addEventListener("click", function (e) {

    // 1. ADICIONE ESTA TRAVA: 
    // Se o clique for em um SELECT, INPUT ou dentro de um MODAL, 
    // interrompemos a função para não fechar nada por engano.
    if (e.target.tagName === "SELECT" || 
        e.target.tagName === "INPUT" || 
        e.target.closest(".box-confirmar") || 
        e.target.closest(".modal-confirmar")) {
        return; 
    }

    // =========================
    // FECHAR MENU DA COLUNA
    // =========================
    const menusLista = document.querySelectorAll(".menu-lista");
    menusLista.forEach(menu => {
        const botao = menu.previousElementSibling; 
        // Verifica se o botão existe antes de usar o .contains
        if (botao) {
            const clicouDentro = menu.contains(e.target) || botao.contains(e.target);
            if (!clicouDentro) {
                menu.style.display = "none";
            }
        }
    });

    // =========================
    // FECHAR MENU DO CARD
    // =========================
    const menusCard = document.querySelectorAll(".menu-card");
    menusCard.forEach(menu => {
        const botao = menu.previousElementSibling;
        if (botao) {
            const clicouDentro = menu.contains(e.target) || botao.contains(e.target);
            if (!clicouDentro) {
                menu.style.display = "none";
            }
        }
    });
});

function atualizarContador(colunaCodigo, delta) {

    const coluna = document.querySelector(`[data-coluna="${colunaCodigo}"]`);

    if (!coluna) return;

    const span = coluna.querySelector("h2 span");

    if (!span) return;

    let valorAtual = parseInt(span.innerText || "0");

    span.innerText = valorAtual + delta;
}

let colunaSelecionada = null;

function adicionarCard(link){

    colunaSelecionada = link.closest(".coluna");

    document.getElementById("modalNovoCard").style.display = "flex";

    document.getElementById("nomeNovoCard").value = "";

    link.closest(".menu-lista").style.display = "none";
}

let listaSelecionada = null;

function excluirLista(link){

    listaSelecionada = link.closest(".coluna");


    // fecha menu
    link.closest(".menu-lista").style.display = "none";

    document.getElementById("modalExcluirLista").style.display = "flex";
}

function fecharExcluirLista(){
    document.getElementById("modalExcluirLista").style.display = "none";
    listaSelecionada = null;
}


function confirmarExcluirLista(){

    if(!listaSelecionada) return;

    const colunaCodigo = listaSelecionada.dataset.coluna;

    const csrf = document.querySelector("[name=csrfmiddlewaretoken]").value;

   fetch(`/lista/excluir/${colunaCodigo}/`,{
    method: "POST",
    headers: {
        "X-CSRFToken": csrf
    }
   })
   .then(res => res.json())
   .then(data => {
        if (data.status === "ok"){
            const cards = listaSelecionada.querySelectorAll(".card-task");
            cards.forEach(card => card.remove());

            // Zera a coluna
            const spanColuna = listaSelecionada.querySelector("h2 span");
            if(spanColuna) spanColuna.innerText = "0";

            // Recalcula o topo
            recalcularTotalGlobal();

            fecharExcluirLista();
        }
    });
}

function filtrarCards(){
    const de = document.getElementById("dataDe").value;
    const ate = document.getElementById("dataAte").value;

    window.location.href = `?de=${de}&ate=${ate}`;
}
function mostrarAlerta(msg, tipo = "erro") {

    const toast = document.getElementById("toastAlerta");

    toast.innerText = msg;

    // limpa classes antigas
    toast.classList.remove("show", "hide", "sucesso", "erro");

    // define cor
    if (tipo === "sucesso") {
        toast.classList.add("sucesso");
    } else {
        toast.classList.add("erro");
    }

    // entra
    setTimeout(() => {
        toast.classList.add("show");
    }, 10);

    // tempo maior na tela
    setTimeout(() => {
        toast.classList.add("hide");

        setTimeout(() => {
            toast.classList.remove("show", "hide", "sucesso", "erro");
        }, 400);

    }, 3500);
}

document.getElementById("formFiltroData").addEventListener("submit", function(e){

    const inputDe = document.getElementById("dataDe");
    const inputAte = document.getElementById("dataAte");

    let de = inputDe.value;
    let ate = inputAte.value;

    if(de === "" && ate === ""){
        
        const hoje = new Date();

        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2,"0");
        const dia = String(hoje.getDate()).padStart(2,"0");

        const primeiroDia = `${ano}-${mes}-01`;
        const hojeFormatado = `${ano}-${mes}-${dia}`;

        inputDe.value = primeiroDia;
        inputAte.value = hojeFormatado;

        return;
    }

    // Se preencheu só um campo
    if(de !== "" && ate === ""){
        e.preventDefault();
        mostrarAlerta("Preencha a data Até.");
        return;
    }

    // Se preencheu só um campo
    if(de === "" && ate !== ""){
        e.preventDefault();
        mostrarAlerta("Preencha a data De.");
        return;
    }

});

function abrirNovoCardGlobal(){
    // Fecha menu lateral
    const menuLateral = document.getElementById('menuLateral');
    const bsOffcanvas = bootstrap.Offcanvas.getInstance(menuLateral);
    if (bsOffcanvas) {
        bsOffcanvas.hide();
    }

    // Abre modal
    document.getElementById("modalNovoCardGlobal").style.display = "flex";

    // Input
    const input = document.getElementById("tituloCardsGlobal");
    input.value = "";

    // Reset checkboxes
    const checkAll = document.getElementById("checkAllColunas");
    const checkboxes = document.querySelectorAll(".checkbox-colunas input[type='checkbox']:not(#checkAllColunas)");

    checkboxes.forEach(cb => cb.checked = false);

    if (checkAll) {
        checkAll.checked = false;
        checkAll.indeterminate = false;
    }

    setTimeout(() => input.focus(), 100);
}




function fecharCardsGlobal(){
    document.getElementById("modalNovoCardGlobal").style.display = "none";
}
const checkAll = document.getElementById("checkAllColunas");

if (checkAll) {
    const checkboxes = document.querySelectorAll(".checkbox-colunas input[type='checkbox']:not(#checkAllColunas)");

    checkAll.addEventListener("change", function () {
        checkboxes.forEach(cb => cb.checked = checkAll.checked);
    });

    checkboxes.forEach(cb => {
        cb.addEventListener("change", () => {
            const allChecked = [...checkboxes].every(c => c.checked);
            const noneChecked = [...checkboxes].every(c => !c.checked);

            if (allChecked) {
                checkAll.checked = true;
                checkAll.indeterminate = false;
            } else if (noneChecked) {
                checkAll.checked = false;
                checkAll.indeterminate = false;
            } else {
                checkAll.indeterminate = true;
            }
        });
    });
}

function atualizarTotalCards(valor){
    const total = document.getElementById("totalCardsNumero");

    if (total){
        total.innerText = valor;
    }
}
function somarTotalCards(qtd = 1) {
    const totalSpan = document.getElementById("totalCardsNumero");
    if (totalSpan) {
        let atual = parseInt(totalSpan.innerText.trim()) || 0;
        totalSpan.innerText = atual + qtd;
    }
}

function diminuirTotalCards(qtd = 1) {
    const totalSpan = document.getElementById("totalCardsNumero");
    if (totalSpan) {
        let atual = parseInt(totalSpan.innerText.trim()) || 0;
        totalSpan.innerText = Math.max(0, atual - qtd);
    }
}

function recalcularTotalGlobal() {
    const spansColunas = document.querySelectorAll(".coluna h2 span");
    let somaTotal = 0;

    spansColunas.forEach(span => {
        // Pega o número dentro do span da coluna
        const valorColuna = parseInt(span.innerText) || 0;
        somaTotal += valorColuna;
    });

    const totalGlobalSpan = document.getElementById("totalCardsNumero");
    if (totalGlobalSpan) {
        totalGlobalSpan.innerText = somaTotal;
    }
}
const board = document.querySelector('.board');

board.addEventListener('wheel', function (e) {

    const isInsideColumn = e.target.closest('.lista-cards');

    // Se estiver dentro da coluna → deixa scroll normal (vertical)
    if (isInsideColumn) {
        return; // não faz nada
    }

    // Se NÃO estiver dentro da coluna → transforma em scroll horizontal
    e.preventDefault();
    board.scrollLeft += e.deltaY;

}, { passive: false });

function abrirBuscaCard() {
    // Fecha o menu do Bootstrap
    const menuLateral = document.getElementById("menuLateral");
    const bsOffcanvas = bootstrap.Offcanvas.getInstance(menuLateral);
    if (bsOffcanvas) bsOffcanvas.hide();

    // Abre o modal com flex para centralizar
    document.getElementById("modalBuscaCard").style.display = "flex";

    const input = document.getElementById("inputBuscaCard");
    input.value = "";
    setTimeout(() => input.focus(), 150);
}

function fecharBuscaCard() {
    document.getElementById("modalBuscaCard").style.display = "none";
}

function buscarCard() {

    const termo = document.getElementById("inputBuscaCard")
        .value
        .toLowerCase()
        .trim();

    const cards = document.querySelectorAll(".card-task");

    let encontrados = 0;

    cards.forEach(card => {

        const titulo = card.querySelector(".titulo-card")
            ?.innerText
            .toLowerCase() || "";

        if (titulo.includes(termo)) {
            card.style.display = "block";
            encontrados++;
        } else {
            card.style.display = "none";
        }

    });

    atualizarTotalCards(encontrados);

    fecharBuscaCard();

    if (encontrados === 0) {
        mostrarAlerta("Nenhum card encontrado.");
    } else {
        mostrarAlerta(`✅ ${encontrados} card(s) encontrado(s)`, "sucesso");
    }
}

let cardEmDetalhes = null;

function abrirDetalhesCard(id){

    const card = document.querySelector(`[data-id="${id}"]`);

    const titulo = card.querySelector(".titulo-card").innerText;
    const dataCriacao = card.querySelector(".data-card").innerText.replace("📅 ", "");
    const vencimento = card.dataset.vencimento;

    // 👉 converter datas
    const hoje = new Date();

    const partes = vencimento.split("/");
    const dataVenc = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);

    const diffTempo = dataVenc - hoje;
    const diffDias = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

    let statusPrazo = "";

    if (diffDias < 0) {
        statusPrazo = "🔴 Vencido";
    } else if (diffDias <= 2) {
        statusPrazo = "🟡 Próximo do vencimento";
    } else {
        statusPrazo = "🟢 No prazo";
    }

    // 👉 preencher modal
    document.getElementById("detalheTitulo").innerText = titulo;
    document.getElementById("detalheData").innerText = dataCriacao;
    document.getElementById("detalheVencimento").innerText = vencimento;

    // 👇 AQUI entra o novo status
    document.getElementById("detalheStatus").innerText = statusPrazo;

    document.getElementById("modalDetalhesCard").style.display = "flex";
}

function fecharDetalhesCard() {
    document.getElementById("modalDetalhesCard").style.display = "none";
    cardEmDetalhes = null;
}


// Esta função APENAS abre o modal para você escolher a opção
function abrirFiltro(){
    // Primeiro, fecha o menu lateral do Bootstrap se ele estiver aberto
    const menuLateral = document.getElementById("menuLateral");
    if (menuLateral) {
        const bsOffcanvas = bootstrap.Offcanvas.getInstance(menuLateral);
        if (bsOffcanvas) {
            bsOffcanvas.hide();
        }
    }

    // Abre o modal de filtro
    const modal = document.getElementById("modalFiltro");
    modal.style.display = "flex";
    
    // Garante que o select esteja limpo e pronto para uso
    document.getElementById("tipoFiltro").focus();
}

function fecharFiltro(){
    document.getElementById("modalFiltro").style.display = "none";
}

// Esta função é chamada APENAS quando você clica no botão "Aplicar" dentro do modal
function aplicarFiltro(){
    const tipo = document.getElementById("tipoFiltro").value;
    if(!tipo) {
        mostrarAlerta("⚠️ Selecione uma opção de filtro");
        return;
    }

    const colunas = document.querySelectorAll(".lista-cards");

    colunas.forEach(coluna => {
        const cards = Array.from(coluna.querySelectorAll(".card-task"));

        cards.sort((a,b) => {
            const tituloA = a.querySelector(".titulo-card").innerText.toLowerCase();
            const tituloB = b.querySelector(".titulo-card").innerText.toLowerCase();

            const parseData = (txt) => {
                const partes = txt.replace("📅 ", "").trim().split("/");
                return new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
            };

            if(tipo === "az") return tituloA.localeCompare(tituloB);
            if(tipo === "za") return tituloB.localeCompare(tituloA);
            
            const dataA = a.querySelector(".data-card").innerText;
            const dataB = b.querySelector(".data-card").innerText;

            if(tipo === "novo") return parseData(dataB) - parseData(dataA);
            if(tipo === "antigo") return parseData(dataA) - parseData(dataB);

            return 0;
        });

        cards.forEach(card => coluna.appendChild(card));
    });

    // Fecha o modal DEPOIS de organizar tudo
    fecharFiltro();
    mostrarAlerta("Filtro aplicado!", "sucesso");
}

function exportarExcel(){
    console.log("CLICOU EXPORTAR");
    
    const cards = document.querySelectorAll(".card-task");

    let dados = [];

    cards.forEach(card => {

        const titulo = card.querySelector(".titulo-card")?.innerText || "";
        const data = card.querySelector(".data-card")?.innerText.replace("📅 ", "") || "";
        const status = card.getAttribute("data-status") || "";
        const coluna = card.getAttribute("data-coluna") || "";

        dados.push({
            "Título": titulo,
            "Data Criação": data,
            "Status": status,
            "Coluna": coluna
        });
    });

    if (dados.length == 0){
<<<<<<< HEAD
        mostrarAlerta("Nenhum card encontrado para exportar.");
        return;
    }


=======
        mostrarAlerta("Nenhum card encontrado para exportar.")
    }

>>>>>>> db5648e56da9144a3b68fae156b8402cf6db1205
    // cria a planilha
    const ws = XLSX.utils.json_to_sheet(dados);

    // cria workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cards");


    // exporta arquivo
    XLSX.writeFile(wb, "cards_kanban.xlsx");

}

function abrirSugestao(){

    // Primeiro, fecha o menu lateral do Bootstrap se ele estiver aberto
    const menuLateral = document.getElementById("menuLateral");
    if (menuLateral) {
        const bsOffcanvas = bootstrap.Offcanvas.getInstance(menuLateral);
        if (bsOffcanvas) {
            bsOffcanvas.hide();
        }
    }

    document.getElementById("modalSugestao").style.display = "flex";

    // Garante que o select esteja limpo e pronto para uso
    document.getElementById("tipoSugestao").focus();
}

function fecharSugestao(){
    document.getElementById("modalSugestao").style.display = "none";
}

function enviarSugestao(){

    
    const nome = document.getElementById("nomeSugestao").value.trim();
    const email = document.getElementById("emailSugestao").value.trim();
    const tipo = document.getElementById("tipoSugestao").value;
    const descricao = document.getElementById("descricaoSugestao").value.trim();

    if(!nome || !email || !tipo || !descricao){
        mostrarAlerta("⚠️ Preencha todos os campos");
        return;
    }

    const csrf = document.querySelector("[name=csrfmiddlewaretoken]").value;

    fetch("/sugestao/enviar/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrf
        },
        body: JSON.stringify({
            nome,
            email,
            tipo,
            descricao
        })
    })
    .then(res => res.json())
    .then(data => {
        
        if (data.status === "ok"){
            mostrarAlerta("✅ Sugestão enviada com sucesso!", "sucesso");
            fecharSugestao();
        }else{
            mostrarAlerta("❌ Erro ao enviar sugestão");
        }
    })
    .catch(() => {
        mostrarAlerta("❌ Erro na comunicação com o servidor.")
    });
}
function exportarPDF(){

    const elemento = document.querySelector(".board");

    const opcoes = {
        margin: 0.5,
        filename: "kanban.pdf",
        image: {type: "jpeg",quality: 0.98},
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in",format: "a4", orientation: "landscape" }
    }

    html2pdf().set(opcoes).from(elemento).save();
}

document.getElementById("btnExportarPdf").addEventListener("click", function () {
    document.getElementById("modalConfirmarPDF").style.display = "flex";
});

function fecharConfirmarPDF(){
    document.getElementById("modalConfirmarPDF").style.display = "none";
}

async function confirmarExportacaoPDF(){

    fecharConfirmarPDF();

    const btn = document.getElementById("btnExportarPdf");

    btn.disabled = true;
    btn.innerText = "Gerando PDF... ⏳";

    // 🔥 mostra o alerta primeiro
    mostrarAlerta("📄 Gerando PDF... você pode continuar usando o Kanban normalmente 😉", "sucesso");

    // 👇 ESSA LINHA É A CHAVE
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
        const response = await fetch("/exportar-pdf/");

        if (!response.ok) {
            throw new Error("Erro ao gerar PDF");
        }

        const blob = await response.blob();

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "kanban.pdf";
        document.body.appendChild(a);
        a.click();

        a.remove();
        window.URL.revokeObjectURL(url);

        mostrarAlerta("✅ PDF gerado com sucesso!", "sucesso");

    } catch (error) {
        console.error(error);
        mostrarAlerta("❌ Erro ao gerar PDF", "erro");
    } finally {
        btn.disabled = false;
        btn.innerText = "📄 Exportar PDF";
    }
}