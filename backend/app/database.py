import logging
import re
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool, QueuePool
from app.core.config import settings

logger = logging.getLogger(__name__)

def _mask_db_url(url: str) -> str:
    """Mask password in database URL for safe logging."""
    return re.sub(r"://([^:]+):([^@]+)@", r"://\1:****@", url)

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL
connect_args = {}
engine_kwargs = {}

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    if SQLALCHEMY_DATABASE_URL in ("sqlite://", "sqlite:///:memory:"):
        engine_kwargs["poolclass"] = StaticPool
else:
    # PostgreSQL / Cloud Database Configuration
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "poolclass": QueuePool,
    })

try:
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args, **engine_kwargs)
    with engine.connect() as conn:
        conn.exec_driver_sql("SELECT 1")
    logger.info("Connected to database: %s", _mask_db_url(SQLALCHEMY_DATABASE_URL))
except Exception as e:
    logger.warning(
        "Database connection to %s failed: %s. Falling back to local SQLite database: sqlite:///./fintwin.db",
        _mask_db_url(SQLALCHEMY_DATABASE_URL),
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
        Base.metadata.create_all(bind=engine)
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        with engine.connect() as conn:
            if "users" in tables:
                columns = [col["name"] for col in inspector.get_columns("users")]
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
            
            if "user_profiles" in tables:
                columns = [col["name"] for col in inspector.get_columns("user_profiles")]
                if "retirement_age" not in columns:
                    conn.execute(text("ALTER TABLE user_profiles ADD COLUMN retirement_age INTEGER DEFAULT 55"))
            
            conn.commit()
    except Exception as e:
        logger.warning("ensure_schema check skipped: %s", e)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
