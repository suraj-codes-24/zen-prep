import os
import json
import re
from groq import Groq

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

# Initialize Groq client (fallback)
_groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Initialize Gemini client (primary)
_gemini_api_key = os.getenv("GEMINI_API_KEY")
if _gemini_api_key and genai and types:
    _gemini_client = genai.Client(api_key=_gemini_api_key)
else:
    _gemini_client = None

MODEL_MAP = {
    "llama3.1:8b":        "llama-3.1-8b-instant",
    "qwen2.5-coder:7b":   "llama-3.1-8b-instant",
}
DEFAULT_MODEL = "llama-3.1-8b-instant"

class LLMUnavailable(Exception):
    pass

def generate(prompt, model="llama3.1:8b", temperature=0.7, num_predict=512, max_tokens=None):
    """
    Generates text using Gemini (primary) with Groq as fallback.
    Maintains the interface of the original llm_utils.
    """
    if max_tokens is not None:
        num_predict = max_tokens

    # Try Gemini first
    if _gemini_client and types:
        try:
            response = _gemini_client.models.generate_content(
                model="gemini-1.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=temperature,
                    max_output_tokens=num_predict,
                ),
            )
            return response.text.strip()
        except Exception as e:
            print(f"[LLM] Gemini failed, falling back to Groq: {str(e)}")
    
    # Fallback to Groq
    groq_model = MODEL_MAP.get(model, DEFAULT_MODEL)
    try:
        resp = _groq_client.chat.completions.create(
            model=groq_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=num_predict,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        raise LLMUnavailable(f"Groq API Error: {str(e)}") from e

def extract_json_object(text):
    """
    Extracts the first JSON object found in the text.
    """
    try:
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception:
        pass
    return None

def extract_json_array(text):
    """
    Extracts the first JSON array found in the text.
    """
    try:
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception:
        pass
    return None
