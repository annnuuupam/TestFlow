-- =======================================
-- Online Test System - MySQL Schema
-- =======================================

CREATE DATABASE IF NOT EXISTS ots_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ots_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('ADMIN', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Exams (Tests) table
CREATE TABLE IF NOT EXISTS exams (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 60,
    total_marks INT NOT NULL DEFAULT 100,
    passing_marks INT NOT NULL DEFAULT 40,
    negative_marking BOOLEAN NOT NULL DEFAULT FALSE,
    negative_marks_per_wrong DECIMAL(5,2) DEFAULT 0.25,
    start_time DATETIME,
    end_time DATETIME,
    status ENUM('DRAFT', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'DISABLED') NOT NULL DEFAULT 'DRAFT',
    is_randomized BOOLEAN NOT NULL DEFAULT TRUE,
    max_attempts INT DEFAULT 1,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Sections table
CREATE TABLE IF NOT EXISTS sections (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    exam_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    section_type ENUM('APTITUDE', 'MCQ', 'CODING', 'MULTI_SELECT') NOT NULL DEFAULT 'MCQ',
    marks_per_question INT NOT NULL DEFAULT 1,
    display_order INT NOT NULL DEFAULT 0,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    section_id BIGINT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('MCQ', 'MULTI_SELECT', 'CODING', 'TRUE_FALSE') NOT NULL DEFAULT 'MCQ',
    marks INT NOT NULL DEFAULT 1,
    explanation TEXT,
    difficulty ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL DEFAULT 'MEDIUM',
    display_order INT NOT NULL DEFAULT 0,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
);

-- Options table (for MCQ / MULTI_SELECT questions)
CREATE TABLE IF NOT EXISTS options (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    question_id BIGINT NOT NULL,
    option_text VARCHAR(500) NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Test Attempts
CREATE TABLE IF NOT EXISTS test_attempts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    exam_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    status ENUM('IN_PROGRESS', 'SUBMITTED', 'TIMED_OUT', 'ABANDONED') NOT NULL DEFAULT 'IN_PROGRESS',
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    score DECIMAL(10,2) DEFAULT 0,
    total_marks INT DEFAULT 0,
    correct_count INT DEFAULT 0,
    wrong_count INT DEFAULT 0,
    unanswered_count INT DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    time_taken_seconds INT DEFAULT 0,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Attempt Answers (per-question answers in an attempt)
CREATE TABLE IF NOT EXISTS attempt_answers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    attempt_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    selected_option_ids TEXT,   -- comma-separated option IDs for MCQ/MULTI_SELECT
    text_answer TEXT,           -- for CODING questions
    is_correct BOOLEAN,
    marks_obtained DECIMAL(5,2) DEFAULT 0,
    is_marked_for_review BOOLEAN DEFAULT FALSE,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user ON test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_exam ON test_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_questions_section ON questions(section_id);
CREATE INDEX IF NOT EXISTS idx_options_question ON options(question_id);
