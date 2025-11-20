-- Database Schema for HR Recruitment Dashboard

-- Users Table (HR Staff)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'recruiter', 'viewer')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Candidates Table
CREATE TABLE IF NOT EXISTS candidates (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    job_role VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('in_progress', 'accepted', 'rejected')),
    score INTEGER CHECK (score >= 0 AND score <= 100),
    resume_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    years_of_experience INTEGER,
    skills TEXT[],
    education VARCHAR(255),
    location VARCHAR(255),
    applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Candidate Action History
CREATE TABLE IF NOT EXISTS candidate_history (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    description TEXT,
    performed_by INTEGER REFERENCES users(id),
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interview Questions
CREATE TABLE IF NOT EXISTS interview_questions (
    id SERIAL PRIMARY KEY,
    job_role VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    category VARCHAR(100),
    difficulty VARCHAR(50) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    expected_answer TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job Requirements
CREATE TABLE IF NOT EXISTS job_requirements (
    id SERIAL PRIMARY KEY,
    job_role VARCHAR(255) NOT NULL,
    requirement_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    is_mandatory BOOLEAN DEFAULT true,
    minimum_years_experience INTEGER,
    required_skills TEXT[],
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Candidate Documents
CREATE TABLE IF NOT EXISTS candidate_documents (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INTEGER,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_job_role ON candidates(job_role);
CREATE INDEX idx_candidates_applied_date ON candidates(applied_date);
CREATE INDEX idx_candidate_history_candidate_id ON candidate_history(candidate_id);
CREATE INDEX idx_interview_questions_job_role ON interview_questions(job_role);
CREATE INDEX idx_job_requirements_job_role ON job_requirements(job_role);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_questions_updated_at BEFORE UPDATE ON interview_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_requirements_updated_at BEFORE UPDATE ON job_requirements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
