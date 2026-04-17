from sqlalchemy import inspect, text

from core.logger import logger


def ensure_auth_schema(engine) -> None:
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    if "users" not in table_names:
        return

    user_columns = {col["name"] for col in inspector.get_columns("users")}
    statements = []

    if "email_verified" not in user_columns:
        statements.append("ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT TRUE NOT NULL")
    if "auth_provider" not in user_columns:
        statements.append("ALTER TABLE users ADD COLUMN auth_provider VARCHAR DEFAULT 'password' NOT NULL")
    if "google_id" not in user_columns:
        statements.append("ALTER TABLE users ADD COLUMN google_id VARCHAR")

    if not statements:
        return

    with engine.begin() as conn:
        for statement in statements:
            logger.info("Applying auth schema update: %s", statement)
            conn.execute(text(statement))
