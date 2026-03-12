import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration settings shared across all environments."""
    SECRET_KEY: str = os.environ.get('SECRET_KEY', 'default-dev-key')
    
    # PostgreSQL Configuration (Neon)
    DATABASE_URL: str = os.environ.get('DATABASE_URL', '')
    
    GEMINI_API_KEY: str = os.environ.get('GEMINI_API_KEY', '')
    LLM_MODEL: str = os.environ.get('LLM_MODEL', 'gemini-1.5-flash')
    
    DEBUG: bool = False
    TESTING: bool = False

class DevelopmentConfig(Config):
    """Configuration for local development."""
    DEBUG = True

class TestingConfig(Config):
    """Configuration for automated tests."""
    TESTING = True
    DATABASE_URL = os.environ.get('TEST_DATABASE_URL', 'postgresql://localhost/test_db')

class ProductionConfig(Config):
    """Configuration for production deployment."""
    DEBUG = False
    TESTING = False

config_by_name = {
    'dev': DevelopmentConfig,
    'test': TestingConfig,
    'prod': ProductionConfig
}

# Select configuration based on environment variable, defaulting to development
app_config = config_by_name.get(os.environ.get('FLASK_ENV', 'dev'))
