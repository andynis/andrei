-- Well-being Check-in Database Schema

-- Schools table
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classrooms table
CREATE TABLE IF NOT EXISTS classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50),
    teacher_name VARCHAR(255),
    teacher_email VARCHAR(255) NOT NULL,
    qr_code_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students (registered devices) table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 5 AND age <= 18),
    school_id UUID REFERENCES schools(id),
    parental_consent BOOLEAN DEFAULT FALSE,
    privacy_consent BOOLEAN DEFAULT FALSE,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Check-ins table
CREATE TABLE IF NOT EXISTS checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL REFERENCES students(app_id) ON DELETE CASCADE,
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

    -- Emotional indicators
    mood INTEGER NOT NULL CHECK (mood >= 0 AND mood <= 5),
    energy_level INTEGER NOT NULL CHECK (energy_level >= 0 AND energy_level <= 5),
    social_comfort INTEGER NOT NULL CHECK (social_comfort >= 0 AND social_comfort <= 5),

    -- Physical health
    feeling_okay BOOLEAN NOT NULL,
    symptoms JSONB DEFAULT '[]',

    -- Bullying indicators (NEW)
    bullying_indicators JSONB DEFAULT '{}',
    bullying_level INTEGER DEFAULT 0,
    bullying_risk_level VARCHAR(20) DEFAULT 'low', -- low, moderate, high, critical
    bullying_alert_sent BOOLEAN DEFAULT FALSE,

    -- Additional information
    additional_notes TEXT,

    -- Calculated score
    wellbeing_score INTEGER NOT NULL CHECK (wellbeing_score >= 0 AND wellbeing_score <= 100),

    -- Metadata
    student_age INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    alert_sent BOOLEAN DEFAULT FALSE,
    alert_sent_at TIMESTAMP,

    -- Indexes for faster queries
    INDEX idx_checkins_app_id (app_id),
    INDEX idx_checkins_classroom_id (classroom_id),
    INDEX idx_checkins_school_id (school_id),
    INDEX idx_checkins_timestamp (timestamp),
    INDEX idx_checkins_wellbeing_score (wellbeing_score),
    INDEX idx_checkins_bullying_risk_level (bullying_risk_level)
);

-- Teachers/Admin users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'teacher', -- 'teacher', 'admin', 'principal'
    school_id UUID REFERENCES schools(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Alerts log table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checkin_id UUID NOT NULL REFERENCES checkins(id) ON DELETE CASCADE,
    app_id UUID NOT NULL REFERENCES students(app_id),
    classroom_id UUID NOT NULL REFERENCES classrooms(id),
    teacher_email VARCHAR(255) NOT NULL,
    wellbeing_score INTEGER NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'failed', 'pending'
    error_message TEXT
);

-- Data retention audit log
CREATE TABLE IF NOT EXISTS data_retention_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    records_affected INTEGER,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_students_app_id ON students(app_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_school_id ON classrooms(school_id);
CREATE INDEX IF NOT EXISTS idx_alerts_checkin_id ON alerts(checkin_id);
CREATE INDEX IF NOT EXISTS idx_alerts_sent_at ON alerts(sent_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classrooms_updated_at BEFORE UPDATE ON classrooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for data retention (auto-delete old records)
CREATE OR REPLACE FUNCTION cleanup_old_checkins()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
    retention_days INTEGER := 365; -- Default 1 year
BEGIN
    DELETE FROM checkins
    WHERE timestamp < CURRENT_TIMESTAMP - (retention_days || ' days')::INTERVAL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    INSERT INTO data_retention_log (action, records_affected, details)
    VALUES ('auto_cleanup_checkins', deleted_count,
            jsonb_build_object('retention_days', retention_days));

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO wellbeing_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO wellbeing_user;
