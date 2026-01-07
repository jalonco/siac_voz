import json
import uvicorn
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import Response, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from twilio.twiml.voice_response import VoiceResponse, Connect, Stream
from twilio.rest import Client
from loguru import logger
from dotenv import load_dotenv
from pydantic import BaseModel

from bot import run_bot, settings

load_dotenv()

app = FastAPI()

# Allow CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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



@app.get("/calls")
async def get_calls(limit: int = 20):
    """
    Fetch recent calls from Twilio log.
    """
    try:
        calls = twilio_client.calls.list(limit=limit)
        call_data = []
        for c in calls:
            call_data.append({
                "sid": c.sid,
                "status": c.status,
                "duration": c.duration,
                "start_time": str(c.start_time) if c.start_time else None,
                "direction": c.direction,
                "from": c.from_,
                "to": c.to,
                "price": str(c.price) if c.price else None,
                "price_unit": c.price_unit,
            })
        return {"calls": call_data}
    except Exception as e:
        logger.error(f"Failed to fetch calls: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/voice")
async def voice_handler(request: Request):

    """
    Endpoint called by Twilio when a call comes in.
    Returns TwiML to connect the call to the Media Stream.
    """
    response = VoiceResponse()
    
    # Trust X-Forwarded-Proto header from Traefik
    forwarded_proto = request.headers.get("x-forwarded-proto")
    if forwarded_proto:
        ws_scheme = "wss" if forwarded_proto == "https" else "ws"
    else:
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
        # Loop until we get the 'start' event
        while True:
            message = await websocket.receive_text()
            event = json.loads(message)
            
            if event.get("event") == "start":
                stream_sid = event["start"]["streamSid"]
                call_sid = event["start"]["callSid"]
                logger.info(f"Stream started: {stream_sid} for Call: {call_sid}")
                
                # Start the Pipecat bot pipeline
                # This function will take over the websocket and run until the call ends
                await run_bot(websocket, stream_sid, call_sid)
                break
                
            elif event.get("event") == "stop":
                logger.info("Stream stopped by Twilio")
                break
                
            elif event.get("event") == "connected":
                logger.info("Twilio Media Stream connected event received")
                continue
                
            else:
                logger.warning(f"Received unexpected event type: {event.get('event')}")

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected by client")
    except Exception as e:
        logger.error(f"Error in media stream: {e}")
    finally:
        logger.info("Media stream connection closed")

# Mount static files (Frontend)
# We mount it at the end to avoid shadowing API routes
# Mount static files (Frontend)
# We mount it at the end to avoid shadowing API routes
import os

# Check if frontend/dist exists (Vite build output)
if os.path.exists("frontend/dist"):
    app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="frontend")
elif os.path.exists("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)
