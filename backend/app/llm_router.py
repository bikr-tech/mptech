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
            data = item["image_url"]["url"].split(",", 1)[1]
            parts.append({"inline_data": {"mime_type": "image/jpeg", "data": data}})
        else:
            parts.append({"text": str(item)})
    return parts


def _call_gemini(msgs, timeout=10):
    contents = [{"role": m["role"], "parts": _content_parts(m["content"])} for m in msgs]
    with httpx.Client(timeout=timeout) as c:
        r = c.post(GEMINI_URL, json={"contents": contents})
    if r.status_code == 429:
        raise TimeoutError("Gemini rate limited")
    r.raise_for_status()
    return r.json()["candidates"][0]["content"]["parts"][0]["text"]

def _call_openai(msgs, timeout=120):
    client = OpenAI(
        api_key=settings.nvidia_api_key,
        base_url=settings.nvidia_base_url,
        timeout=timeout,
    )
    chat = client.chat.completions.create(
        model=settings.nvidia_model_name,
        messages=msgs,
        temperature=0.5,
        max_tokens=2048,
    )
    return chat.choices[0].message.content

def invoke_llm(msgs, overall_timeout=180):
    start = time.time()
    try:
        return _call_gemini(msgs, timeout=10)
    except (httpx.TimeoutException, TimeoutError, Exception):
        pass
    remaining = overall_timeout - (time.time() - start)
    if remaining < 5:
        raise TimeoutError("LLM timed out")
    return _call_openai(msgs, timeout=min(remaining, 120))
