-- Job Application Tracker Schema (PostgreSQL)

-- Create custom type for application status
-- This ensures the status column only accepts valid state machine values
DO $$ BEGIN
    CREATE TYPE application_status AS ENUM (
        'APPLIED', 
        'SCREENING', 
        'INTERVIEWING', 
        'OFFERED', 
        'ACCEPTED', 
        'REJECTED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    company VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    applied_on DATE DEFAULT CURRENT_DATE,
    status application_status DEFAULT 'APPLIED' NOT NULL,
    notes TEXT,
    interview_intel TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Status History Table (Audit Trail)
CREATE TABLE IF NOT EXISTS status_history (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    from_status application_status,
    to_status application_status NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    note TEXT
);

-- Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    email VARCHAR(255),
    linkedin VARCHAR(255)
);

-- Automatically update the updated_at column on change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
