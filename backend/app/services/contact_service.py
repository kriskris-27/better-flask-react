"""Contact-related workflows between routes and the DB."""

from app import get_db_connection
from app.errors import ResourceNotFoundError
from app.models import get_application_by_id


def create_contact(validated_data: dict) -> dict:
    """Create a contact for an existing application and return it as a dict."""
    app_id = validated_data["application_id"]

    # Ensure the parent application exists; will raise ResourceNotFoundError if not.
    get_application_by_id(app_id)

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            INSERT INTO contacts (application_id, name, role, email, linkedin)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, application_id, name, role, email, linkedin
            """,
            (
                app_id,
                validated_data["name"],
                validated_data.get("role"),
                validated_data.get("email"),
                validated_data.get("linkedin"),
            ),
        )

        new_contact_row = cur.fetchone()
        colnames = [desc[0] for desc in cur.description]
        conn.commit()
        return dict(zip(colnames, new_contact_row))
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()


def delete_contact(contact_id: int) -> None:
    """Delete a contact by ID or raise ResourceNotFoundError if missing."""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM contacts WHERE id = %s RETURNING id", (contact_id,))
        deleted_row = cur.fetchone()

        if not deleted_row:
            raise ResourceNotFoundError(f"Contact with ID {contact_id} not found.")

        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()

