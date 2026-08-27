import time, httpx
from openai import OpenAI
from .config import settings

GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.gemini_api_key}"

def _content_parts(content):
    """Build Gemini inline_data parts from an OpenAI-style content block.
    A str is plain text; a dict (or list of dicts) may carry inline image data."""
    if isinstance(content, str):
        return [{"text": content}]
    parts = []
    for item in content if isinstance(content, list) else [content]:
        if item.get("type") == "text":
            parts.append({"text": item["text"]})
        elif item.get("type") == "image_url" and "data:" in str(item.get("image_url", {}).get("url", "")):
            url = item["image_url"]["url"]
            mime_type = url.split("data:", 1)[1].split(";", 1)[0]
            data = url.split(",", 1)[1]
            parts.append({"inline_data": {"mime_type": mime_type, "data": data}})
        else:
            parts.append({"text": str(item)})
    return parts


def _call_gemini(msgs, timeout=10, generation_config=None):
    contents = [{"role": m["role"], "parts": _content_parts(m["content"])} for m in msgs]
    payload = {"contents": contents}
    if generation_config:
        payload["generationConfig"] = generation_config
    with httpx.Client(timeout=timeout) as c:
        r = c.post(GEMINI_URL, json=payload)
    if r.status_code == 429:
        raise TimeoutError("Gemini rate limited")
    r.raise_for_status()
    return r.json()["candidates"][0]["content"]["parts"][0]["text"]

def invoke_gemini(msgs, timeout=30, response_schema=None):
    """Direct Gemini call with structured-JSON output (used by image guardrails).

    Returns JSON text; the caller parses with extract_json + pydantic. Optional
    responseSchema is passed only if proven reliable at runtime (ponytail: the
    JSON-text + pydantic path is the dependable default).
    """
    generation_config = {"responseMimeType": "application/json"}
    if response_schema:
        generation_config["responseSchema"] = response_schema
    return _call_gemini(msgs, timeout=timeout, generation_config=generation_config)

def _call_openai(msgs, timeout=120, model=None):
    client = OpenAI(
        api_key=settings.nvidia_api_key,
        base_url=settings.nvidia_base_url,
        timeout=timeout,
    )
    chat = client.chat.completions.create(
        model=model or settings.nvidia_model_name,
        messages=msgs,
        temperature=0.5,
        max_tokens=2048,
    )
    return chat.choices[0].message.content

def invoke_vision(msgs, overall_timeout=120):
    """Call NVIDIA vision model. msgs should carry image_url content blocks."""
    try:
        return _call_openai(msgs, timeout=min(overall_timeout, 120), model=settings.nvidia_vision_model_name)
    except Exception:
        # Fall back to Gemini inline image if NVIDIA vision is unavailable.
        return _call_gemini(msgs, timeout=min(overall_timeout, 10))

def invoke_llm(msgs, overall_timeout=180):
    start = time.time()
    try:
        return _call_openai(msgs, timeout=min(overall_timeout, 120))
    except Exception:
        pass
    remaining = overall_timeout - (time.time() - start)
    if remaining < 5:
        raise TimeoutError("LLM timed out")
    try:
        return _call_gemini(msgs, timeout=min(remaining, 10))
    except Exception:
        raise TimeoutError("LLM timed out")
