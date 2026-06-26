from django.urls import path
from .views import (login_view, register_view,upload_foto,remover_foto,logout_view,
                    criar_card,renomear_card,excluir_card,excluir_lista,criar_card_global,mover_card,
                    enviar_sugestao,exportar_pdf,salvar_descricao_card,alterar_wallpaper)

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
     path(
        "card/<int:id>/descricao/",
        salvar_descricao_card,
        name="salvar_descricao_card"
    ),
    path("lista/excluir/<str:coluna>/",excluir_lista,name="excluir_lista"),
    path("card/criar-global/", criar_card_global, name="criar_card_global"),
    path("sugestao/enviar/",enviar_sugestao,name="enviar_sugestao"),
    path("exportar-pdf/", exportar_pdf, name="exportar_pdf"),
    
    path("alterar-wallpaper/",alterar_wallpaper, name="alterar-wallpaper"),
    
    
]