"""Domain and persistence logic for job applications.

Contains the application status state machine and low-level
database operations used by the routes.
"""

from datetime import datetime
from app.errors import StateMachineError, ResourceNotFoundError
from app import get_db_connection, put_db_connection

# Allowed transitions for the application status state machine.
VALID_TRANSITIONS = {
    'APPLIED':      ['SCREENING', 'REJECTED'],
    'SCREENING':    ['INTERVIEWING', 'REJECTED'],
    'INTERVIEWING': ['OFFERED', 'REJECTED'],
    'OFFERED':      ['ACCEPTED', 'REJECTED'],
    'ACCEPTED':     [],  # Terminal state
    'REJECTED':     []   # Terminal state
}


def validate_state_transition(from_status, to_status):
    """Enforces the strict application status state machine rules."""
    if from_status not in VALID_TRANSITIONS:
        raise StateMachineError(f"Current status '{from_status}' is unknown.")

    if to_status not in VALID_TRANSITIONS[from_status]:
        raise StateMachineError(
            f"Illegal transition: Cannot move from {from_status} to {to_status}. "
            f"Valid next states: {', '.join(VALID_TRANSITIONS[from_status])}"
        )


def get_application_by_id(app_id):
    """Fetch a single application with its contacts and status history."""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM applications WHERE id = %s", (app_id,))
        app_row = cur.fetchone()

        if not app_row:
            raise ResourceNotFoundError(f"Application with ID {app_id} not found.")

        colnames = [desc[0] for desc in cur.description]
        app_dict = dict(zip(colnames, app_row))

        cur.execute("SELECT * FROM contacts WHERE application_id = %s", (app_id,))
        colnames_c = [desc[0] for desc in cur.description]
        app_dict['contacts'] = [dict(zip(colnames_c, row)) for row in cur.fetchall()]

        cur.execute(
            "SELECT * FROM status_history WHERE application_id = %s ORDER BY changed_at DESC",
            (app_id,)
        )
        colnames_h = [desc[0] for desc in cur.description]
        app_dict['history'] = [dict(zip(colnames_h, row)) for row in cur.fetchall()]

        return app_dict
    finally:
        cur.close()
        put_db_connection(conn)  # return to pool


def update_application_status(app_id, to_status, note=None, intel=None):
    """Updates status and logs history within a single transaction."""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT status FROM applications WHERE id = %s", (app_id,))
        row = cur.fetchone()
        if not row:
            raise ResourceNotFoundError(f"Application with ID {app_id} not found.")

        from_status = row[0]
        validate_state_transition(from_status, to_status)

        if intel:
            cur.execute(
                "UPDATE applications SET status = %s, updated_at = %s, interview_intel = %s WHERE id = %s",
                (to_status, datetime.utcnow(), intel, app_id)
            )
        else:
            cur.execute(
                "UPDATE applications SET status = %s, updated_at = %s WHERE id = %s",
                (to_status, datetime.utcnow(), app_id)
            )

        cur.execute(
            "INSERT INTO status_history (application_id, from_status, to_status, note) VALUES (%s, %s, %s, %s)",
            (app_id, from_status, to_status, note)
        )

        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        put_db_connection(conn)  # return to pool
