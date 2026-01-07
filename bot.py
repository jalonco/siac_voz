import os
import sys
from typing import Optional

from fastapi import WebSocket
from loguru import logger
from pydantic_settings import BaseSettings, SettingsConfigDict

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineTask, PipelineParams
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.serializers.twilio import TwilioFrameSerializer
from pipecat.services.gemini_multimodal_live.gemini import GeminiMultimodalLiveLLMService
from pipecat.transports.network.fastapi_websocket import (
    FastAPIWebsocketParams,
    FastAPIWebsocketTransport,
)

logger.remove()
logger.add(sys.stderr, level="INFO")

class Settings(BaseSettings):
    TWILIO_ACCOUNT_SID: str
    TWILIO_AUTH_TOKEN: str
    TWILIO_PHONE_NUMBER: str
    GOOGLE_API_KEY: str
    DOMAIN: str = "localhost" # Public domain (ngrok/production)
    PORT: int = 8765

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()

async def run_bot(websocket: WebSocket, stream_sid: str, call_sid: str):
    transport = FastAPIWebsocketTransport(
        websocket=websocket,
        params=FastAPIWebsocketParams(
            audio_out_enabled=True,
            add_wav_header=False,
            vad_enabled=True,
            vad_analyzer=SileroVADAnalyzer(),
            vad_audio_passthrough=True,
            serializer=TwilioFrameSerializer(
                stream_sid=stream_sid,
                call_sid=call_sid,
                account_sid=settings.TWILIO_ACCOUNT_SID,
                auth_token=settings.TWILIO_AUTH_TOKEN
            ),
        ),
    )

    llm = GeminiMultimodalLiveLLMService(
        api_key=settings.GOOGLE_API_KEY,
        model_name="gemini-2.0-flash-exp",
        transcribe_user_audio=True,
        transcribe_model_audio=True,
    )

    # Collections Agent Persona
    messages = [
        {
            "role": "user",
            "parts": [
                {
                    "text": """
                    Eres un agente de cobranzas profesional y amable que llama de parte de SIAC.
                    Tu objetivo es contactar al cliente, verificar su identidad y llegar a un acuerdo de pago para su deuda pendiente.

                    DIRECTRICES:
                    1.  **Idioma**: Habla estrictamente en Español.
                    2.  **Tono**: Profesional, respetuoso, firme pero empático. Nunca seas agresivo.
                    3.  **Flujo**:
                        *   Saluda y preséntate como agente de SIAC.
                        *   Pregunta si estás hablando con el titular de la deuda (puedes asumir que contestó la persona correcta si no dicen lo contrario, pero es mejor verificar).
                        *   Explica brevemente el motivo de la llamada (gestión de cobro).
                        *   Pregunta por la situación que ha impedido el pago. Escucha con empatía.
                        *   Propón llegar a un acuerdo de pago: ¿Cuándo puede pagar? ¿Cuánto puede abonar?
                        *   Si llegan a un acuerdo, repite los detalles (fecha y monto) para confirmar.
                        *   Despídete cordialmente.
                    4.  **Manejo de Objeciones**: Si el cliente dice que no tiene dinero ahora, pregunta cuándo cree que podría tenerlo o si puede hacer un pago parcial.
                    
                    IMPORTANTE: Mantén las respuestas concisas y naturales para una conversación fluida.
                    """
                }
            ],
        },
    ]

    # Pipeline
    # Twilio Audio -> Transport -> Gemini (Multimodal) -> Transport -> Twilio Audio
    
    # Note: Gemini Multimodal Live service acts as both STT, LLM and TTS in one go often, 
    # but in Pipecat it's a Service that consumes frames.
    # The pipeline structure for Gemini Multimodal:
    # transport.input() -> llm -> transport.output()
    
    pipeline = Pipeline(
        [
            transport.input(),
            llm,
            transport.output(),
        ]
    )

    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            allow_interruptions=True, # Handles VAD interruptions automatically with the transport's VAD
        ),
    )

    runner = PipelineRunner()

    await runner.run(task)
