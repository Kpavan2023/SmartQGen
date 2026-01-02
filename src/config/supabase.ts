import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface UploadedFile {
  id: string;
  user_id?: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path?: string;
  extracted_text?: string;
  upload_date: string;
  processing_status: string;
}

export interface Question {
  id: string;
  file_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation?: string;
  difficulty_level?: string;
  blooms_taxonomy?: string;
  topic?: string;
  generated_date: string;
}

export interface QuizSession {
  id: string;
  user_id?: string;
  file_id: string;
  session_name?: string;
  total_questions: number;
  start_time: string;
  end_time?: string;
  status: string;
}

export interface QuizResponse {
  id: string;
  session_id: string;
  question_id: string;
  user_answer: string;
  is_correct: boolean;
  time_taken?: number;
  answered_at: string;
}
