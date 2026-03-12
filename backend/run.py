import os
from app import create_app

# The Flask application instance
app = create_app()

if __name__ == '__main__':
    # Environment-driven settings
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('FLASK_RUN_HOST', '127.0.0.1')
    debug = os.environ.get('FLASK_ENV') == 'dev'
    
    app.run(host=host, port=port, debug=debug, use_reloader=debug)
