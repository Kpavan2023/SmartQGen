import { useState, useEffect } from 'react';
import { Brain, AlertCircle } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { QuestionGenerator } from './components/QuestionGenerator';
import { QuizInterface } from './components/QuizInterface';
import { ResultsDisplay } from './components/ResultsDisplay';
import { apiService, QuizResult } from './services/api';

type AppState = 'upload' | 'generate' | 'quiz' | 'results';

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  difficulty_level?: string;
  blooms_taxonomy?: string;
}

function App() {
  const [state, setState] = useState<AppState>('upload');
  const [fileId, setFileId] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [results, setResults] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<boolean | null>(null);

  // ✅ Properly check backend status when app starts
  useEffect(() => {
    const checkBackendStatus = async () => {
      const status = await apiService.checkHealth();
      setBackendStatus(status);
    };
    checkBackendStatus();
  }, []);

  const handleFileUploaded = (id: string, name: string) => {
    setFileId(id);
    setFileName(name);
    setState('generate');
    setError(null);
  };

  const handleQuestionsGenerated = (generatedQuestions: Question[], sessionId: string) => {
    setQuestions(generatedQuestions);
    setSessionId(sessionId);
    setState('quiz');
    setError(null);
  };

  const handleQuizSubmit = async (answers: Record<string, string>) => {
    try {
      const response = await apiService.submitQuiz(sessionId, answers);

      if (response.success && response.data) {
        setResults(response.data);
        setState('results');
        setError(null);
      } else {
        setError(response.error || 'Failed to submit quiz');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quiz');
    }
  };

  const handleRestart = () => {
    setFileId('');
    setFileName('');
    setQuestions([]);
    setSessionId('');
    setResults(null);
    setError(null);
    setState('upload');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Smart AI MCQ Generator
                </h1>
                <p className="text-sm text-gray-600">
                  AI-Powered Question Generation & Evaluation System
                </p>
              </div>
            </div>
            {state !== 'upload' && (
              <button
                onClick={handleRestart}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Start New Quiz
              </button>
            )}
          </div>
        </div>
      </header>

      {backendStatus === false && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                Backend Server Not Connected
              </h3>
              <p className="text-sm text-yellow-700">
                The FastAPI backend server is not running. Please start it with:{' '}
                <code className="bg-yellow-100 px-2 py-1 rounded">
                  cd backend && python main.py
                </code>
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-12">
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start space-x-3 animate-fade-in">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}

        <div className="animate-fade-in">
          {state === 'upload' && <FileUpload onFileUploaded={handleFileUploaded} />}

          {state === 'generate' && (
            <QuestionGenerator
              fileId={fileId}
              fileName={fileName}
              onQuestionsGenerated={handleQuestionsGenerated}
            />
          )}

          {state === 'quiz' && (
            <QuizInterface
              questions={questions}
              sessionId={sessionId}
              onSubmit={handleQuizSubmit}
            />
          )}

          {state === 'results' && results && (
            <ResultsDisplay
              sessionId={sessionId}
              totalQuestions={results.total_questions}
              correctAnswers={results.correct_answers}
              incorrectAnswers={results.incorrect_answers}
              percentage={results.percentage}
              results={results.results}
              onRestart={handleRestart}
            />
          )}
        </div>
      </main>

      <footer className="mt-20 border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">
              Smart AI MCQ Generator - Powered by T5 and RoBERTa AI Models
            </p>
            <p className="text-xs text-gray-500">
              Upload educational content • Generate questions with AI • Take quiz • Get instant results
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
