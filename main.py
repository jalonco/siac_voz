import json
import uvicorn
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import Response
from twilio.twiml.voice_response import VoiceResponse, Connect, Stream
from twilio.rest import Client
from loguru import logger
from dotenv import load_dotenv
from pydantic import BaseModel

from bot import run_bot, settings

load_dotenv()

app = FastAPI()

# Initialize Twilio Client
twilio_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

class CallRequest(BaseModel):
    to_number: str

@app.post("/call")
async def make_call(call_request: CallRequest):
    """
    Trigger an outbound call.
    """
    if not settings.DOMAIN or settings.DOMAIN == "localhost":
        raise HTTPException(status_code=500, detail="DOMAIN env var must be set to a public URL (e.g. ngrok) for outbound calls.")

    try:
        # The URL that Twilio will fetch when the call is answered.
        # It must scream back the TwiML to connect to the Media Stream.
        twiml_url = f"https://{settings.DOMAIN}/voice"
        
        call = twilio_client.calls.create(
            to=call_request.to_number,
            from_=settings.TWILIO_PHONE_NUMBER,
            url=twiml_url
        )
        logger.info(f"Outbound call initiated: {call.sid}")
        return {"message": "Call initiated", "call_sid": call.sid}
    except Exception as e:
        logger.error(f"Failed to make call: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/voice")
async def voice_handler(request: Request):
    """
    Endpoint called by Twilio when a call comes in.
    Returns TwiML to connect the call to the Media Stream.
    """
    response = VoiceResponse()
    
    # Dynamically determine the WebSocket URL based on the incoming request
    ws_scheme = "wss" if request.url.scheme == "https" else "ws"
    host = request.url.netloc
    stream_url = f"{ws_scheme}://{host}/media-stream"
    
    logger.info(f"Generating TwiML with Stream URL: {stream_url}")
    
    connect = Connect()
    stream = Stream(url=stream_url)
    connect.append(stream)
    response.append(connect)
    
    return Response(content=str(response), media_type="application/xml")

@app.websocket("/media-stream")
async def media_stream(websocket: WebSocket):
    """
    WebSocket endpoint for Twilio Media Stream.
    """
    await websocket.accept()
    logger.info("Twilio Media Stream connected")
    
    try:
        # Twilio sends a 'start' event with stream metadata as the first message
        message = await websocket.receive_text()
        event = json.loads(message)
        
        if event.get("event") == "start":
            stream_sid = event["start"]["streamSid"]
            logger.info(f"Stream started: {stream_sid}")
            
            # Start the Pipecat bot pipeline
            # We pass the websocket and the session ID
            await run_bot(websocket, stream_sid)
            
        elif event.get("event") == "stop":
            logger.info("Stream stopped by Twilio (initial handshake)")
        else:
            logger.warning(f"Received unexpected event type: {event.get('event')}")

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected by client")
    except Exception as e:
        logger.error(f"Error in media stream: {e}")
    finally:
        logger.info("Media stream connection closed")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)
