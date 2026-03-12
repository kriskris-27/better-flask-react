"""Application-related workflows that sit between routes and the DB."""

import logging

from app import get_db_connection, put_db_connection
from app.models import get_application_by_id


logger = logging.getLogger(__name__)


def list_applications(status_filter: str | None = None) -> list[dict]:
    """Return raw application rows as dictionaries, optionally filtered by status."""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        if status_filter:
            cur.execute(
                "SELECT * FROM applications WHERE status = %s ORDER BY updated_at DESC",
                (status_filter,),
            )
        else:
            cur.execute("SELECT * FROM applications ORDER BY updated_at DESC")

        colnames = [desc[0] for desc in cur.description] if cur.description else []
        rows = cur.fetchall()
        return [dict(zip(colnames, row)) for row in rows]
    finally:
        cur.close()
        put_db_connection(conn)  # return to pool — not closed


def create_application(validated_data: dict) -> dict:
    """Create a new application and its initial status history entry."""
    logger.info(
        "Creating application",
        extra={
            "company": validated_data.get("company"),
            "role": validated_data.get("role"),
            "status": validated_data.get("status", "APPLIED"),
        },
    )

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        status = validated_data.get("status", "APPLIED")

        cur.execute(
            """
            INSERT INTO applications (company, role, location, source, status, notes)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, company, role, location, source, status, notes, applied_on, created_at, updated_at
            """,
            (
                validated_data["company"],
                validated_data["role"],
                validated_data.get("location"),
                validated_data.get("source"),
                status,
                validated_data.get("notes"),
            ),
        )

        new_app_row = cur.fetchone()
        colnames = [desc[0] for desc in cur.description]
        new_app = dict(zip(colnames, new_app_row))

        cur.execute(
            """
            INSERT INTO status_history (application_id, from_status, to_status, note)
            VALUES (%s, %s, %s, %s)
            """,
            (new_app["id"], None, status, "Application manually created"),
        )

        conn.commit()
        return get_application_by_id(new_app["id"])
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        put_db_connection(conn)  # return to pool
