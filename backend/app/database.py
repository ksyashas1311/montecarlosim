import logging
<<<<<<< HEAD
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool
=======

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

>>>>>>> e4b5d74 (feat: refactor backend architecture with improved configuration, schema aliases, and support for retirement age and user-friendly chat input.)
from app.config import settings

logger = logging.getLogger(__name__)

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL
<<<<<<< HEAD

connect_args = {}
engine_kwargs = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    if SQLALCHEMY_DATABASE_URL in ("sqlite://", "sqlite:///:memory:"):
        engine_kwargs["poolclass"] = StaticPool

try:
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args, **engine_kwargs)
    # Test connection
    conn = engine.connect()
    conn.close()
except Exception as e:
    logger.warning(f"⚠️ Database connection to {SQLALCHEMY_DATABASE_URL} failed: {e}. Falling back to local SQLite database: sqlite:///./fintwin.db")
    SQLALCHEMY_DATABASE_URL = "sqlite:///./fintwin.db"
    connect_args = {"check_same_thread": False}
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

=======
connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)

try:
    with engine.connect() as conn:
        conn.exec_driver_sql("SELECT 1")
except Exception as e:
    logger.warning(
        "⚠️ Database connection to %s failed: %s. Falling back to local SQLite database: sqlite:///./fintwin.db",
        SQLALCHEMY_DATABASE_URL,
        e,
    )
    SQLALCHEMY_DATABASE_URL = "sqlite:///./fintwin.db"
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_schema() -> None:
    """Add columns introduced after the initial SQLite file was created."""
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    if "user_profiles" not in tables:
        return
    cols = {c["name"] for c in inspector.get_columns("user_profiles")}
    if "retirement_age" not in cols:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE user_profiles ADD COLUMN retirement_age INTEGER DEFAULT 55"))


>>>>>>> e4b5d74 (feat: refactor backend architecture with improved configuration, schema aliases, and support for retirement age and user-friendly chat input.)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
