const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface GeneratedQuestion {
  id?: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
    correct: string;
  };
  correct_answer: string;
  explanation: string;
  difficulty: string;
  blooms_taxonomy: string;
  topic?: string;
}

export interface QuizResult {
  session_id: string;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  percentage: number;
  results: Array<{
    question_id: string;
    question_text: string;
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
    explanation: string;
    options: {
      A: string;
      B: string;
      C: string;
      D: string;
    };
  }>;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async uploadFile(file: File): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Upload failed');
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  async generateQuestions(
    fileId: string,
    numQuestions: number = 10,
    difficulty?: string
  ): Promise<ApiResponse<{ questions: GeneratedQuestion[] }>> {
    try {
      const formData = new FormData();
      formData.append('file_id', fileId);
      formData.append('num_questions', numQuestions.toString());
      if (difficulty) {
        formData.append('difficulty', difficulty);
      }

      const response = await fetch(`${this.baseUrl}/api/generate-questions`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Question generation failed');
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Question generation failed',
      };
    }
  }

  async createQuizSession(fileId: string, sessionName?: string): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      formData.append('file_id', fileId);
      if (sessionName) {
        formData.append('session_name', sessionName);
      }

      const response = await fetch(`${this.baseUrl}/api/create-quiz-session`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Session creation failed');
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session creation failed',
      };
    }
  }

  async submitQuiz(
    sessionId: string,
    answers: Record<string, string>
  ): Promise<ApiResponse<QuizResult>> {
    try {
      const formData = new FormData();
      formData.append('session_id', sessionId);
      formData.append('answers', JSON.stringify(answers));

      const response = await fetch(`${this.baseUrl}/api/submit-quiz`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Quiz submission failed');
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Quiz submission failed',
      };
    }
  }

  async exportResults(
    sessionId: string,
    exportType: 'questions_only' | 'results_with_answers',
    fileFormat: 'pdf' | 'docx' = 'pdf'
  ): Promise<Blob | null> {
    try {
      const formData = new FormData();
      formData.append('session_id', sessionId);
      formData.append('export_type', exportType);
      formData.append('file_format', fileFormat);

      const response = await fetch(`${this.baseUrl}/api/export`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      return await response.blob();
    } catch (error) {
      console.error('Export error:', error);
      return null;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const apiService = new ApiService();
