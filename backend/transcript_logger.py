import os
import json
import datetime
import asyncio
from loguru import logger
from google.cloud import storage

from pipecat.processors.frame_processor import FrameProcessor
from pipecat.frames.frames import (
    Frame, 
    TranscriptionFrame, 
    TextFrame, 
    EndFrame, 
    LLMFullResponseStartFrame, 
    LLMFullResponseEndFrame, # <--- Restored
    InterimTranscriptionFrame, # Added
    UserStartedSpeakingFrame,
    UserStoppedSpeakingFrame
)
import re # For thought filtering

# Constants
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KEY_FILE = os.path.join(BASE_DIR, "mundimotos-481115-c652dd31ca7c.json")
BUCKET_NAME = "asistente-siac-voz-logs"

class TranscriptLogger(FrameProcessor):
    def __init__(self, call_sid: str):
        super().__init__()
        self.call_sid = call_sid
        self.history = []
        self.ai_buffer = "" # Buffer for aggregating AI tokens
        logger.info(f"TranscriptLogger started for {call_sid}")

    async def process_frame(self, frame: Frame, direction: int):
        await super().process_frame(frame, direction)
        
        # DEBUG: Log every frame type to understand flow
        logger.info(f"Frame received: {type(frame).__name__}") 

        timestamp = datetime.datetime.now().isoformat()
        
        # 1. User Transcription
        if isinstance(frame, (TranscriptionFrame, InterimTranscriptionFrame)):
            logger.info(f"CAPTURED TRANSCRIPTION ({type(frame).__name__}): {frame.text}") # Debug log
            
            # Only log final transcriptions to history to avoid noise, or log all for now to debug
            if isinstance(frame, TranscriptionFrame):
                entry = {
                    "timestamp": timestamp,
                    "role": "user" if getattr(frame, "user_id", "user") != "assistant" else "assistant",
                    "content": frame.text,
                    "type": "transcription"
                }
                self.history.append(entry)

        # 2. AI Text Aggregation
        elif isinstance(frame, TextFrame):
            self.ai_buffer += frame.text

        elif isinstance(frame, LLMFullResponseEndFrame):
            # Flush buffer on end of response
            if self.ai_buffer.strip():
                self._flush_ai_buffer(timestamp)

        # 3. Handle End of Call
        elif isinstance(frame, EndFrame):
            # Ensure any remaining buffer is flushed
            if self.ai_buffer.strip():
                self._flush_ai_buffer(timestamp)
            await self.upload_history()
            
        # Push frame downstream
        await self.push_frame(frame, direction)

    def _flush_ai_buffer(self, timestamp: str):
        """Processes and logs the buffered AI text."""
        full_text = self.ai_buffer.strip()
        if not full_text:
            return

        # Attempt to separate "Thought" from "Speech"
        # Removing thought blocks that look like **Header**\n\nContent...
        # Or simple **Thoughts** style.
        # Regex to remove blocks starting with ** and ending with newline or ** (if it's a inline thought?)
        # Based on user input: "**Initiating The Interaction**\n\nI've established... ....\n\n\n"
        # Since the model output seems to put thoughts *before* speech, we can try to split.
        
        # Strategy: Remove lines starting with ** if they seem to be headers, and following lines until we hit "Normal text"?
        # Actually, simpler: Remove content matching `\*\*.*?\*\*(\n\n)?` or similar.
        # The user JSON showed: `**Initiating The Interaction**\n\nI've established...`
        # It seems the entire buffer MIGHT be a thought if it's just thought? 
        # Or does the TextFrame stream contain BOTH thought and speech?
        # The JSON showed separate entries for thoughts in the *old* logic? No, the user provided JSON showed:
        # { "content": "**Initiating...**\n\n..." } -> ONE entry.
        # Then { "content": "Hola..." } -> ANOTHER entry.
        # This implies the Model emitted a Thought block, then maybe a pause/break (EndFrame?), then speech?
        # If they are separate LLM responses, we need to detect if the *entire* buffer is a thought.
        
        # Rule: If text starts with ** and has no "speech" indicators (difficult), mark as thought.
        # But wait, looking at the user's json again:
        # Entry 1: **Initiating...**\n\nI've established... (Type: text)
        # Entry 2: Hola, buenas (Type: text)
        
        # If Gemini sends Thoughts as a separate Turn, we can filter it out by checking if it starts with **.
        
        is_thought = False
        if full_text.startswith("**") and ("**" in full_text[2:] or "\n" in full_text):
             # Likely a thought block.
             # We can log it as 'thought' type or skip it.
             # User wants to clean it. Let's skip it OR log as type="thought" so frontend can hide it.
             is_thought = True
        
        if is_thought:
            logger.info("Detected thought block. Marking as internal.")
            type_field = "thought" # Custom type
        else:
            type_field = "text"

        entry = {
            "timestamp": timestamp,
            "role": "assistant",
            "content": full_text,
            "type": type_field 
        }
        self.history.append(entry)
        logger.info(f"AI Response Logged (Length: {len(full_text)}, Type: {type_field})")
        
        self.ai_buffer = "" # Reset buffer
    
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
                
                # Use asyncio.to_thread to unblock event loop
                await asyncio.to_thread(
                    self._upload_string, 
                    json_content, 
                    blob_name
                )
                
                logger.info("Transcript upload complete.")
            else:
                logger.error(f"GCS Key file not found: {KEY_FILE}. Transcript not uploaded.")
                
        except Exception as e:
            logger.error(f"Failed to upload transcript: {e}")

    def _upload_string(self, content: str, blob_name: str):
        storage_client = storage.Client.from_service_account_json(KEY_FILE)
        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(blob_name)
        blob.upload_from_string(content, content_type='application/json')
