import logging
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool
from app.core.config import settings

logger = logging.getLogger(__name__)

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL
connect_args = {}
engine_kwargs = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    if SQLALCHEMY_DATABASE_URL in ("sqlite://", "sqlite:///:memory:"):
        engine_kwargs["poolclass"] = StaticPool

try:
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args, **engine_kwargs)
    with engine.connect() as conn:
        conn.exec_driver_sql("SELECT 1")
except Exception as e:
    logger.warning(
        "⚠️ Database connection to %s failed: %s. Falling back to local SQLite database: sqlite:///./fintwin.db",
        SQLALCHEMY_DATABASE_URL,
        e,
    )
    SQLALCHEMY_DATABASE_URL = "sqlite:///./fintwin.db"
    connect_args = {"check_same_thread": False}
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_schema() -> None:
    """Add columns introduced after the initial SQLite file was created."""
    try:
        inspector = inspect(engine)
        if "users" in inspector.get_table_names():
            columns = [col["name"] for col in inspector.get_columns("users")]
            with engine.connect() as conn:
                if "email" not in columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR"))
                if "hashed_password" not in columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN hashed_password VARCHAR"))
                if "google_id" not in columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN google_id VARCHAR"))
                if "avatar_url" not in columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR"))
                if "is_active" not in columns:
                    conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1"))
                conn.commit()
    except Exception as e:
        logger.warning("ensure_schema check skipped: %s", e)



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
