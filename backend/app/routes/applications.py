"""HTTP routes for working with job applications.

These handlers validate/serialize payloads and delegate business
logic to services and models.
"""

import flask
from flask import request
from marshmallow import ValidationError as MarshmallowValidationError
from app.models import get_application_by_id, update_application_status
from app.schemas import applications_schema, application_schema
from app.utils import standard_response
from app.errors import ResourceNotFoundError, ValidationError, StateMachineError
from app.services.ai_service import generate_interview_prep
from app.services.application_service import (
    list_applications as list_applications_service,
    create_application as create_application_service,
)

applications_bp = flask.Blueprint('applications', __name__)

@applications_bp.route('/', methods=['GET'], strict_slashes=False)
@applications_bp.route('', methods=['GET'], strict_slashes=False)
def list_applications():
    """Retrieve all applications, with optional status filtering."""
    status_filter = request.args.get('status')

    # Fetch raw application rows via the service layer
    apps = list_applications_service(status_filter)

    # Serialize with marshmallow
    result = applications_schema.dump(apps)
    return standard_response(data=result)

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

    # Delegate creation and transactional work to the service layer
    full_app_data = create_application_service(validated_data)
    result = application_schema.dump(full_app_data)

    return standard_response(data=result, status_code=201)

@applications_bp.route('/<int:app_id>/status', methods=['PATCH'])
def transition_status(app_id):
    """
    Updates the status of an application and logs the transition.
    Enforces State Machine rules (e.g., APPLIED -> SCREENING).
    """
    data = request.get_json()
    if not data or 'to_status' not in data:
        raise ValidationError("Missing 'to_status' field in JSON payload.")
    
    to_status = data['to_status']
    note = data.get('note')

    try:
        # 1. Fetch current app data to get company/role for AI if needed
        app_data = get_application_by_id(app_id)
        intel = None
        
        # 2. Trigger Gemini AI if moving to INTERVIEWING
        if to_status == 'INTERVIEWING':
            # We already have company and role from app_data
            intel = generate_interview_prep(app_data['company'], app_data['role'])

        # 3. Update status ensuring state machine validity
        update_application_status(app_id, to_status, note, intel)
        
        # 4. Return the freshly updated Application object
        updated_app = get_application_by_id(app_id)
        result = application_schema.dump(updated_app)
        
        return standard_response(data=result)
        
    except StateMachineError as e:
        # Invalid state transition (e.g. going backward)
        return standard_response(success=False, error=str(e), status_code=403)

