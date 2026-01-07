import os
import json
import datetime
from loguru import logger
from google.cloud import storage

from pipecat.processors.frame_processor import FrameProcessor
from pipecat.frames.frames import Frame, TranscriptionFrame, TextFrame, EndFrame

# Constants
KEY_FILE = "mundimotos-481115-c652dd31ca7c.json"
BUCKET_NAME = "asistente-siac-voz-logs"

class TranscriptLogger(FrameProcessor):
    def __init__(self, call_sid: str):
        super().__init__()
        self.call_sid = call_sid
        self.history = []
        logger.info(f"TranscriptLogger started for {call_sid}")

    async def process_frame(self, frame: Frame, direction: int):
        await super().process_frame(frame, direction)
        
        timestamp = datetime.datetime.now().isoformat()
        
        # Capture Transcriptions (User Speech, and Model Speech if transcribed)
        if isinstance(frame, TranscriptionFrame):
            entry = {
                "timestamp": timestamp,
                "role": "user" if getattr(frame, "user_id", "user") != "assistant" else "assistant", # Heuristic, check frame attrs
                "content": frame.text,
                "type": "transcription"
            }
            # Refine role logic: usually TranscriptionFrame is user. 
            self.history.append(entry)
            logger.info(f"Transcript logged: {frame.text}")

        # Capture Text Generation (AI Response text, if available)
        elif isinstance(frame, TextFrame):
            entry = {
                "timestamp": timestamp,
                "role": "assistant",
                "content": frame.text,
                "type": "text"
            }
            self.history.append(entry)
            logger.info(f"AI Text logged: {frame.text}")
            
        if isinstance(frame, EndFrame):
            await self.upload_history()
            
        # Push frame downstream
        await self.push_frame(frame, direction)

    async def upload_history(self):
        logger.info(f"Attempting to upload history. Count: {len(self.history)}")
        if not self.history:
            logger.info("No transcript history to upload. (Empty list)")
            return

        try:
            # Construct JSON content
            json_content = json.dumps(self.history, indent=2, ensure_ascii=False)
            
            # Construct GCS Path: transcripciones/{call_sid}.json
            # (User asked for /transcripciones/)
            blob_name = f"transcripciones/{self.call_sid}.json"
            
            if os.path.exists(KEY_FILE):
                # Run sync GCS upload in executor to avoid blocking loop? 
                # For "EndFrame", we are shutting down, so blocking is less critical but good practice.
                # Here we just do it sync for simplicity as `upload_from_string` is fast-ish.
                # Or use asyncio.to_thread
                
                logger.info(f"Uploading transcript to gs://{BUCKET_NAME}/{blob_name}...")
                
                # We reuse the logic from recorder, but simpler here
                storage_client = storage.Client.from_service_account_json(KEY_FILE)
                bucket = storage_client.bucket(BUCKET_NAME)
                blob = bucket.blob(blob_name)
                blob.upload_from_string(json_content, content_type='application/json')
                
                logger.info("Transcript upload complete.")
            else:
                logger.error(f"GCS Key file not found: {KEY_FILE}. Transcript not uploaded.")
                
        except Exception as e:
            logger.error(f"Failed to upload transcript: {e}")
