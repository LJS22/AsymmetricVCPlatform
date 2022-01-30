from fastapi import FastAPI, WebSocket
from connection_manager import ConnectionManager

app = FastAPI()
manager = ConnectionManager()


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: int):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.emit(f"Client #{client_id} says: {data}")
    except Exception as e:
        manager.disconnect(websocket)
        await manager.emit(f"Client #{client_id} left the chat")


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5049)
