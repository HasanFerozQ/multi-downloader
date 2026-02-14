from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
import time
import json
from pathlib import Path
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

FEEDBACK_FILE = Path("feedback.json")

class FeedbackModel(BaseModel):
    message: str
    contact: str = ""
    honeypot: str = ""  # Anti-spam field (should be empty)

@router.post("/feedback")
@limiter.limit("5/hour")
async def submit_feedback(request: Request, feedback: FeedbackModel):
    # Spam check: Honeypot field must be empty
    if feedback.honeypot:
        return {"status": "ignored"}  # Silently ignore spam

    if not feedback.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    entry = {
        "timestamp": time.time(),
        "ip": request.client.host if request.client else "unknown",
        "message": feedback.message,
        "contact": feedback.contact
    }

    try:
        data = []
        if FEEDBACK_FILE.exists():
            try:
                with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except json.JSONDecodeError:
                pass # File corrupted or empty, start fresh

        data.append(entry)

        with open(FEEDBACK_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

        return {"status": "success", "message": "Feedback received"}
    except Exception as e:
        print(f"Error saving feedback: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
