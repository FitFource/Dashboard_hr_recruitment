CREATE EXTENSION IF NOT EXISTS pgcrypto;


CREATE TABLE candidate_profile(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    position_id BIGINT NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(255) NOT NULL,
    gender VARCHAR(255) NOT NULL,
	residence VARCHAR(1000),
    willing_wfo VARCHAR(255) NOT NULL,
    willing_to_work_tgr VARCHAR(255) NOT NULL,
    aboutme TEXT NOT NULL,
    education TEXT NOT NULL,
    working_exp TEXT NOT NULL,
    organization_exp TEXT NOT NULL,
    portofolio VARCHAR(255) NOT NULL,
    hard_skill TEXT NOT NULL,
    soft_skill TEXT NOT NULL,
    expected_salary BIGINT NOT NULL,
    current_salary BIGINT NOT NULL,
    cv_link VARCHAR(1000) NOT NULL,
    ai_reason TEXT NOT NULL,
    status BIGINT NOT NULL,
    source VARCHAR(255) NOT NULL,
    submit_date TIMESTAMP NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
	
CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'user', 'viewer')),
    password VARCHAR(255) NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
	
	
CREATE TABLE positions(
    id SERIAL PRIMARY KEY,
    position VARCHAR(255) NOT NULL,
    level VARCHAR(50) NOT NULL CHECK (level IN ('Associate', 'Middle', 'Senior','Lead','Manager')),
    technical_link VARCHAR(1000) NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE status(
    id SERIAL PRIMARY KEY,
    status VARCHAR(255) NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
	
CREATE TABLE job_requirements(
    id SERIAL PRIMARY KEY,
    position_id BIGINT NOT NULL,
    position_name VARCHAR(255) NOT NULL,
    position_vector FLOAT8[],
    position_level VARCHAR(50) NOT NULL,
    requirements_text TEXT NOT NULL,
    requirements_vector FLOAT8[] NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    upadated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE summary_candidate(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    position_id BIGINT NOT NULL,
    candidate_id BIGINT NOT NULL,
    email VARCHAR(255) NOT NULL,
    rank BIGINT NOT NULL,
    avg_score DOUBLE PRECISION,
    technical_score DOUBLE PRECISION,
    soft_skill_score DOUBLE PRECISION,
    relevance_to_role VARCHAR(255),
    summary_desc TEXT NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE interview_question(
    id SERIAL PRIMARY KEY,
    position_id BIGINT NOT NULL,
    position_level VARCHAR(255) NOT NULL,
    position_name VARCHAR(255) NOT NULL,
    position_vector FLOAT8[],
    question_text TEXT NOT NULL,
    question_vector FLOAT8[],
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE quick_call(
    id SERIAL PRIMARY KEY,
    candidate_id BIGINT NOT NULL,
    position_id BIGINT NOT NULL,
    session_id BIGINT NOT NULL,
    timestamps TIMESTAMP  NOT NULL,
    message TEXT NOT NULL,
    flag BIGINT NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE master(
    id SERIAL PRIMARY KEY,
    last_sync_date TIMESTAMP  NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE schedule_user_interview(
    id SERIAL PRIMARY KEY,
    candidate_id BIGINT NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    schedule TIMESTAMP NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE candidate(
    id SERIAL PRIMARY KEY,
    candidate_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    token VARCHAR(1000) NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_expired DATE NOT NULL
);

ALTER TABLE candidate 
    ADD CONSTRAINT candidate_candidate_id_foreign 
    FOREIGN KEY (candidate_id) REFERENCES candidate_profile(id);

ALTER TABLE interview_question 
    ADD CONSTRAINT interview_question_position_id_foreign 
    FOREIGN KEY (position_id) REFERENCES positions(id);

ALTER TABLE quick_call 
    ADD CONSTRAINT quick_call_candidate_id_foreign 
    FOREIGN KEY (candidate_id) REFERENCES candidate_profile(id);

ALTER TABLE summary_candidate 
    ADD CONSTRAINT summary_candidate_position_id_foreign 
    FOREIGN KEY (position_id) REFERENCES positions(id);

ALTER TABLE job_requirements 
    ADD CONSTRAINT job_requirements_position_id_foreign 
    FOREIGN KEY (position_id) REFERENCES positions(id);

ALTER TABLE schedule_user_interview 
    ADD CONSTRAINT schedule_user_interview_id_foreign 
    FOREIGN KEY (id) REFERENCES candidate_profile(id);

ALTER TABLE schedule_user_interview 
    ADD CONSTRAINT schedule_user_interview_candidate_id_foreign 
    FOREIGN KEY (candidate_id) REFERENCES users(id);

ALTER TABLE candidate_profile 
    ADD CONSTRAINT candidate_profile_status_foreign 
    FOREIGN KEY (status) REFERENCES status(id);

ALTER TABLE candidate_profile 
    ADD CONSTRAINT candidate_profile_position_id_foreign 
    FOREIGN KEY (position_id) REFERENCES positions(id);
