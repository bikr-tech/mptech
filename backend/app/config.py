from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_key: str = ""
    jwt_secret: str = "super-secret-jwt-change-me"
    gemini_api_key: str = ""
    nvidia_api_key: str = ""
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    nvidia_model_name: str = "meta/llama-3.1-70b-instruct"
    nvidia_vision_model_name: str = "meta/llama-3.2-90b-vision-instruct"
    site_url: str = "http://localhost:5173"
    # Comma-separated list of allowed CORS origins, e.g. "http://localhost:5173,https://mptechsolution-frontend.onrender.com"
    cors_origins: str = "http://localhost:5173"
    # Diagnosis image storage
    storage_bucket: str = "diagnosis-images"
    max_upload_mb: int = 10
    # Transactional email (Resend). Empty key → email service disabled (no-op).
    resend_api_key: str = ""
    resend_from_email: str = "no-reply@mptechsolution.com"
    # Email provider configuration
    # Options: "mailtrap", "resend", "disabled"
    email_provider: str = "disabled"
    # Mailtrap (development)
    mailtrap_host: str = "sandbox.smtp.mailtrap.io"
    mailtrap_port: int = 2525
    mailtrap_username: str = ""
    mailtrap_password: str = ""
    # From address (used by both providers)
    email_from_address: str = "no-reply@mptechsolution.com"
    email_from_name: str = "PlumbNepal"
    # Email worker configuration
    email_worker_batch_size: int = 10
    email_worker_concurrency: int = 3
    email_worker_poll_interval: float = 5.0
    # Admin notification emails (comma-separated)
    admin_notification_emails: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def admin_notification_email_list(self) -> list[str]:
        return [o.strip() for o in self.admin_notification_emails.split(",") if o.strip()]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
