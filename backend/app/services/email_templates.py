"""Email template rendering using Jinja2."""
import os
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.config import settings

# Template directory
TEMPLATE_DIR = Path(__file__).parent.parent / "templates" / "emails"

# Jinja2 environment
env = Environment(
    loader=FileSystemLoader(str(TEMPLATE_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
    trim_blocks=True,
    lstrip_blocks=True,
)

# Base template context
BASE_CONTEXT = {
    "brand_name": settings.email_from_name,
    "brand_tagline": "Premium Plumbing Services",
    "support_email": settings.email_from_address,
    "frontend_url": settings.site_url,
    "year": "2026",
}


def render_template(template_name: str, context: dict) -> tuple[str, str]:
    """Render both HTML and text versions of a template."""
    # Merge with base context
    full_context = {**BASE_CONTEXT, **context}

    # Render HTML
    html_template = env.get_template(f"{template_name}.html")
    html_content = html_template.render(**full_context)

    # Render text
    text_template = env.get_template(f"{template_name}.txt")
    text_content = text_template.render(**full_context)

    return html_content, text_content