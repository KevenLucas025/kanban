let menuAberto = null;

function toggleMenuLista(botao){

    const menu = botao.nextElementSibling;

    // fecha menus card
    document.querySelectorAll(".menu-card").forEach(m=>{
        m.style.display = "none";
    });

    // remove destaque cards
    document.querySelectorAll(".card-task").forEach(c=>{
        c.classList.remove("menu-open");
    });

    // fecha menu anterior
    document.querySelectorAll(".menu-lista").forEach(item=>{
        if(item !== menu){
            item.style.display = "none";
        }
    });

    // alterna atual
    if(menu.style.display === "block"){
        menu.style.display = "none";
        menuAberto = null;
    } else {
        menu.style.display = "block";
        menuAberto = menu;
    }
}

function toggleMenuCard(botao){

    const card = botao.closest(".card-task");
    const menu = botao.nextElementSibling;

    // fecha todos
    document.querySelectorAll(".menu-card").forEach(m => {
        m.style.display = "none";
    });

    document.querySelectorAll(".card-task").forEach(c => {
        c.classList.remove("menu-open");
    });

    if(menu.style.display === "block"){
        menu.style.display = "none";
    } else {
        menu.style.display = "block";
        card.classList.add("menu-open");
    }
}
function togleMenu(){

    const menu = document.getElementById("menuPerfil");

    if(menu){
        menu.style.display =
            (menu.style.display === "block") ? "none" : "block";
    }

}
