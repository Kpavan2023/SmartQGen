import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Award,
  Download,
  BarChart3,
  FileText,
} from 'lucide-react';

interface ResultItem {
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
}

interface ResultsDisplayProps {
  sessionId: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  percentage: number;
  results: ResultItem[];
  onRestart: () => void;
}

export function ResultsDisplay({
  sessionId,
  totalQuestions,
  correctAnswers,
  incorrectAnswers,
  percentage,
  results,
  onRestart,
}: ResultsDisplayProps) {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const getGrade = () => {
    if (percentage >= 93) return { grade: 'S', color: 'text-green-600', bg: 'bg-green-50' };
    if (percentage >= 85) return { grade: 'A', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (percentage >= 75) return { grade: 'B', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (percentage >= 60) return { grade: 'C', color: 'text-orange-600', bg: 'bg-orange-50' };
    if (percentage >= 35) return { grade: 'D', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { grade: 'F', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const gradeInfo = getGrade();

  const handleExport = async (
    exportType: 'questions_only' | 'results_with_answers',
    format: 'pdf' | 'docx'
  ) => {
    setIsExporting(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const formData = new FormData();
      formData.append('session_id', sessionId);
      formData.append('export_type', exportType);
      formData.append('file_format', format);

      const response = await fetch(`${apiUrl}/api/export`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quiz_${exportType}_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Award className="h-12 w-12" />
            <h2 className="text-3xl font-bold">Quiz Complete!</h2>
          </div>
          <div className={`text-6xl font-bold ${gradeInfo.color} bg-white rounded-lg px-6 py-3`}>
            {gradeInfo.grade}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-sm opacity-80 mb-1">Score</p>
            <p className="text-3xl font-bold">{percentage.toFixed(1)}%</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-sm opacity-80 mb-1">Correct</p>
            <p className="text-3xl font-bold text-green-300">{correctAnswers}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-sm opacity-80 mb-1">Incorrect</p>
            <p className="text-3xl font-bold text-red-300">{incorrectAnswers}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleExport('results_with_answers', 'pdf')}
            disabled={isExporting}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export Results (PDF)</span>
          </button>
          <button
            onClick={() => handleExport('results_with_answers', 'docx')}
            disabled={isExporting}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Export Results (DOCX)</span>
          </button>
          <button
            onClick={onRestart}
            className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-colors"
          >
            Start New Quiz
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-800">Detailed Results</h3>
        </div>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={result.question_id}
              className="border-2 rounded-lg overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() =>
                  setExpandedQuestion(
                    expandedQuestion === result.question_id ? null : result.question_id
                  )
                }
                className={`
                  w-full p-4 flex items-start space-x-4 text-left transition-colors
                  ${
                    result.is_correct
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }
                  hover:opacity-80
                `}
              >
                <div className="flex-shrink-0 mt-1">
                  {result.is_correct ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 mb-1">
                    Question {index + 1}
                  </p>
                  <p className="text-gray-700">{result.question_text}</p>
                </div>
                <div className="flex-shrink-0">
                  <span
                    className={`
                    text-sm font-semibold px-3 py-1 rounded-full
                    ${
                      result.is_correct
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                    }
                  `}
                  >
                    {result.is_correct ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
              </button>

              {expandedQuestion === result.question_id && (
                <div className="p-6 bg-white border-t-2">
                  <div className="space-y-3 mb-4">
                    {['A', 'B', 'C', 'D'].map((option) => {
                      const isUserAnswer = result.user_answer === option;
                      const isCorrect = result.correct_answer === option;

                      return (
                        <div
                          key={option}
                          className={`
                            p-3 rounded-lg border-2 transition-all
                            ${
                              isCorrect
                                ? 'border-green-500 bg-green-50'
                                : isUserAnswer
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-200 bg-gray-50'
                            }
                          `}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-gray-700">{option}.</span>
                            <span className="text-gray-800">
                              {result.options[option as keyof typeof result.options]}
                            </span>
                            {isCorrect && (
                              <CheckCircle className="ml-auto h-5 w-5 text-green-600" />
                            )}
                            {isUserAnswer && !isCorrect && (
                              <XCircle className="ml-auto h-5 w-5 text-red-600" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {result.explanation && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-blue-800 mb-2">
                        Explanation:
                      </p>
                      <p className="text-sm text-blue-700">{result.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
