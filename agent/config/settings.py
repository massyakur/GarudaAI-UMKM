import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "kol_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZGUxZWNlMWUtNGVhZi00MDliLTk5ODgtMTIyNmFjMjZkY2E1Iiwia2V5X2lkIjoiNDI5ZmFmNzgtNWFhMy00MTc0LTlkOTYtZjYwZmMzNzEwMzdmIiwia2V5X25hbWUiOiJha2JhciIsImVtYWlsIjoiYWtiYXJyb3phcTY5MUBnbWFpbC5jb20iLCJyYXRlX2xpbWl0X3JwcyI6bnVsbCwibWF4X2NyZWRpdF91c2UiOm51bGwsImNyZWF0ZWRfYXQiOjE3NjQ1NjI4OTEsImV4cGlyZXNfYXQiOjE3OTYwOTg4OTEsImlhdCI6MTc2NDU2Mjg5MX0.9um9NV5SvEOC0UGJEiwNN-z0Ubt9sf40hGpsrUlFFDk")
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "https://api.kolosal.ai/v1/")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "Qwen 3 30BA3B")

settings = Settings()