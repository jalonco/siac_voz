import os
import wave
import audioop
import base64
import tempfile
import datetime
from google.cloud import storage
from loguru import logger

# Constants
KEY_FILE = "mundimotos-481115-c652dd31ca7c.json"
BUCKET_NAME = "asistente-siac-voz-logs"

class CallRecorder:
    def __init__(self, call_sid: str):
        self.call_sid = call_sid
        self.temp_file = None
        self.wav_file = None
        self.closed = False
        
        try:
            self.temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
            self.wav_file = wave.open(self.temp_file.name, 'wb')
            
            # Twilio Audio is 8000Hz, Mono, 8-bit Mulaw -> 16-bit PCM
            self.wav_file.setnchannels(1)
            self.wav_file.setsampwidth(2) # 16-bit = 2 bytes
            self.wav_file.setframerate(8000)
            
            logger.info(f"Recorder started for {call_sid} at {self.temp_file.name}")
        except Exception as e:
            logger.error(f"Failed to initialize recorder: {e}")
            self.closed = True # Disable recording if init fails

    def write_chunk(self, payload: str):
        """
        Processes an inbound audio chunk (Base64 Mulaw).
        Decodes Base64 -> Decodes Mulaw to PCM -> Writes to WAV.
        """
        if self.closed: return

        try:
             # Decode Base64 to Raw Mulaw Bytes
            mulaw_data = base64.b64decode(payload)
            
            # Convert Mulaw to 16-bit PCM
            # width=2 means target is 2 bytes (16-bit)
            pcm_data = audioop.ulaw2lin(mulaw_data, 2)
            
            self.wav_file.writeframes(pcm_data)
        except Exception as e:
            logger.error(f"Error writing chunk: {e}")

    def stop_and_upload(self):
        """
        Closes the WAV file and uploads to GCS.
        """
        if self.closed: return
        
        try:
            self.wav_file.close()
            self.temp_file.close()
            self.closed = True
            
            # Construct GCS Path: grabaciones/YYYY-MM-DD/{call_sid}.wav
            date_str = datetime.date.today().isoformat()
            blob_name = f"grabaciones/{date_str}/{self.call_sid}.wav"
            
            # Initialise Client with specific JSON key
            if os.path.exists(KEY_FILE):
                storage_client = storage.Client.from_service_account_json(KEY_FILE)
                bucket = storage_client.bucket(BUCKET_NAME)
                blob = bucket.blob(blob_name)
                
                logger.info(f"Uploading recording to gs://{BUCKET_NAME}/{blob_name}...")
                blob.upload_from_filename(self.temp_file.name, content_type='audio/wav')
                logger.info("Upload complete.")
            else:
                logger.error(f"GCS Key file not found: {KEY_FILE}. Recording not uploaded.")

        except Exception as e:
            logger.error(f"Failed to upload recording: {e}")
        finally:
            # Cleanup temp file
            if os.path.exists(self.temp_file.name):
                os.remove(self.temp_file.name)

from fastapi import WebSocket
import json

class RecordingWebSocket:
    """
    Wraps a FastAPI WebSocket to intercept Twilio media messages for recording
    while passing them through to the Pipecat transport.
    """
    def __init__(self, websocket: WebSocket, recorder: CallRecorder):
        self._ws = websocket
        self._recorder = recorder

    async def accept(self, *args, **kwargs):
        return await self._ws.accept(*args, **kwargs)

    async def close(self, *args, **kwargs):
        self._recorder.stop_and_upload()
        return await self._ws.close(*args, **kwargs)

    async def receive_text(self) -> str:
        # Intercept incoming text (Twilio events)
        data = await self._ws.receive_text()
        
        try:
            # We process async to not block, but for simplicity/zero-cost-ram we handle synchronously here
            # JSON parse is fast enough.
            event = json.loads(data)
            event_type = event.get("event")

            if event_type == "media":
                payload = event["media"]["payload"]
                self._recorder.write_chunk(payload)
            elif event_type == "stop":
                self._recorder.stop_and_upload()
            
        except Exception as e:
            # Don't let recording errors kill the call
            logger.error(f"Recording tap error: {e}")

        return data

    async def iter_text(self):
        # Implement iter_text to ensure receive_text is called (and thus intercepted)
        try:
            while True:
                yield await self.receive_text()
        except Exception as e:
            # WebSocketDisconnect is expected at end of call
            pass

    async def send_text(self, data: str):
        # Intercept outgoing text (AI/Server events) to capture AI audio
        try:
             # Fast JSON check - outgoing messages are often media
            if 'media' in data: # Optimization to avoid parsing non-media messages fully if possible, but safer to parse
                event = json.loads(data)
                if event.get("event") == "media":
                    payload = event["media"]["payload"]
                    self._recorder.write_chunk(payload)
        except Exception as e:
            logger.error(f"Recording outgoing tap error: {e}")

        return await self._ws.send_text(data)

    async def receive_bytes(self) -> bytes:
        return await self._ws.receive_bytes()

    async def send_bytes(self, data: bytes):
        return await self._ws.send_bytes(data)

    async def iter_bytes(self):
        async for data in self._ws.iter_bytes():
            yield data

    # Proxy other methods if needed, but Pipecat mostly uses receive_text/send_text for Twilio
    def __getattr__(self, name):
        return getattr(self._ws, name)
