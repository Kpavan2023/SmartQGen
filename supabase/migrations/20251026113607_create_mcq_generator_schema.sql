/*
  # Smart AI MCQ Generator Database Schema

  ## Overview
  Complete database schema for the AI-powered MCQ generation and quiz evaluation system.

  ## New Tables
  
  ### 1. `uploaded_files`
  Stores information about uploaded educational materials
  - `id` (uuid, primary key)
  - `user_id` (uuid, optional for anonymous users)
  - `file_name` (text)
  - `file_type` (text) - pdf, docx, txt
  - `file_size` (bigint)
  - `storage_path` (text) - Supabase storage path
  - `extracted_text` (text) - Extracted content
  - `upload_date` (timestamptz)
  - `processing_status` (text) - pending, processing, completed, failed

  ### 2. `generated_questions`
  Stores AI-generated MCQ questions
  - `id` (uuid, primary key)
  - `file_id` (uuid, foreign key to uploaded_files)
  - `question_text` (text)
  - `option_a` (text)
  - `option_b` (text)
  - `option_c` (text)
  - `option_d` (text)
  - `correct_answer` (text) - A, B, C, or D
  - `explanation` (text)
  - `difficulty_level` (text) - Easy, Medium, Hard
  - `blooms_taxonomy` (text) - Remember, Understand, Apply, Analyze, Evaluate, Create
  - `topic` (text)
  - `generated_date` (timestamptz)

  ### 3. `quiz_sessions`
  Tracks individual quiz attempts
  - `id` (uuid, primary key)
  - `user_id` (uuid, optional)
  - `file_id` (uuid, foreign key)
  - `session_name` (text)
  - `total_questions` (integer)
  - `start_time` (timestamptz)
  - `end_time` (timestamptz)
  - `status` (text) - in_progress, completed

  ### 4. `quiz_responses`
  Stores user answers and evaluations
  - `id` (uuid, primary key)
  - `session_id` (uuid, foreign key to quiz_sessions)
  - `question_id` (uuid, foreign key to generated_questions)
  - `user_answer` (text) - A, B, C, or D
  - `is_correct` (boolean)
  - `time_taken` (integer) - seconds
  - `answered_at` (timestamptz)

  ### 5. `export_history`
  Tracks exported documents
  - `id` (uuid, primary key)
  - `session_id` (uuid, foreign key)
  - `export_type` (text) - questions_only, results_with_answers
  - `file_format` (text) - pdf, docx
  - `exported_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Allow public read/write for demo purposes (can be restricted with auth)
*/

-- Create uploaded_files table
CREATE TABLE IF NOT EXISTS uploaded_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  storage_path text,
  extracted_text text,
  upload_date timestamptz DEFAULT now(),
  processing_status text DEFAULT 'pending'
);

ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to uploaded_files"
  ON uploaded_files
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create generated_questions table
CREATE TABLE IF NOT EXISTS generated_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid REFERENCES uploaded_files(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer text NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation text,
  difficulty_level text CHECK (difficulty_level IN ('Easy', 'Medium', 'Hard')),
  blooms_taxonomy text CHECK (blooms_taxonomy IN ('Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create')),
  topic text,
  generated_date timestamptz DEFAULT now()
);

ALTER TABLE generated_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to generated_questions"
  ON generated_questions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create quiz_sessions table
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  file_id uuid REFERENCES uploaded_files(id) ON DELETE CASCADE,
  session_name text,
  total_questions integer DEFAULT 0,
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed'))
);

ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to quiz_sessions"
  ON quiz_sessions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create quiz_responses table
CREATE TABLE IF NOT EXISTS quiz_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id uuid REFERENCES generated_questions(id) ON DELETE CASCADE,
  user_answer text CHECK (user_answer IN ('A', 'B', 'C', 'D')),
  is_correct boolean,
  time_taken integer,
  answered_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to quiz_responses"
  ON quiz_responses
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create export_history table
CREATE TABLE IF NOT EXISTS export_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  export_type text CHECK (export_type IN ('questions_only', 'results_with_answers')),
  file_format text CHECK (file_format IN ('pdf', 'docx')),
  exported_at timestamptz DEFAULT now()
);

ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to export_history"
  ON export_history
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_questions_file_id ON generated_questions(file_id);
CREATE INDEX IF NOT EXISTS idx_sessions_file_id ON quiz_sessions(file_id);
CREATE INDEX IF NOT EXISTS idx_responses_session_id ON quiz_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_question_id ON quiz_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_export_session_id ON export_history(session_id);
