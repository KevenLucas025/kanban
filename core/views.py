from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from accounts.models import Card
from datetime import date, timedelta


@login_required
def dashboard(request):

    cards = Card.objects.filter(
        user=request.user
    )

    data_de = request.GET.get("de")
    data_ate = request.GET.get("ate")

    if data_de:
        cards = cards.filter(criado_em__date__gte=data_de)

    if data_ate:
        cards = cards.filter(criado_em__date__lte=data_ate)

    cards = cards.order_by("ordem", "id")
    
    total_cards = cards.count()

    contador_colunas = {
        "AF": cards.filter(coluna="AF").count(),
        "PE": cards.filter(coluna="PE").count(),
        "CA": cards.filter(coluna="CA").count(),
        "FF": cards.filter(coluna="FF").count(),
        "EP": cards.filter(coluna="EP").count(),
        "CO": cards.filter(coluna="CO").count(),
    }

    # 🧠 NOVA PARTE
    hoje = date.today()

    # 🔴 Vencidos (não concluídos)
    vencidos = cards.filter(
        data_vencimento__lt=hoje
    ).exclude(coluna="CO").count()

    # 🟡 Próximos do vencimento (até 2 dias)
    proximos = cards.filter(
        data_vencimento__gte=hoje,
        data_vencimento__lte=hoje + timedelta(days=2)
    ).exclude(coluna="CO").count()

    # ✅ Concluídos hoje
    concluidos_hoje = cards.filter(
        coluna="CO",
        criado_em__date=hoje
    ).count()

    return render(request, 'core/dashboard.html', {
        "cards": cards,
        "contador_colunas": contador_colunas,
        "total_cards": total_cards,

        # 👇 novos dados pro menu
        "vencidos": vencidos,
        "proximos": proximos,
        "concluidos_hoje": concluidos_hoje,
    })