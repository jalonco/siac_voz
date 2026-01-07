
import asyncio
from unittest.mock import MagicMock
from pipecat.transports.network.fastapi_websocket import FastAPIWebsocketTransport
# If that fails, try the new path
# from pipecat.transports.websocket.fastapi import FastAPIWebsocketTransport

class RecordingWebSocket:
    def __init__(self, websocket):
        self._ws = websocket
    
    def __getattr__(self, name):
        return getattr(self._ws, name)

async def main():
    mock_ws = MagicMock()
    mock_ws.client = "127.0.0.1"
    mock_ws.headers = {}
    
    wrapped = RecordingWebSocket(mock_ws)
    
    print("Attempting to init transport...")
    try:
        transport = FastAPIWebsocketTransport(websocket=wrapped, params=MagicMock())
        print("Transport init success!")
    except Exception as e:
        print(f"Transport init FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(main())
