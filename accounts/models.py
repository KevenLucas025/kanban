from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from datetime import date


class Profile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE
    )

    foto = models.ImageField(
        upload_to='perfil/',
        blank=True,
        null=True
    )

    def __str__(self):
        return self.user.username


@receiver(post_save, sender=User)
def criar_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


@receiver(post_save, sender=User)
def salvar_profile(sender, instance, **kwargs):
    instance.profile.save()
    
    
    
class Card(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    titulo = models.CharField(
        max_length=200
    )

    coluna = models.CharField(
        max_length=100
    )

    ordem = models.IntegerField(
        default=0
    )

    criado_em = models.DateTimeField(
        auto_now_add=True
    )
    data_vencimento = models.DateField(
        null=True,
        blank=True
    )
    
    def status(self):
        if not self.data_vencimento:
            return "sem"
        
        hoje = date.today()
        diff = (self.data_vencimento - hoje).days
        
        if diff < 0:
            return "vermelho"
        elif diff <= 2:
            return "amarelo"
        return "verde"
            

    def __str__(self):
        return self.titulo