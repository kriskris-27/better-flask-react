from flask import Blueprint, request
from marshmallow import ValidationError as MarshmallowValidationError
from ..models import get_application_by_id, get_db_connection
from ..schemas import applications_schema, application_schema
from ..utils import standard_response
from ..errors import ResourceNotFoundError, ValidationError

applications_bp = Blueprint('applications', __name__)

@applications_bp.route('/', methods=['GET'], strict_slashes=False)
@applications_bp.route('', methods=['GET'], strict_slashes=False)
def list_applications():
    """Retrieve all applications, with optional status filtering."""
    status_filter = request.args.get('status')
    
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        if status_filter:
            cur.execute("SELECT * FROM applications WHERE status = %s ORDER BY updated_at DESC", (status_filter,))
        else:
            cur.execute("SELECT * FROM applications ORDER BY updated_at DESC")
            
        colnames = [desc[0] for desc in cur.description] if cur.description else []
        rows = cur.fetchall()
        apps = [dict(zip(colnames, row)) for row in rows]
        
        # Serialize with marshmallow
        result = applications_schema.dump(apps)
        return standard_response(data=result)
    finally:
        cur.close()
        conn.close()

@applications_bp.route('/<int:app_id>', methods=['GET'])
def get_application(app_id):
    """Retrieve a single application by ID with contacts and history."""
    # get_application_by_id raises ResourceNotFoundError if not found
    app_data = get_application_by_id(app_id)
    
    # Serialize including nested relationships
    result = application_schema.dump(app_data)
    
    return standard_response(data=result)

@applications_bp.route('/', methods=['POST'], strict_slashes=False)
@applications_bp.route('', methods=['POST'], strict_slashes=False)
def create_application():
    """Create a new job application."""
    data = request.get_json()
    if not data:
        raise ValidationError("No JSON data provided.")

    try:
        # Validate incoming data using Marshmallow
        validated_data = application_schema.load(data)
    except MarshmallowValidationError as err:
        return standard_response(success=False, error=err.messages, status_code=422)

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        status = validated_data.get('status', 'APPLIED')
        
        # 1. Insert into applications table
        cur.execute(
            """
            INSERT INTO applications (company, role, location, status, notes)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, company, role, location, status, notes, applied_on, created_at, updated_at
            """,
            (
                validated_data['company'],
                validated_data['role'],
                validated_data.get('location'),
                status,
                validated_data.get('notes')
            )
        )
        
        new_app_row = cur.fetchone()
        colnames = [desc[0] for desc in cur.description]
        new_app = dict(zip(colnames, new_app_row))
        
        # 2. Insert initial entry into status_history
        cur.execute(
            """
            INSERT INTO status_history (application_id, from_status, to_status, note)
            VALUES (%s, %s, %s, %s)
            """,
            (new_app['id'], None, status, "Application manually created")
        )

        conn.commit()

        # 3. Fetch the full, newly created application record to return it
        full_app_data = get_application_by_id(new_app['id'])
        result = application_schema.dump(full_app_data)
        
        return standard_response(data=result, status_code=201)

    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()
