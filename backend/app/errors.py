from flask import jsonify  # type: ignore

class AppException(Exception):
    """Base exception class for all application errors."""
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code

class ResourceNotFoundError(AppException):
    """Raised when a requested resource (application, contact) doesn't exist."""
    def __init__(self, message="Resource not found"):
        super().__init__(message, status_code=404)

class ValidationError(AppException):
    """Raised when input validation fails."""
    def __init__(self, message="Invalid input data"):
        super().__init__(message, status_code=422)

class StateMachineError(AppException):
    """Raised when a status transition is invalid."""
    def __init__(self, message="Invalid status transition"):
        super().__init__(message, status_code=403)

def register_error_handlers(app):
    """Registers global error handlers with the Flask app."""
    
    @app.errorhandler(AppException)
    def handle_app_exception(error):
        response = {
            "success": False,
            "data": None,
            "error": error.message
        }
        return jsonify(response), error.status_code

    @app.errorhandler(404)
    def handle_404(error):
        return jsonify({
            "success": False,
            "data": None,
            "error": "The requested URL was not found on the server."
        }), 404

    @app.errorhandler(500)
    def handle_500(error):
        return jsonify({
            "success": False,
            "data": None,
            "error": "An internal server error occurred."
        }), 500

    @app.errorhandler(Exception)
    def handle_generic_exception(error):
        # Log the error for production debugging
        app.logger.error(f"Unhandled Exception: {error}")
        return jsonify({
            "success": False,
            "data": None,
            "error": "Something went wrong. Please try again later."
        }), 500
