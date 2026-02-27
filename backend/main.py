"""Samvad AI Backend — FastAPI + Socket.IO"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import socketio

from routes.health_routes import router as health_router
from routes.text_routes import router as text_router
from routes.video_routes import router as video_router
from routes.stream_routes import router as stream_router
from socket_handlers import register_handlers

# ─── Create dirs ───
for dir_name in ["uploads", "outputs", "outputs/audio", "assets/isl_clips"]:
    os.makedirs(dir_name, exist_ok=True)

# ─── FastAPI app ───
app = FastAPI(
    title="Samvad AI",
    description="Real-time Indian Sign Language accessibility platform",
    version="0.1.0",
)

# ─── CORS ───
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routes ───
app.include_router(health_router)
app.include_router(text_router)
app.include_router(video_router)
app.include_router(stream_router)

# ─── Static files (serve generated content) ───
if os.path.exists("outputs"):
    app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")
if os.path.exists("assets"):
    app.mount("/assets", StaticFiles(directory="assets"), name="assets")

# ─── Socket.IO ───
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False,
)

register_handlers(sio)

# Mount Socket.IO on FastAPI
socket_app = socketio.ASGIApp(sio, app)

# ─── Root redirect ───
@app.get("/")
async def root():
    return {"message": "Samvad AI Backend", "docs": "/docs", "health": "/api/health"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:socket_app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
