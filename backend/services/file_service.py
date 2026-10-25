"""Safe file handling for uploaded analysis footage."""

from datetime import datetime
from pathlib import Path

import cv2
from werkzeug.utils import secure_filename


def save_video_upload(*, file, session_id, upload_dir: Path, allowed_extensions, max_size):
    """Validate, save, and inspect a video upload."""
    original_name = file.filename or ""
    if not original_name:
        raise ValueError("No file selected")

    extension = original_name.rsplit(".", 1)[-1].lower() if "." in original_name else ""
    if extension not in allowed_extensions:
        raise ValueError("Invalid file format")

    if file.content_length and file.content_length > max_size:
        raise ValueError("File too large")

    safe_name = secure_filename(
        f"{session_id}_{datetime.now().timestamp()}.{extension}"
    )
    video_path = upload_dir / safe_name
    file.save(str(video_path))

    if video_path.stat().st_size > max_size:
        video_path.unlink(missing_ok=True)
        raise ValueError("File too large")

    capture = cv2.VideoCapture(str(video_path))
    try:
        if not capture.isOpened():
            raise ValueError("Invalid video file")
        fps = capture.get(cv2.CAP_PROP_FPS)
        frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    finally:
        capture.release()

    return {
        "path": video_path,
        "filename": safe_name,
        "original_name": original_name,
        "fps": fps,
        "frame_count": frame_count,
        "width": width,
        "height": height,
        "duration_seconds": frame_count / fps if fps > 0 else 0,
    }
