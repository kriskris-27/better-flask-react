"""HTTP routes for managing contacts attached to applications.

These endpoints validate input, then delegate creation/deletion
to the contact service layer.
"""

import flask
from flask import request
from marshmallow import ValidationError as MarshmallowValidationError
from app.schemas import contact_schema
from app.utils import standard_response
from app.errors import ValidationError
from app.services.contact_service import (
    create_contact as create_contact_service,
    delete_contact as delete_contact_service,
)

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

    # Delegate creation and DB work to the service layer
    new_contact = create_contact_service(validated_data)

    # Serialize the response
    result = contact_schema.dump(new_contact)
    return standard_response(data=result, status_code=201)

@contacts_bp.route('/<int:contact_id>', methods=['DELETE'])
def delete_contact(contact_id):
    """Delete a contact by ID."""
    delete_contact_service(contact_id)
    return standard_response(data={"message": f"Contact {contact_id} successfully deleted"})
