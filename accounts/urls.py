from django.urls import path
from .views import (login_view, register_view,upload_foto,remover_foto,logout_view,
                    criar_card,renomear_card,excluir_card,excluir_lista,criar_card_global,mover_card,
<<<<<<< HEAD
                    enviar_sugestao,exportar_pdf,salvar_descricao_card,alterar_wallpaper,
                    gerenciar_usuarios,criar_usuario,listar_usuarios,alterar_perfil_usuario,
                    verificar_username,obter_usuario,editar_usuario,excluir_usuario)
=======
                    enviar_sugestao,exportar_pdf,salvar_descricao_card,alterar_wallpaper)
>>>>>>> 7d5180e22eecfa8f7fc26d5d49d0c5b118986c81

urlpatterns = [
    path('', login_view, name='login'),
    path('register/', register_view, name='register'),
    path('upload-foto/',upload_foto,name='upload_foto'),
    path('remover-foto/',remover_foto,name='remover_foto'),
    path('logout/',logout_view, name='logout'),
    path("card/criar/", criar_card, name="criar_card"),
    path("card/mover/",mover_card,name="mover_card"),
    path("card/renomear/<int:id>/", renomear_card, name="renomear_card"),
    path("card/excluir/<int:id>/", excluir_card, name="excluir_card"),
<<<<<<< HEAD
    path("card/<int:id>/descricao/",salvar_descricao_card,name="salvar_descricao_card"),
=======
     path(
        "card/<int:id>/descricao/",
        salvar_descricao_card,
        name="salvar_descricao_card"
    ),
>>>>>>> 7d5180e22eecfa8f7fc26d5d49d0c5b118986c81
    path("lista/excluir/<str:coluna>/",excluir_lista,name="excluir_lista"),
    path("card/criar-global/", criar_card_global, name="criar_card_global"),
    path("sugestao/enviar/",enviar_sugestao,name="enviar_sugestao"),
    path("exportar-pdf/", exportar_pdf, name="exportar_pdf"),
    
    path("alterar-wallpaper/",alterar_wallpaper, name="alterar-wallpaper"),
<<<<<<< HEAD
    path("usuarios/",gerenciar_usuarios,name='gerenciar_usuarios'),
    path("usuarios/criar/",criar_usuario,name="criar_usuario"),
    path("usuarios/listar/", listar_usuarios, name="listar_usuarios"),
    path("usuarios/<int:id>/alterar-perfil/",alterar_perfil_usuario,name="alterar-perfil-usuario" ),
    path("usuarios/verificar-username/",verificar_username,name="verificar_username"),
    path("usuarios/<int:id>/",obter_usuario,name="obter_usuario"),
    path("usuarios/<int:id>/editar/",editar_usuario,name="editar_usuario"),
    path(
    "usuarios/<int:id>/excluir/",excluir_usuario,name="excluir_usuario"),
=======
>>>>>>> 7d5180e22eecfa8f7fc26d5d49d0c5b118986c81
    
    
]