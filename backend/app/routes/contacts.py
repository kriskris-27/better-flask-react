import flask
from flask import request
from marshmallow import ValidationError as MarshmallowValidationError
from app.schemas import contact_schema
from app.utils import standard_response
from app.errors import ValidationError, ResourceNotFoundError
from app.models import get_db_connection, get_application_by_id

contacts_bp = flask.Blueprint('contacts', __name__)

@contacts_bp.route('/', methods=['POST'], strict_slashes=False)
@contacts_bp.route('', methods=['POST'], strict_slashes=False)
def create_contact():
    """Create a new contact associated with a job application."""
    data = request.get_json()
    if not data:
        raise ValidationError("No JSON data provided.")

    try:
        validated_data = contact_schema.load(data)
    except MarshmallowValidationError as err:
        return standard_response(success=False, error=err.messages, status_code=422)

    app_id = validated_data['application_id']
    
    # First, verify the application exists.
    # get_application_by_id raises ResourceNotFoundError if missing
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
                validated_data['name'],
                validated_data.get('role'),
                validated_data.get('email'),
                validated_data.get('linkedin')
            )
        )
        
        new_contact_row = cur.fetchone()
        colnames = [desc[0] for desc in cur.description]
        new_contact = dict(zip(colnames, new_contact_row))
        conn.commit()
        
        # Serialize the response
        result = contact_schema.dump(new_contact)
        return standard_response(data=result, status_code=201)
        
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()

@contacts_bp.route('/<int:contact_id>', methods=['DELETE'])
def delete_contact(contact_id):
    """Delete a contact by ID."""
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM contacts WHERE id = %s RETURNING id", (contact_id,))
        deleted_row = cur.fetchone()
        
        if not deleted_row:
            raise ResourceNotFoundError(f"Contact with ID {contact_id} not found.")
            
        conn.commit()
        return standard_response(data={"message": f"Contact {contact_id} successfully deleted"})
        
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()
