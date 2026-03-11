import os
from app import create_app

# The Flask application instance
app = create_app()

if __name__ == '__main__':
    # Default to 5000, but allow environment to override
    port = int(os.environ.get('PORT', 5000))
    app.run(host='127.0.0.1', port=port, debug=True, use_reloader=True)
