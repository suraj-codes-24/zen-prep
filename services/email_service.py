"""
Email Service - Handles sending emails including validation links.
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from core.config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, FROM_EMAIL, FRONTEND_URL
import secrets
from fastapi import HTTPException


def generate_validation_token():
    """Generate a secure token for email validation."""
    return secrets.token_urlsafe(32)


def send_validation_email(user_email: str, user_name: str, validation_token: str) -> bool:
    """
    Send email validation link to the user.
    
    Args:
        user_email: User's email address
        user_name: User's name
        validation_token: Validation token for the link
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        print("[EMAIL] SMTP not configured, skipping email validation")
        return False
    
    validation_link = f"{FRONTEND_URL}/validate-email?token={validation_token}"
    
    subject = "Verify your email - Zen Prep"
    body = f"""
Hi {user_name},

Thank you for signing up with Zen Prep!

Please verify your email address by clicking the link below:

{validation_link}

This link will expire in 24 hours.

If you didn't create an account with Zen Prep, please ignore this email.

Best regards,
The Zen Prep Team
"""
    
    try:
        msg = MIMEMultipart()
        msg['From'] = FROM_EMAIL
        msg['To'] = user_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'plain'))
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        print(f"[EMAIL] Validation email sent to {user_email}")
        return True
        
    except Exception as e:
        print(f"[EMAIL] Failed to send validation email: {str(e)}")
        return False
