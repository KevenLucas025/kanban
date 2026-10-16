import base64
import json
import os
from pathlib import Path
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


class GmailAPIEmailBackend(BaseEmailBackend):

    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        enviados = 0

        try:
            token_json = os.getenv("GOOGLE_TOKEN_JSON")
            caminho_token = Path(settings.BASE_DIR) / "token.json"

            if token_json:
                credenciais = Credentials.from_authorized_user_info(
                    json.loads(token_json),
                    ["https://www.googleapis.com/auth/gmail.send"],
                )
            elif caminho_token.is_file():
                credenciais = Credentials.from_authorized_user_file(
                    str(caminho_token),
                    ["https://www.googleapis.com/auth/gmail.send"],
                )
            else:
                raise RuntimeError(
                    "Credenciais da Gmail API não encontradas."
                )

            if not credenciais.valid:
                if credenciais.expired and credenciais.refresh_token:
                    credenciais.refresh(Request())
                else:
                    raise RuntimeError(
                        "Não foi possível renovar a autorização do Gmail."
                    )

            servico = build(
                "gmail",
                "v1",
                credentials=credenciais,
                cache_discovery=False,
            )

            for email_msg in email_messages:
                mensagem_bytes = email_msg.message().as_bytes()

                mensagem_codificada = base64.urlsafe_b64encode(
                    mensagem_bytes
                ).decode("utf-8")

                servico.users().messages().send(
                    userId="me",
                    body={"raw": mensagem_codificada},
                ).execute()

                enviados += 1

        except Exception:
            if not self.fail_silently:
                raise

        return enviados
