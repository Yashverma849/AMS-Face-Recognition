-- Drop existing tables with cascade to remove dependencies
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS attendance_sessions CASCADE;
DROP TABLE IF EXISTS students CASCADE;

-- Create Students table
CREATE TABLE students (
    id VARCHAR PRIMARY KEY,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    phone VARCHAR,
    batch VARCHAR,
    semester VARCHAR,
    department VARCHAR,
    image_url VARCHAR,  -- URL to the student's image in Supabase Storage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    face_encoding BYTEA  -- Binary data for face encoding
);

-- Create Attendance Sessions table
CREATE TABLE attendance_sessions (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    course VARCHAR NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create Attendance Records table (join table)
CREATE TABLE attendance_records (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR REFERENCES attendance_sessions(id),
    student_id VARCHAR REFERENCES students(id),
    status VARCHAR NOT NULL,
    confidence FLOAT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    image_url VARCHAR,  -- URL to the attendance image in Supabase Storage
    UNIQUE(session_id, student_id)
);

-- Create index for faster queries
CREATE INDEX idx_attendance_session ON attendance_records(session_id);
CREATE INDEX idx_attendance_student ON attendance_records(student_id); 