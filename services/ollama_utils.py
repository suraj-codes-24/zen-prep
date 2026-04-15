import os
import json
import re
from groq import Groq, APIConnectionError

# Initialize Groq client
_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MODEL_MAP = {
    "llama3.1:8b":        "llama-3.1-8b-instant",
    "qwen2.5-coder:7b":   "llama-3.1-8b-instant",
}
DEFAULT_MODEL = "llama-3.1-8b-instant"

class OllamaUnavailable(Exception):
    pass

def generate(prompt, model="llama3.1:8b", temperature=0.7, num_predict=512):
    """
    Generates text using Groq Cloud API, maintaining the interface of the original ollama_utils.
    """
    groq_model = MODEL_MAP.get(model, DEFAULT_MODEL)
    try:
        resp = _client.chat.completions.create(
            model=groq_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=num_predict,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        raise OllamaUnavailable(f"Groq API Error: {str(e)}") from e

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
