
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

fluxo = InstalledAppFlow.from_client_secrets_file(
    "credentials.json",
    SCOPES,
)

credenciais = fluxo.run_local_server(port=0)

with open("token.json", "w", encoding="utf-8") as arquivo:
    arquivo.write(credenciais.to_json())

servico = build(
    "gmail",
    "v1",
    credentials=credenciais,
    cache_discovery=False,
)

perfil = servico.users().getProfile(userId="me").execute()

print("Autorização concluída!")
print("Conta autorizada:", perfil["emailAddress"])
print("Arquivo token.json criado.")
