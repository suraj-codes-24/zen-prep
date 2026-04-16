"""
Google OAuth Service - Handles Google OAuth token exchange and user info retrieval.
"""
import httpx
from core.config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
from fastapi import HTTPException


async def get_google_user_info(code: str) -> dict:
    """
    Exchange OAuth code for access token and retrieve user info from Google.
    
    Args:
        code: OAuth authorization code from Google
        
    Returns:
        dict: User info including id, email, name, picture
    """
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    # Exchange code for access token
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    
    async with httpx.AsyncClient() as client:
        try:
            token_response = await client.post(token_url, data=token_data)
            token_response.raise_for_status()
            token_json = token_response.json()
            
            access_token = token_json.get("access_token")
            if not access_token:
                raise HTTPException(status_code=400, detail="Failed to get access token from Google")
            
            # Get user info using access token
            user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
            headers = {"Authorization": f"Bearer {access_token}"}
            
            user_info_response = await client.get(user_info_url, headers=headers)
            user_info_response.raise_for_status()
            user_info = user_info_response.json()
            
            return {
                "google_id": user_info.get("id"),
                "email": user_info.get("email"),
                "name": user_info.get("name"),
                "picture": user_info.get("picture"),
                "verified_email": user_info.get("verified_email", False),
            }
            
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=400, detail=f"Google OAuth error: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error during Google OAuth: {str(e)}")


def get_google_auth_url() -> str:
    """
    Generate the Google OAuth authorization URL.
    
    Returns:
        str: Google OAuth authorization URL
    """
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    base_url = "https://accounts.google.com/o/oauth2/v2/auth"
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    
    from urllib.parse import urlencode
    return f"{base_url}?{urlencode(params)}"
