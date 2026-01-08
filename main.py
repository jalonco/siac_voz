import json
import uvicorn
from fastapi import FastAPI, WebSocket, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse, StreamingResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from twilio.twiml.voice_response import VoiceResponse, Connect, Stream
from twilio.rest import Client
from loguru import logger
from dotenv import load_dotenv
from pydantic import BaseModel

from bot import run_bot, settings
from settings_manager import SettingsManager

load_dotenv()

app = FastAPI()

# In-memory store for call variables: {call_sid: variables_dict}
call_context_store = {}

# Data Models
# Data Models
class VariableDefinition(BaseModel):
    key: str
    description: str
    example: str

class AgentConfig(BaseModel):
    id: str = "default"
    name: str = "Nuevo Agente"
    system_prompt: str
    voice_id: str
    language: str = "es-US"
    variables: list[VariableDefinition] = []

class CallRequest(BaseModel):
    to_number: str
    agent_id: str = "default"
    variables: dict[str, str] = {}

# Allow CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/agents")
async def get_agents():
    """List all agents."""
    settings = SettingsManager.load_settings()
    agents = settings.get("agents", {})
    # Return as list for frontend convenience
    return {
        "agents": list(agents.values()),
        "available_voices": SettingsManager.get_available_voices(),
        "available_languages": SettingsManager.get_available_languages()
    }

@app.get("/agents/{agent_id}")
async def get_agent(agent_id: str):
    """Get specific agent details."""
    agent = SettingsManager.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@app.post("/agents")
async def create_agent(config: AgentConfig):
    """Create a new agent."""
    import uuid
    # If no ID provided or default, generate one (unless it's explicitly default which is reserved)
    agent_id = config.id
    if not agent_id or agent_id == "new":
        agent_id = str(uuid.uuid4())
    
    agent_data = config.dict()
    agent_data["id"] = agent_id
    
    created_agent = SettingsManager.create_agent(agent_id, agent_data)
    return {"status": "created", "agent": created_agent}

@app.put("/agents/{agent_id}")
async def update_agent(agent_id: str, config: AgentConfig):
    """Update an existing agent."""
    # Validate voices
    valid_voices = [v["id"] for v in SettingsManager.get_available_voices()]
    if config.voice_id not in valid_voices:
        logger.warning(f"Invalid voice_id {config.voice_id}, proceeding anyway.")
    
    updated_agent = SettingsManager.update_agent(agent_id, config.dict())
    if not updated_agent:
         raise HTTPException(status_code=404, detail="Agent not found")
         
    return {"status": "updated", "agent": updated_agent}

@app.delete("/agents/{agent_id}")
async def delete_agent(agent_id: str):
    """Delete an agent."""
    if agent_id == "default":
        raise HTTPException(status_code=400, detail="Cannot delete default agent")
        
    success = SettingsManager.delete_agent(agent_id)
    if not success:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"status": "deleted"}


# Initialize Twilio Client
twilio_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)



@app.post("/call")
async def make_call(call_request: CallRequest):
    """
    Trigger an outbound call.
    """
    if not settings.DOMAIN or settings.DOMAIN == "localhost":
        raise HTTPException(status_code=500, detail="DOMAIN env var must be set to a public URL (e.g. ngrok) for outbound calls.")

    try:
        # Check if agent exists
        agent = SettingsManager.get_agent(call_request.agent_id)
        if not agent:
             raise HTTPException(status_code=404, detail=f"Agent configured '{call_request.agent_id}' not found.")

        # The URL that Twilio will fetch when the call is answered.
        # It must scream back the TwiML to connect to the Media Stream.
        twiml_url = f"https://{settings.DOMAIN}/voice"
        
        call = twilio_client.calls.create(
            to=call_request.to_number,
            from_=settings.TWILIO_PHONE_NUMBER,
            url=twiml_url
        )
        logger.info(f"Outbound call initiated: {call.sid} using Agent: {call_request.agent_id}")
        
        # Store context (variables + AGENT ID) for this call
        context_data = {
            "variables": call_request.variables,
            "agent_id": call_request.agent_id
        }
        call_context_store[call.sid] = context_data
        logger.info(f"Stored context for {call.sid}: {context_data}")
            
        return {"message": "Call initiated", "call_sid": call.sid}
    except Exception as e:
        logger.error(f"Failed to make call: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/voices")
async def get_voices():
    return SettingsManager.get_available_voices()

@app.get("/languages")
async def get_languages():
    return SettingsManager.get_available_languages()
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
                "from": c._from,
                "to": c.to,
                "price": str(c.price) if c.price else None,
                "price_unit": c.price_unit,
            })
        return {"calls": call_data}
    except Exception as e:
        logger.error(f"Failed to fetch calls: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/voices/preview/{voice_id}")
async def get_voice_preview(voice_id: str):
    """
    Proxy voice preview audio from GCS.
    """
    try:
        from google.cloud import storage
        from recorder import KEY_FILE, BUCKET_NAME
        
        # Initialize GCS client
        storage_client = storage.Client.from_service_account_json(KEY_FILE)
        bucket = storage_client.bucket(BUCKET_NAME)
        
        # Construct blob path (case-insensitive handling by lowercasing)
        blob_name = f"previews/{voice_id.lower()}.m4a"
        blob = bucket.blob(blob_name)
        
        if not blob.exists():
            raise HTTPException(status_code=404, detail="Audio preview not found")
            
        # Create a generator to stream the file
        def iterfile():
            with blob.open("rb") as f:
                yield from f
                
        return StreamingResponse(iterfile(), media_type="audio/mp4")
        
    except Exception as e:
        logger.error(f"Failed to stream preview: {e}")
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

from recorder import CallRecorder, RecordingWebSocket

# ... (existing code) ...

@app.websocket("/media-stream")
async def media_stream(websocket: WebSocket):
    """
    WebSocket endpoint for Twilio Media Stream.
    """
    await websocket.accept()
    logger.info("Twilio Media Stream connected")
    
    recorder = None
    
    try:
        # Loop until we get the 'start' event
        while True:
            message = await websocket.receive_text()
            event = json.loads(message)
            
            if event.get("event") == "start":
                stream_sid = event["start"]["streamSid"]
                call_sid = event["start"]["callSid"]
                logger.info(f"Stream started: {stream_sid} for Call: {call_sid}")
                
                # Initialize Recorder
                recorder = CallRecorder(call_sid)
                
                # Retrieve Call Context (Variables + Agent ID)
                context_data = call_context_store.get(call_sid, {})
                call_variables = context_data.get("variables", {})
                agent_id = context_data.get("agent_id", "default")
                
                # Cleanup context to free memory? Or keep for debug?
                # call_context_store.pop(call_sid, None) 
                
                # Wrap WebSocket to intercept audio for recording
                wrapped_ws = RecordingWebSocket(websocket, recorder)
                
                # Start the Pipecat bot pipeline with wrapped socket and variables
                await run_bot(wrapped_ws, stream_sid, call_sid, call_variables, agent_id)
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
import os
from fastapi.responses import FileResponse

# Explicitly serve index.html for root to prevent caching old versions
@app.get("/")
async def serve_root():
    # Check possible locations (local vs docker)
    if os.path.exists("frontend/dist/index.html"):
        path = "frontend/dist/index.html"
    elif os.path.exists("static/index.html"):
        path = "static/index.html"
    else:
        return {"error": "Frontend not found"}
        
    response = FileResponse(path)
    # Force browser to revalidate so it picks up new index-HASH.js
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    return response

# Check if frontend/dist exists (Vite build output)
if os.path.exists("frontend/dist"):
    app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="frontend")
elif os.path.exists("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)
