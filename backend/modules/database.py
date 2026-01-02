"""
Database Module - Supabase Client
Handles all database operations for the MCQ generator
"""

import os
from supabase import create_client, Client
from typing import Optional, List, Dict
from datetime import datetime


class SupabaseClient:
    """Manages all Supabase database operations"""

    def __init__(self):
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")

        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment")

        self.client: Client = create_client(supabase_url, supabase_key)

    async def create_file_record(
        self,
        file_id: str,
        user_id: Optional[str],
        file_name: str,
        file_type: str,
        file_size: int,
        storage_path: str,
        extracted_text: str
    ) -> Dict:
        """Create a new file record in the database"""
        data = {
            "id": file_id,
            "user_id": user_id,
            "file_name": file_name,
            "file_type": file_type,
            "file_size": file_size,
            "storage_path": storage_path,
            "extracted_text": extracted_text,
            "processing_status": "pending"
        }

        response = self.client.table("uploaded_files").insert(data).execute()
        return response.data[0] if response.data else None

    async def get_file(self, file_id: str) -> Optional[Dict]:
        """Get file record by ID"""
        response = self.client.table("uploaded_files").select("*").eq("id", file_id).execute()
        return response.data[0] if response.data else None

    async def get_all_files(self, user_id: Optional[str] = None) -> List[Dict]:
        """Get all files, optionally filtered by user"""
        query = self.client.table("uploaded_files").select("*").order("upload_date", desc=True)

        if user_id:
            query = query.eq("user_id", user_id)

        response = query.execute()
        return response.data if response.data else []

    async def update_file_status(self, file_id: str, status: str) -> None:
        """Update file processing status"""
        self.client.table("uploaded_files").update({
            "processing_status": status
        }).eq("id", file_id).execute()

    async def create_question(self, file_id: str, question_data: Dict) -> str:
        """Create a new question record"""
        data = {
            "file_id": file_id,
            "question_text": question_data["question"],
            "option_a": question_data["options"]["A"],
            "option_b": question_data["options"]["B"],
            "option_c": question_data["options"]["C"],
            "option_d": question_data["options"]["D"],
            "correct_answer": question_data["correct_answer"],
            "explanation": question_data.get("explanation", ""),
            "difficulty_level": question_data.get("difficulty", "Medium"),
            "blooms_taxonomy": question_data.get("blooms_taxonomy", "Understand"),
            "topic": question_data.get("topic", "")
        }

        response = self.client.table("generated_questions").insert(data).execute()
        return response.data[0]["id"] if response.data else None

    async def get_questions_by_file(self, file_id: str) -> List[Dict]:
        """Get all questions for a specific file"""
        response = self.client.table("generated_questions").select("*").eq(
            "file_id", file_id
        ).order("generated_date").execute()

        return response.data if response.data else []

    async def create_quiz_session(
        self,
        file_id: str,
        user_id: Optional[str],
        session_name: str,
        total_questions: int
    ) -> str:
        """Create a new quiz session"""
        data = {
            "file_id": file_id,
            "user_id": user_id,
            "session_name": session_name,
            "total_questions": total_questions,
            "status": "in_progress"
        }

        response = self.client.table("quiz_sessions").insert(data).execute()
        return response.data[0]["id"] if response.data else None

    async def get_quiz_session(self, session_id: str) -> Optional[Dict]:
        """Get quiz session by ID"""
        response = self.client.table("quiz_sessions").select("*").eq("id", session_id).execute()
        return response.data[0] if response.data else None

    async def complete_quiz_session(self, session_id: str) -> None:
        """Mark quiz session as completed"""
        self.client.table("quiz_sessions").update({
            "status": "completed",
            "end_time": datetime.utcnow().isoformat()
        }).eq("id", session_id).execute()

    async def create_quiz_response(
        self,
        session_id: str,
        question_id: str,
        user_answer: str,
        is_correct: bool
    ) -> str:
        """Record a quiz response"""
        data = {
            "session_id": session_id,
            "question_id": question_id,
            "user_answer": user_answer,
            "is_correct": is_correct
        }

        response = self.client.table("quiz_responses").insert(data).execute()
        return response.data[0]["id"] if response.data else None

    async def get_quiz_responses(self, session_id: str) -> List[Dict]:
        """Get all responses for a quiz session"""
        response = self.client.table("quiz_responses").select(
            "*, generated_questions(*)"
        ).eq("session_id", session_id).execute()

        return response.data if response.data else []

    async def create_export_record(
        self,
        session_id: str,
        export_type: str,
        file_format: str
    ) -> str:
        """Record an export operation"""
        data = {
            "session_id": session_id,
            "export_type": export_type,
            "file_format": file_format
        }

        response = self.client.table("export_history").insert(data).execute()
        return response.data[0]["id"] if response.data else None
