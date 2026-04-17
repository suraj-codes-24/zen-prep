import os
import secrets
import smtplib
from email.message import EmailMessage

from core.logger import logger


def _smtp_settings() -> tuple[str | None, int, str | None, str | None, str | None]:
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USERNAME") or os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("SMTP_FROM_EMAIL") or os.getenv("FROM_EMAIL") or username
    return host, port, username, password, from_email


def send_email(to_email: str, subject: str, body: str) -> bool:
    host, port, username, password, from_email = _smtp_settings()

    if not host or not username or not password or not from_email:
        logger.warning("SMTP is not configured. Email to %s skipped. Subject: %s Body: %s", to_email, subject, body)
        return False

    msg = EmailMessage()
    msg["From"] = from_email
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    try:
        with smtplib.SMTP(host, port, timeout=15) as smtp:
            smtp.starttls()
            smtp.login(username, password)
            smtp.send_message(msg)
        return True
    except Exception as exc:
        logger.warning("Failed to send email to %s: %s", to_email, exc)
        return False


def send_verification_code(to_email: str, code: str, purpose: str) -> bool:
    action = "verify your email" if purpose == "signup" else "reset your password"
    subject = "Your ZenPrep verification code"
    body = (
        f"Your ZenPrep code is {code}.\n\n"
        f"Use this code to {action}. It expires in 10 minutes.\n\n"
        "If you did not request this, you can ignore this email."
    )
    return send_email(to_email, subject, body)


def generate_validation_token() -> str:
    return secrets.token_urlsafe(32)


def send_validation_email(user_email: str, user_name: str, validation_token: str) -> bool:
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    validation_link = f"{frontend_url}/validate-email?token={validation_token}"
    subject = "Verify your email - ZenPrep"
    body = (
        f"Hi {user_name},\n\n"
        "Thank you for signing up with ZenPrep.\n\n"
        f"Please verify your email address here:\n{validation_link}\n\n"
        "If you did not create an account with ZenPrep, please ignore this email."
    )
    return send_email(user_email, subject, body)


def send_contact_email(sender_name: str, sender_email: str, message: str) -> bool:
    _, _, _, _, from_email = _smtp_settings()
    admin_email = os.getenv("CONTACT_TO_EMAIL") or from_email
    if not admin_email:
        logger.warning("Contact email skipped because no admin email is configured")
        return False

    subject = f"New Contact Form Submission from {sender_name}"
    body = (
        "New contact form submission from ZenPrep landing page.\n\n"
        f"Name: {sender_name}\n"
        f"Email: {sender_email}\n\n"
        f"Message:\n{message}\n\n"
        "---\nThis is an automated message from ZenPrep contact form."
    )
    return send_email(admin_email, subject, body)
