from flask import jsonify  # type: ignore

def standard_response(success=True, data=None, error=None):
    """
    Standardizes all API responses to follow the same JSON structure.
    Returns a Flask Response object with the standardized JSON and appropriate status code.
    """
    response_body = {
        "success": success,
        "data": data,
        "error": error
    }
    
    # Determine the status code based on success and nature of the error
    status_code = 200 if success else 400
    
    return jsonify(response_body), status_code
