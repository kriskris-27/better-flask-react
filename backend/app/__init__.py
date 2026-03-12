import os
import psycopg2
from flask import Flask
from flask_cors import CORS
from app.config import app_config

def create_app():
    """Application factory for creating and configuring the Flask app."""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(app_config)
    
    # Enable CORS for frontend interaction
    CORS(app)
    
    # Initialize Error Handlers
    from app.errors import register_error_handlers
    register_error_handlers(app)
    
    # Initialize Database
    init_db(app)
    
    # Register Blueprints
    from app.routes.applications import applications_bp
    from app.routes.contacts import contacts_bp
    
    app.register_blueprint(applications_bp, url_prefix='/api/applications')
    app.register_blueprint(contacts_bp, url_prefix='/api/contacts')
    
    @app.route('/health')
    def health_check():
        return {"status": "healthy", "service": "job-tracker-api"}, 200

    return app

def get_db_connection():
    """Utility to create a new PostgreSQL connection."""
    conn = psycopg2.connect(app_config.DATABASE_URL)
    return conn

def init_db(app):
    """Execute schema.sql to initialize the database tables."""
    if not app_config.DATABASE_URL:
        app.logger.error("DATABASE_URL not set. Skipping DB initialization.")
        return

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Read the schema file
        schema_path = os.path.join(os.path.dirname(__file__), '..', 'schema.sql')
        with open(schema_path, 'r') as f:
            cur.execute(f.read())
        
        conn.commit()
        cur.close()
        conn.close()
        app.logger.info("Database initialized successfully.")
    except Exception as e:
        app.logger.error(f"Failed to initialize database: {e}")
