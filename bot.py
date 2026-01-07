import os
import sys
from typing import Optional

from fastapi import WebSocket
from loguru import logger
from pydantic_settings import BaseSettings, SettingsConfigDict

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.pipeline.pipeline import Pipeline, PipelineParams
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineTask
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

    # Context not strictly needed for Multimodal Live if basic, but good practice if extending
    messages = [
        {"role": "user", "parts": [{"text": "You are a helpful AI voice assistant. Answer strictly in Spanish."}]},
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
