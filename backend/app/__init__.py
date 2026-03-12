"""Flask application factory and database initialization.

This module wires together configuration, CORS, error handling,
database initialization, blueprints, and a connection pool.
"""

import os
import psycopg2
from psycopg2 import pool as pg_pool
from flask import Flask
from flask_cors import CORS
from app.config import app_config

# Global connection pool — created once when the app starts.
# Reusing connections eliminates the TCP + SSL + Postgres auth overhead on every request.
_connection_pool: pg_pool.ThreadedConnectionPool | None = None


def get_db_connection():
    """Get a connection from the pool. Must call put_db_connection() when done."""
    global _connection_pool
    if _connection_pool is None or _connection_pool.closed:
        raise RuntimeError("Connection pool is not initialized.")
    conn = _connection_pool.getconn()
    # Reconnect if the connection was dropped (e.g. Neon idle timeout)
    try:
        conn.cursor().execute("SELECT 1")
    except psycopg2.OperationalError:
        _connection_pool.putconn(conn)
        conn = psycopg2.connect(app_config.DATABASE_URL)
    return conn


def put_db_connection(conn):
    """Return a connection back to the pool."""
    global _connection_pool
    if _connection_pool and not _connection_pool.closed:
        _connection_pool.putconn(conn)


def create_app():
    """Application factory for creating and configuring the Flask app."""
    global _connection_pool

    app = Flask(__name__)

    # Load configuration
    app.config.from_object(app_config)

    # Enable CORS for frontend interaction
    CORS(app)

    # Initialize Error Handlers
    from app.errors import register_error_handlers
    register_error_handlers(app)

    # Create connection pool (min=2, max=10 connections)
    if app_config.DATABASE_URL:
        try:
            _connection_pool = pg_pool.ThreadedConnectionPool(
                minconn=2,
                maxconn=10,
                dsn=app_config.DATABASE_URL,
            )
            app.logger.info("Connection pool created (min=2, max=10).")
        except Exception as e:
            app.logger.error(f"Failed to create connection pool: {e}")

    # Initialize Database schema
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


def init_db(app):
    """Execute schema.sql to initialize the database tables."""
    if not app_config.DATABASE_URL:
        app.logger.error("DATABASE_URL not set. Skipping DB initialization.")
        return

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        schema_path = os.path.join(os.path.dirname(__file__), '..', 'schema.sql')
        with open(schema_path, 'r') as f:
            cur.execute(f.read())

        conn.commit()
        cur.close()
        put_db_connection(conn)
        app.logger.info("Database initialized successfully.")
    except Exception as e:
        app.logger.error(f"Failed to initialize database: {e}")
