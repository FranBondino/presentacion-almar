import os
import sys
import argparse
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Configuración por defecto
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

def test_gmail_access(credentials_json_path: str, impersonate_email: str):
    """
    Prueba la conexión a la casilla de correo corporativa de ALMAR usando la Cuenta de Servicio de Google Cloud
    y la Delegación en todo el dominio habilitada en Google Workspace Admin.
    """
    print("=" * 70)
    print("🚀 ALMAR - Prueba de Conexión Gmail API (Cuenta de Servicio)")
    print("=" * 70)
    print(f"📄 Archivo de credenciales: {credentials_json_path}")
    print(f"📧 Casilla a suplantar:   {impersonate_email}")
    print("-" * 70)

    if not os.path.exists(credentials_json_path):
        print(f"❌ ERROR: El archivo de credenciales no existe en '{credentials_json_path}'.")
        print("💡 Copiá el archivo JSON descargado en FASE 1 a esta ubicación o indicá el path correcto.")
        sys.exit(1)

    try:
        # 1. Cargar credenciales de la Cuenta de Servicio
        credentials = service_account.Credentials.from_service_account_file(
            credentials_json_path,
            scopes=SCOPES
        )

        # 2. Aplicar Delegación de Autoridad (Impersonate / Suplantación de la casilla objetivo)
        delegated_credentials = credentials.with_subject(impersonate_email)

        # 3. Construir el cliente de la API de Gmail
        service = build('gmail', 'v1', credentials=delegated_credentials)

        # 4. Probar listar mensajes de la bandeja de entrada
        print("🔍 Consultando la bandeja de entrada (mensajes recientes)...")
        results = service.users().messages().list(userId='me', maxResults=5).execute()
        messages = results.get('messages', [])

        print("✅ ¡CONEXIÓN EXITOSA!")
        print(f"📬 Se leyeron correctamente {len(messages)} mensajes recientes en la casilla '{impersonate_email}'.")

        if messages:
            print("\n📋 Listado de muestra de IDs de mensajes encontrados:")
            for idx, msg in enumerate(messages, start=1):
                msg_detail = service.users().messages().get(userId='me', id=msg['id'], format='metadata', metadataHeaders=['Subject', 'From', 'Date']).execute()
                headers = {h['name']: h['value'] for h in msg_detail.get('payload', {}).get('headers', [])}
                subject = headers.get('Subject', '(Sin asunto)')
                sender = headers.get('From', '(Desconocido)')
                date = headers.get('Date', '')
                print(f"  {idx}. [{msg['id']}] | De: {sender} | Asunto: {subject}")

        print("\n🎉 La FASE 1 y FASE 2 están 100% validadas y operativas.")

    except HttpError as error:
        print(f"❌ ERROR de HTTP Google API: {error}")
        if error.resp.status == 403:
            print("💡 Posible causa: La Delegación en todo el dominio en admin.google.com no se autorizó correctamente con el Scope 'https://www.googleapis.com/auth/gmail.readonly' o el Client ID no coincide.")
        elif error.resp.status == 404:
            print("💡 Posible causa: La casilla especificada no existe en la organización Google Workspace de ALMAR.")
    except Exception as e:
        print(f"❌ ERROR Inesperado: {e}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Prueba de lectura Gmail API para ALMAR Bot Facturas')
    parser.add_argument('--credentials', default='credentials.json', help='Ruta al archivo JSON de la cuenta de servicio')
    parser.add_argument('--email', required=True, help='Correo corporativo de ALMAR a suplantar (ej: facturas@almar.com.ar)')
    
    args = parser.parse_args()
    test_gmail_access(args.credentials, args.email)
