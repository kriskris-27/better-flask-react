from marshmallow import Schema, fields, validate, EXCLUDE

class ApplicationSchema(Schema):
    """Schema for validating and serializing Application data."""
    class Meta:
        # Ignore unknown fields passed in the request
        unknown = EXCLUDE

    id = fields.Int(dump_only=True)
    company = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    role = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    location = fields.Str(validate=validate.Length(max=255))
    source = fields.Str(validate=validate.Length(max=255))
    applied_on = fields.Date()
    status = fields.Str(
        validate=validate.OneOf(['APPLIED', 'SCREENING', 'INTERVIEWING', 'OFFERED', 'ACCEPTED', 'REJECTED']),
        dump_default='APPLIED'
    )
    notes = fields.Str()
    interview_intel = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    
    # Nested fields for full retrieval
    contacts = fields.List(fields.Nested(lambda: ContactSchema()), dump_only=True)
    history = fields.List(fields.Dict(), dump_only=True)

class ContactSchema(Schema):
    """Schema for validating and serializing Contact data."""
    class Meta:
        unknown = EXCLUDE

    id = fields.Int(dump_only=True)
    application_id = fields.Int(required=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    role = fields.Str(validate=validate.Length(max=255))
    email = fields.Email()
    linkedin = fields.URL()

# Instances for easy import
application_schema = ApplicationSchema()
applications_schema = ApplicationSchema(many=True)
contact_schema = ContactSchema()
contacts_schema = ContactSchema(many=True)
