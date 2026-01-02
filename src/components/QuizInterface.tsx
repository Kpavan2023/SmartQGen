import { useState } from 'react';
import { CheckCircle, Clock, Send, Download } from 'lucide-react';

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

interface QuizInterfaceProps {
  questions: Question[];
  sessionId: string;
  onSubmit: (answers: Record<string, string>) => void;
}

export function QuizInterface({ questions, sessionId, onSubmit }: QuizInterfaceProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startTime] = useState(Date.now());
  const [exporting, setExporting] = useState(false);

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    const unanswered = questions.filter((q) => !answers[q.id]);

    if (unanswered.length > 0) {
      const confirm = window.confirm(
        `You have ${unanswered.length} unanswered question(s). Submit anyway?`
      );
      if (!confirm) return;
    }

    onSubmit(answers);
  };

  // ✅ EXPORT QUESTIONS-ONLY (PDF or DOCX)
  const handleExportQuestions = async (format: "pdf" | "docx") => {
    try {
      setExporting(true);

      const formData = new FormData();
      formData.append("session_id", sessionId);
      formData.append("export_type", "questions_only");
      formData.append("file_format", format);

      const response = await fetch("http://localhost:8000/api/export", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        alert("Export failed!");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `questions_${sessionId}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error exporting questions.");
    } finally {
      setExporting(false);
    }
  };

  const question = questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;
  const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000);

  const getDifficultyColor = (level?: string) => {
    switch (level) {
      case "Easy":
        return "text-green-600 bg-green-50";
      case "Medium":
        return "text-yellow-600 bg-yellow-50";
      case "Hard":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">

        {/* ✅ HEADER WITH EXPORT BUTTON */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Quiz in Progress</h2>

            {/* ✅ EXPORT BUTTON */}
            <button
              disabled={exporting}
              onClick={() => handleExportQuestions("pdf")}
              className="flex items-center px-4 py-2 bg-white/20 backdrop-blur-md rounded-lg text-sm hover:bg-white/30 transition space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>{exporting ? "Exporting..." : "Export Questions"}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span className="text-sm">{elapsedMinutes} min</span>
          </div>

          <div className="space-y-2 mt-3">
            <div className="flex justify-between text-sm">
              <span>
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span>
                Answered: {answeredCount}/{questions.length}
              </span>
            </div>
            <div className="w-full bg-blue-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* QUESTION */}
        <div className="p-8">
          <div className="mb-6 flex items-center space-x-2">
            {question.difficulty_level && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(
                  question.difficulty_level
                )}`}
              >
                {question.difficulty_level}
              </span>
            )}

            {question.blooms_taxonomy && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold text-blue-600 bg-blue-50">
                {question.blooms_taxonomy}
              </span>
            )}
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mb-6">
            {question.question_text}
          </h3>

          <div className="space-y-3">
            {["A", "B", "C", "D"].map((option) => {
              const optionKey = `option_${option.toLowerCase()}` as keyof Question;
              const optionText = question[optionKey] as string;
              const isSelected = answers[question.id] === option;

              return (
                <button
                  key={option}
                  onClick={() => handleAnswer(question.id, option)}
                  className={`
                    w-full p-4 text-left rounded-lg border-2 transition-all duration-300
                    ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 shadow-md transform scale-105"
                        : "border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50"
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`
                        flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold
                        ${
                          isSelected
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-gray-300 text-gray-600"
                        }
                      `}
                    >
                      {option}
                    </div>

                    <span
                      className={`${
                        isSelected ? "text-gray-900 font-medium" : "text-gray-700"
                      }`}
                    >
                      {optionText}
                    </span>

                    {isSelected && (
                      <CheckCircle className="ml-auto h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* NAVIGATION */}
        <div className="bg-gray-50 px-8 py-4 flex items-center justify-between border-t">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className={`
              px-6 py-2 rounded-lg font-medium transition-colors
              ${
                currentQuestion === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-200"
              }
            `}
          >
            Previous
          </button>

          <div className="flex items-center space-x-2">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`
                  w-8 h-8 rounded-full text-xs font-semibold transition-all
                  ${
                    idx === currentQuestion
                      ? "bg-blue-600 text-white scale-110"
                      : answers[questions[idx].id]
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }
                `}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Submit Quiz</span>
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
