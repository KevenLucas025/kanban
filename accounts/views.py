from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail
from django.contrib.auth import logout
from django.http import JsonResponse
from .models import Card, Profile
from django.contrib import messages
from datetime import datetime,timedelta
from django.core.mail import EmailMultiAlternatives
from django.contrib.admin.views.decorators import staff_member_required
from reportlab.lib.pagesizes import A4
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils.timezone import now
import json


def login_view(request):
    if request.method == 'POST':
        usuario_input = request.POST.get('username','').strip()
        senha_input = request.POST.get('password','').strip()
        
        
        # 1. Verificação de campos vazios
        if not usuario_input or not senha_input:
            messages.error(request,"Por favor preencha os campos obrigatórios.")
            return render(request, "accounts/login.html")
        
        # 1. Tentar encontrar o objeto do usuário primeiro (por username ou email)
        user_obj = None
        
        # Tenta por username
        user_obj = User.objects.filter(username=usuario_input).first()
        
        # Se não achou por username, tenta por email
        if not user_obj:
            user_obj = User.objects.filter(email=usuario_input).first()
            
        # 2. Se após as duas buscas não achamos ninguém:
        if not user_obj:
            messages.error(request, "Usuário ou e-mail não cadastrados.")
            return render(request, "accounts/login.html")
        
        user = authenticate(request, username=user_obj.username, password=senha_input)
        
        if user is not None:
            login(request,user)
            return redirect("dashboard")
        else:
            # Aqui temos certeza: o usuário existe, mas a senha está errada
            messages.error(request,"Usuário ou senha inválidos.")
            return render(request,"accounts/login.html")
        
    return render(request, 'accounts/login.html')

def register_view(request):

    if request.method == 'POST':
        
        nome_completo = request.POST.get('nome_completo','').strip()
        username = request.POST.get('new_user','').strip()
        email = request.POST.get('new_email','').strip()
        password = request.POST.get('new_pass','').strip()
        confirm = request.POST.get('new_confirm','').strip()
        
        if not nome_completo or not username or not email or not password:
            messages.error(request, "Preencha todos os campos")
            return render(request, 'accounts/register.html')

        if password != confirm:
            messages.error(request, "As senhas não coincidem")
            return render(request, 'accounts/register.html',{
                'erro_campo':'senha'
            })

        if User.objects.filter(username=username).exists():
            messages.error(request, "Usuário já existe")
            return render(request, 'accounts/register.html',{
                'erro_campo': 'username'
            })
            
        if User.objects.filter(email=email).exists():
            messages.error(request, 'Email já cadastrado')
            return render(request, 'accounts/register.html', {
                'erro_campo': 'email'
            })
            
        primeiro_usuario = User.objects.count() == 0

        usuario = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=nome_completo
        )

        # Se for o primeiro usuário do sistema,
        # concede privilégios de administrador.
        if primeiro_usuario:
            usuario.is_staff = True
            usuario.is_superuser = True
            usuario.save()

        messages.success(request, "Conta criada com sucesso")
        return render(request, 'accounts/register.html', {
            'cadastro_ok': True
        })

    return render(request, 'accounts/register.html')

@login_required
def mover_card(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)

            card = Card.objects.get(id=data["id"], user=request.user)
            card.coluna = data["coluna"]
            card.save()

            return JsonResponse({"status": "ok"})
        except Exception as e:
            return JsonResponse({"status": "erro", "msg": str(e)})

@login_required
@csrf_protect
def upload_foto(request):
    if request.method == "POST" and request.FILES.get("foto"):
        
        profile, created  = Profile.objects.get_or_create(
            user=request.user
        )
        
        profile.foto = request.FILES["foto"]
        profile.save()
    return redirect("dashboard")

@login_required
@csrf_protect
def remover_foto(request):
    if request.method == "POST":

        profile, created = Profile.objects.get_or_create(
            user=request.user
        )

        if profile.foto:
            profile.foto.delete(save=False)
            profile.foto = None
            profile.save()

        return JsonResponse({"status": "ok"})
    
def logout_view(request):
    logout(request)
    return redirect("login")

@login_required
def criar_card(request):
    if request.method == "POST":
        data = json.loads(request.body)
        
        vencimento = data.get("data_vencimento")
        
        data_vencimento = None
        if vencimento:
            data_vencimento = datetime.strptime(vencimento,"%Y-%m-%d").date()
        else:
            data_vencimento = datetime.today().date() + timedelta(days=5)

        card = Card.objects.create(
            user=request.user,
            titulo=data["titulo"],
            descricao=data.get("descricao", ""),
            prioridade=data.get("prioridade", "normal"),
            responsavel=data.get("responsavel", ""),
            tags=data.get("tags", ""),
            coluna=data["coluna"],
            data_vencimento=data_vencimento
        )
        

        return JsonResponse({
            "id": card.id,
            "titulo": card.titulo,
            "descricao": card.descricao,
            "prioridade": card.prioridade,
            "responsavel": card.responsavel,
            "tags": card.tags,
            "data": card.criado_em.strftime("%d/%m/%Y"),
            "vencimento": card.data_vencimento.strftime("%d/%m/%Y") if card.data_vencimento else "",
            "status": card.status()
        })
        
@login_required   
def renomear_card(request, id):
    if request.method == "POST":
        data = json.loads(request.body)

        card = Card.objects.get(id=id, user=request.user)
        card.titulo = data["titulo"]
        card.save()

        return JsonResponse({"status":"ok"})
    
@login_required   
def excluir_card(request, id):
    if request.method == "POST":
        card = Card.objects.get(id=id, user=request.user)
        card.delete()

        return JsonResponse({"status":"ok"})
    
@login_required
def excluir_lista(request,coluna):
    if request.method == "POST":
        
        Card.objects.filter(
            user=request.user,
            coluna=coluna
        ).delete()
        
    return JsonResponse({"status":"ok"})

@login_required
def criar_card_global(request):

    data = json.loads(request.body)

    titulo = data["titulo"]
    colunas = data["colunas"]
    vencimento = data.get("data_vencimento")
    
    data_vencimento = None
    if vencimento:
        data_vencimento = datetime.strptime(vencimento, "%Y-%m-%d").date()
    else:
        data_vencimento = datetime.today().date() + timedelta(days=5)

    cards_data = {}

    for coluna in colunas:
        card = Card.objects.create(
            titulo=titulo,
            coluna=coluna,
            user=request.user,
            data_vencimento=data_vencimento
        )

        cards_data[coluna] = {
            "id": card.id,
            "data": card.criado_em.strftime("%d/%m/%Y"),
            "vencimento": card.data_vencimento.strftime("%d/%m/%Y") if card.data_vencimento else "",
            "status": card.status()
        }

    return JsonResponse({
        "status": "ok",
        "titulo": titulo,
        "cards": cards_data
    })
    
@csrf_exempt
def enviar_sugestao(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)

            nome = data.get("nome")
            email = data.get("email")
            tipo = data.get("tipo")
            descricao = data.get("descricao")

            assunto = f"[KANBAN] {tipo} - {nome}"

            mensagem = f"""
                Nova sugestão recebida:

                👤 Nome: {nome}
                📧 Email: {email}
                📌 Tipo: {tipo}

                📝 Descrição:
                {descricao}
                """

            mensagem_html = f"""
                <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
                    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; padding:20px; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                        
                        <h2 style="color:#2563eb; margin-bottom:10px;">💡 Nova sugestão recebida</h2>

                        <p style="color:#555;">Você recebeu uma nova mensagem pelo sistema Kanban.</p>

                        <hr style="margin:20px 0; border:none; border-top:1px solid #eee;">

                        <p><strong>👤 Nome:</strong> {nome}</p>
                        <p><strong>📧 Email:</strong> {email}</p>
                        <p><strong>📌 Tipo:</strong> {tipo}</p>

                        <div style="margin-top:20px;">
                            <strong>📝 Descrição:</strong>
                            <div style="background:#f9fafb; padding:15px; border-radius:8px; margin-top:8px; color:#333;">
                                {descricao}
                            </div>
                        </div>

                        <hr style="margin:25px 0; border:none; border-top:1px solid #eee;">

                        <p style="font-size:12px; color:#999;">
                            Enviado automaticamente pelo sistema Kanban
                        </p>

                    </div>
                </div>
                """
            
            email_msg = EmailMultiAlternatives(
                subject=assunto,
                body=mensagem_html,
                from_email="suportekanban@outlook.com",
                to=["keven.lucas00@hotmail.com"],
                reply_to=[email],
            )
            
            email_msg.attach_alternative(mensagem_html,"text/html")
            email_msg.send()
            
            return JsonResponse({"status":"ok"})
    
        except Exception as e:
                print("ERRO:", e)
                return JsonResponse({"status": "erro", "msg": str(e)})
            
@login_required
def exportar_pdf(request):
    from weasyprint import HTML
    cards = Card.objects.filter(user=request.user)

    hoje = now().date()
    limite_proximo = hoje + timedelta(days=3)

    colunas = {}

    for card in cards:
        nome = card.coluna

        if nome not in colunas:
            colunas[nome] = {
                "total": 0,
                "ok": 0,
                "proximo": 0,
                "vencido": 0,
            }

        colunas[nome]["total"] += 1

        if card.data_vencimento:
            vencimento = card.data_vencimento

            if vencimento < hoje:
                colunas[nome]["vencido"] += 1
            elif vencimento <= limite_proximo:
                colunas[nome]["proximo"] += 1
            else:
                colunas[nome]["ok"] += 1
        else:
            colunas[nome]["ok"] += 1  # fallback

    # 🔥 converter para lista (IMPORTANTE pro template)
    colunas_lista = []

    for nome, dados in colunas.items():
        colunas_lista.append({
            "nome": nome,
            "total": dados["total"],
            "ok": dados["ok"],
            "proximo": dados["proximo"],
            "vencido": dados["vencido"],
        })

    html_string = render_to_string("pdf/kanban.html", {
        "colunas": colunas_lista,
        "now": now()
    })

    pdf = HTML(string=html_string).write_pdf()

    response = HttpResponse(pdf, content_type="application/pdf")
    response['Content-Disposition'] = 'attachment; filename="kanban.pdf"'

    return response
            
@login_required
def salvar_descricao_card(request, id):

    if request.method == "POST":

        data = json.loads(request.body)

        card = Card.objects.get(
            id=id,
            user=request.user
        )

        card.descricao = data.get("descricao", "")
        card.save()

        return JsonResponse({
            "status": "ok"
        })

    return JsonResponse({
        "status": "erro"
    })
    
@login_required
@csrf_protect
def alterar_wallpaper(request):
    if request.method == 'POST':
        
        data = json.loads(request.body)
        imagem = data.get("imagem")
        
        wallpapers_permitidos = [
            "montanha.jpg",
            "lago.jpg",
            "floresta.jpg",
            "cidade.jpg",
        ]
        
        if imagem not in wallpapers_permitidos:
            return JsonResponse({
                "status": "erro",
                "msg": "Wallpaper inválido."
            })
            
        profile, created = Profile.objects.get_or_create(
            user=request.user
        )
        
        profile.wallpaper = imagem
        profile.save()
        
        return JsonResponse({
            "status": "ok"
        })
    return JsonResponse({
        "status": "ok"
    })
    
@login_required
def gerenciar_usuarios(request):
    print(request.user)
    print(request.user.is_staff)
    
    if not request.user.is_staff:
        return redirect("dashboard")
    
    return render(request,"usuarios/gerenciar_usuarios.html")

@login_required
def criar_usuario(request):
    if not request.user.is_staff:
        return JsonResponse({
            "status":"erro",
            "msg": "Sem permissão."
        })
        
    if request.method == "POST":
        
        data = json.loads(request.body)
        
        nome = data.get("nome", "").strip()
        username = data.get("username", "").strip()
        email = data.get("email", "").strip()
        senha = data.get("senha", "")
        admin = data.get("admin", False)
        
        if User.objects.filter(username=username).exists():
            return JsonResponse({
                "status":"erro",
                "msg":"Usuário já existe."
            })
                    
        if User.objects.filter(email=email).exists():
            return JsonResponse({
                "status":"erro",
                "msg":"E-mail já cadastrado."
            })
            
        usuario = User.objects.create_user(
            username=username,
            email=email,
            password=senha,
            first_name=nome
        )

        usuario.is_staff = admin
        usuario.save()

        return JsonResponse({
            "status":"ok"
        })
    return JsonResponse({
        "status":"erro"
        })
        
        
@login_required
def listar_usuarios(request):

    if not request.user.is_staff:
        return JsonResponse({
            "status": "erro",
            "mensagem": "Sem permissão para acessar esta funcionalidade."
        })

    usuarios = User.objects.all()

    dados = []

    for u in usuarios:
        dados.append({
            "id": u.id,
            "usuario": u.username,
            "nome": u.first_name,
            "email": u.email,
            "administrador": u.is_staff,
            "ativo": u.is_active,
            "data_criacao": u.date_joined.strftime("%d/%m/%Y"),
            "ultimo_login": u.last_login.strftime("%d/%m/%Y %H:%M") if u.last_login else "Nunca acessou",
        })

    return JsonResponse({
        "usuarios": dados
    })
    
@login_required
def alterar_perfil_usuario(request, id):
    
    if not request.user.is_staff:
        return JsonResponse({
            "status": "erro",
            "mensagem": "Sem permissão"
        })
    if request.method != "POST":
        return JsonResponse({"status": "erro"})
    
    usuario = User.objects.get(id=id)
     
    usuario.is_staff = not usuario.is_staff
    usuario.save()

    return JsonResponse({
        "status": "ok",
        "administrador": usuario.is_staff
    })
    
@login_required
def verificar_username(request):
    
    if not request.user.is_staff:
        return JsonResponse({"status":"erro"},status=403)
    
    username = request.GET.get("username","").strip()
    
    existe = User.objects.filter(username__iexact=username).exists()

    return JsonResponse({
        "existe": existe
    })
    
@login_required
def obter_usuario(request, id):

    if not request.user.is_staff:
        return JsonResponse({
            "status": "erro",
            "msg": "Sem permissão."
        }, status=403)

    try:
        usuario = User.objects.get(id=id)

        return JsonResponse({
            "status": "ok",
            "usuario": {
                "id": usuario.id,
                "nome": usuario.first_name,
                "username": usuario.username,
                "email": usuario.email,
                "administrador": usuario.is_staff,
                "ativo": usuario.is_active,
                "data_criacao": usuario.date_joined.strftime("%d/%m/%Y"),
                "ultimo_login": (
                    usuario.last_login.strftime("%d/%m/%Y %H:%M")
                    if usuario.last_login else "Nunca acessou"
                ),
            }
        })

    except User.DoesNotExist:
        return JsonResponse({
            "status": "erro",
            "msg": "Usuário não encontrado."
        }, status=404)
        
@login_required
def editar_usuario(request, id):
    if not request.user.is_staff:
        return JsonResponse({
            "status": "erro",
            "msg":"Sem permissão"
        },status=403)
        
    if request.method != "POST":
        return JsonResponse({
            "status":"erro",
            "msg":"Método inválido"
        },status=405)
    
    try:
        usuario = User.objects.get(id=id)
        
        data = json.loads(request.body)
        
        nome = data.get("nome", "").strip()
        username = data.get("username", "").strip()
        email = data.get("email", "").strip()
        admin = data.get("admin", False)
        ativo = data.get("ativo", True)
        
        if not nome or not username or not email:
            return JsonResponse({
                "status": "erro",
                "msg": "Preencha todos os campos."
            })
         # Verifica se outro usuário já utiliza esse username
        if User.objects.exclude(id=id).filter(username__iexact=username).exists():
            return JsonResponse({
                "status": "erro",
                "msg": "Nome de usuário já está em uso."
            })
        
         # Verifica se outro usuário já utiliza esse e-mail
        if User.objects.exclude(id=id).filter(email__iexact=email).exists():
            return JsonResponse({
                "status": "erro",
                "msg": "E-mail já cadastrado."
            })
            
        usuario.first_name = nome
        usuario.username = username
        usuario.email = email
        usuario.is_staff = admin
        usuario.is_active = ativo
        
        usuario.save()
        
        return JsonResponse({
            "status":"ok"
        })
        
    except User.DoesNotExist:
        return JsonResponse({
            "status": "erro",
            "msg": "Usuário não encontrado."
        }, status=404)
        
@login_required
def excluir_usuario(request, id):

    if not request.user.is_staff:
        return JsonResponse({
            "status": "erro",
            "msg": "Sem permissão."
        }, status=403)

    if request.method != "POST":
        return JsonResponse({
            "status": "erro",
            "msg": "Método inválido."
        }, status=405)

    try:
        usuario = User.objects.get(id=id)

        # Não permitir excluir a própria conta
        if usuario == request.user:
            return JsonResponse({
                "status": "erro",
                "msg": "Você não pode excluir sua própria conta."
            })

        usuario.delete()

        return JsonResponse({
            "status": "ok"
        })

    except User.DoesNotExist:
        return JsonResponse({
            "status": "erro",
            "msg": "Usuário não encontrado."

        }, status=404)

