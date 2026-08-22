import os
from dotenv import load_dotenv

load_dotenv()

<<<<<<< HEAD
class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/fintwin")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

=======

class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/fintwin",
    )
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")


>>>>>>> e4b5d74 (feat: refactor backend architecture with improved configuration, schema aliases, and support for retirement age and user-friendly chat input.)
settings = Settings()
