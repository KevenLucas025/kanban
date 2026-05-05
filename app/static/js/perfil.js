document.addEventListener('DOMContentLoaded', function() {

    // 1. Olhinho da senha
    const toggleIcons = document.querySelectorAll('.toggle-password');

    toggleIcons.forEach(icon => {
        icon.addEventListener('click', function() {

            const input = this.parentElement.querySelector('input');

            if (input.type === 'password') {
                input.type = 'text';
                this.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                this.classList.replace('fa-eye-slash', 'fa-eye');
            }

        });
    });


    // 2. Limpar erro inputs
    document.querySelectorAll('.erro-input').forEach(input => {
        input.addEventListener('focus', function() {
            this.classList.remove('erro-input');
        });
    });


    // 3. Toast após recarregar página (foto removida)
    if(sessionStorage.getItem("fotoRemovida")){

        sessionStorage.removeItem("fotoRemovida");

        const toast = document.getElementById("toastSucesso");

        if(toast){

            toast.innerHTML = "✅ Foto removida com sucesso";
            toast.style.background = "#22c55e";

            toast.classList.add("show");

            setTimeout(() => {
                toast.classList.remove("show");
            }, 2500);
        }
    }

});




// =======================
// CROPPER FOTO
// =======================

let cropper;

document.getElementById("inputFoto").addEventListener("change", function(e){

    const file = e.target.files[0];

    if(file){

        const reader = new FileReader();

        reader.onload = function(event){

            document.getElementById("imagemCrop").src = event.target.result;

            document.getElementById("modalCrop").style.display = "flex";

            cropper = new Cropper(
                document.getElementById("imagemCrop"),
                {
                    aspectRatio: 1,
                    viewMode: 1,
                    dragMode: "move",

                    ready() {
                        cropper.setCropBoxData({
                            left: 120,
                            top: 140,
                            width: 300,
                            height: 300
                        });
                    }
                }
            );

        };

        reader.readAsDataURL(file);
    }

});


function confirmarCrop(){

    cropper.getCroppedCanvas({
        width: 300,
        height: 300
    }).toBlob(function(blob){

        let formData = new FormData();

        formData.append("foto", blob);

        formData.append(
            "csrfmiddlewaretoken",
            document.querySelector("[name=csrfmiddlewaretoken]").value
        );

        fetch("/upload-foto/", {
            method: "POST",
            body: formData
        })
        .then(() => location.reload());

    });

}


function fecharModalCrop(){

    document.getElementById("modalCrop").style.display = "none";

    if(cropper){
        cropper.destroy();
        cropper = null;
    }

    document.getElementById("inputFoto").value = "";
}




function visualizarFoto(){
    const avatar = document.querySelector(".user-avatar img");

    if(!avatar){
        const toast = document.getElementById("toastSucesso");

        toast.innerHTML = "⚠️ Nenhuma imagem cadastrada";
        toast.style.background = "#f59e0b";

        toast.classList.add("show");

        setTimeout(() => {
            toast.classList.remove("show");
        }, 2500);

        return;
    }

    document.getElementById("imgVisualizar").src = avatar.src;
    document.getElementById("modalVisualizar").style.display = "flex";

}

function fecharVisualizar(){
    document.getElementById("modalVisualizar").style.display = "none";
}

function abrirDados(){
    document.getElementById("modalDados").style.display = "flex";
}

function fecharDados(){
    document.getElementById("modalDados").style.display = "none";
}


function confirmarRemover(){

    fetch("/remover-foto/", {
        method: "POST",
        headers: {
            "X-CSRFToken":
                document.querySelector("[name=csrfmiddlewaretoken]").value
        }
    })
    .then(res => res.json())
    .then(data => {

        if(data.status === "ok"){

            fecharRemover();

            sessionStorage.setItem("fotoRemovida", "1");

            location.reload();
        }

    });

}

// =======================
// REMOVER FOTO
// =======================

function removerFoto(){

    const avatar = document.querySelector(".user-avatar img");

    // não existe foto
    if(!avatar){

        const toast = document.getElementById("toastSucesso");

        toast.innerHTML = "⚠️ Não há imagem para remover";
        toast.style.background = "#f59e0b";

        toast.classList.add("show");

        setTimeout(() => {
            toast.classList.remove("show");
        }, 2500);

        return;
    }

    // existe foto
    document.getElementById("modalRemover").style.display = "flex";
}

function abrirUpload(){
    document.getElementById("inputFoto").click();
}


// Fechar menu clicando fora
document.addEventListener("click", function(e) {

    const menu = document.getElementById("menuPerfil");

    if(menu && !e.target.closest(".user-menu")){
        menu.style.display = "none";
    }

});