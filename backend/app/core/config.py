from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "TheFriends Shopping"
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:3000"

    # Base de données
    DATABASE_URL: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # Firebase & Google
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # CinetPay
    CINETPAY_API_KEY: str = ""
    CINETPAY_SITE_ID: str = ""
    CINETPAY_SECRET_KEY: str = ""
    CINETPAY_ENV: str = "TEST"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
