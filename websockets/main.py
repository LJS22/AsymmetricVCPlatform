from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from connection_manager import ConnectionManager


app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="static")


manager = ConnectionManager()


@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: int):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.send_json()
            await manager.emit(f"Client #{client_id}: {data}")
    except Exception as e:
        manager.disconnect(websocket)
        await manager.emit(f"Client #{client_id} left the chat")


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5049)
