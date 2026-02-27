"""Stream management routes"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/api/streams")
async def list_streams():
    """List active streams"""
    return {"active_streams": [], "count": 0}


@router.get("/api/streams/{stream_id}")
async def get_stream(stream_id: str):
    """Get stream status"""
    return {
        "id": stream_id,
        "status": "inactive",
        "message": "Stream not found",
    }
