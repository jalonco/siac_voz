# Agente de Voz AI con Twilio, Pipecat y Gemini

Este proyecto implementa un backend en Python para un agente de voz telefónico capaz de realizar y recibir llamadas. Utiliza **Twilio** para la telefonía, **Pipecat** para la orquestación del flujo de audio, y **Google Gemini Multimodal Live API** para la inteligencia artificial nativa de voz a voz.

## Tecnologías

*   **Python 3.10+**
*   **FastAPI**: Servidor web y WebSockets.
*   **Twilio**: Manejo de llamadas y streams de audio.
*   **Pipecat AI**: Framework para agentes de voz en tiempo real.
*   **Google Gemini 2.0 Flash**: Modelo multimodal para procesamiento de audio nativo.
*   **Silero VAD**: Detección de actividad de voz para interrupciones naturales.

## Estructura del Proyecto

*   `main.py`: Punto de entrada del servidor. Maneja los webhooks de Twilio y la conexión WebSocket.
*   `bot.py`: Lógica del pipeline de voz. Configura la conexión entre Twilio y Gemini.
*   `.env`: Variables de entorno (credenciales).

## Configuración

1.  **Instalar dependencias**:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Variables de Entorno**:
    Crea un archivo `.env` basado en el ejemplo y configura:
    *   `TWILIO_ACCOUNT_SID` & `TWILIO_AUTH_TOKEN`: De tu consola de Twilio.
    *   `TWILIO_PHONE_NUMBER`: Tu número de Twilio (ej: `+57...`).
    *   `GOOGLE_API_KEY`: API Key de Google AI Studio.
    *   `DOMAIN`: Tu dominio público (sin `https://`), necesario para llamadas salientes.

## Ejecución

1.  Inicia el servidor:
    ```bash
    python main.py
    ```

2.  Expón tu servidor local (si estás desarrollando):
    ```bash
    ngrok http 8765
    ```

## Uso

*   **Llamadas Entrantes**: Configura el webhook de voz en Twilio pointing a `https://<tu-dominio>/voice`.
*   **Llamadas Salientes**:
    Envía un POST a `/call`:
    ```bash
    curl -X POST http://localhost:8765/call \
      -H "Content-Type: application/json" \
      -d '{"to_number": "+573001234567"}'
    ```
