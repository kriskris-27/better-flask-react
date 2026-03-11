from flask import Blueprint, request
from ..models import get_application_by_id, get_db_connection
from ..schemas import applications_schema, application_schema
from ..utils import standard_response
from ..errors import ResourceNotFoundError

applications_bp = Blueprint('applications', __name__)

@applications_bp.route('/', methods=['GET'])
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
