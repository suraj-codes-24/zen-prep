from fastapi import APIRouter
from pydantic import BaseModel
from services.email_service import send_contact_email

router = APIRouter(prefix="/contact", tags=["Contact"])


class ContactRequest(BaseModel):
    name: str
    email: str
    message: str


@router.post("/submit")
def submit_contact(data: ContactRequest):
    """Submit contact form and send email notification."""
    send_contact_email(data.name, data.email, data.message)
    return {"success": True, "message": "Message sent successfully"}
