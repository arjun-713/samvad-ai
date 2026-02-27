"""Video upload processing route — Flow 3"""
import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException

from services.pipeline import PipelineService

router = APIRouter()

pipeline = PipelineService()
upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(upload_dir, exist_ok=True)


@router.post("/api/process-video")
async def process_video(video: UploadFile = File(...)):
    # Validate file type
    allowed_types = ["video/mp4", "video/avi", "video/quicktime", "video/x-matroska",
                     "application/octet-stream"]
    if video.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {video.content_type}")

    # Validate size (100MB max)
    contents = await video.read()
    if len(contents) > 100 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 100MB)")

    # Save uploaded file
    file_ext = os.path.splitext(video.filename or "video.mp4")[1] or ".mp4"
    filename = f"upload_{uuid.uuid4().hex[:8]}{file_ext}"
    filepath = os.path.join(upload_dir, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    try:
        # Copy to outputs dir so it can be served
        output_dir = os.getenv("OUTPUT_DIR", "./outputs")
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, filename)

        import shutil
        shutil.copy2(filepath, output_path)

        result = await pipeline.process_video(output_path, filename)
        return result

    except Exception as e:
        print(f"Video processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
