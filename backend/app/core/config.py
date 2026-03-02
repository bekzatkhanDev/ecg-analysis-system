"""Application configuration."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """App settings from environment."""

    app_name: str = "ECG Analysis API"
    debug: bool = False

    # JWT
    secret_key: str = "change-me-in-production-use-env"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # DB
    database_url: str = "sqlite:///./ecg_analysis.db"

    # ML model
    model_weights_path: str = "best_model_500hz.pth"
    model_num_classes: int = 5
    model_seq_len: int = 5000
    model_n_leads: int = 12

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
