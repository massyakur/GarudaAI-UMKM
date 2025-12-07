import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "https://api.kolosal.ai/v1")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "Llama 4 Maverick")

settings = Settings()