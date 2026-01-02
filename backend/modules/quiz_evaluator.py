"""
Quiz Evaluator Module
Evaluates quiz responses and generates detailed feedback
Robust, deterministic grading to avoid mismatches between percent -> grade.
"""

import logging
from typing import List, Dict

logger = logging.getLogger("quiz_evaluator")
logger.setLevel(logging.INFO)


class QuizEvaluator:
    """Evaluates quiz responses and provides detailed feedback"""

    # =====================================================================
    # Evaluate a Single Question
    # =====================================================================
    def evaluate_response(
        self,
        user_answer: str,
        correct_answer: str,
        question: Dict
    ) -> Dict:
        """
        Evaluate a single quiz response

        Args:
            user_answer: User's selected option (A, B, C, D)
            correct_answer: Correct option (A, B, C, D)
            question: Question dictionary

        Returns:
            Evaluation result dictionary
        """
        is_correct = user_answer == correct_answer

        return {
            "is_correct": is_correct,
            "user_answer": user_answer,
            "correct_answer": correct_answer,
            # keep compatibility with different question record shapes
            "question_text": question.get("question_text", question.get("question", "")),
            "explanation": question.get("explanation", ""),
            "difficulty": question.get("difficulty", question.get("difficulty_level", "Medium")),
            "blooms_level": question.get("blooms_taxonomy", "Understand")
        }

    # =====================================================================
    # Calculate Overall Score (robust)
    # =====================================================================
    def calculate_score(self, responses: List[Dict]) -> Dict:
        """
        Calculate overall quiz score and statistics.

        Important:
        - Uses raw_percentage (unrounded) to compute grade to avoid precision issues.
        - Returns both raw_percentage and rounded percentage for display.
        """
        total = len(responses)
        correct = sum(1 for r in responses if r.get("is_correct", False))
        incorrect = total - correct

        raw_percentage = (correct / total * 100) if total > 0 else 0.0
        percentage = round(raw_percentage, 2)

        difficulty_stats = self._calculate_difficulty_stats(responses)
        blooms_stats = self._calculate_blooms_stats(responses)

        grade = self._assign_grade(raw_percentage)  # assign by raw number (not rounded)

        # debug logger to help you see what's happening
        logger.info(f"Quiz results: total={total}, correct={correct}, raw_pct={raw_percentage}, rounded_pct={percentage}, grade={grade}")

        return {
            "total_questions": total,
            "correct_answers": correct,
            "incorrect_answers": incorrect,
            "raw_percentage": raw_percentage,     # unrounded — used for deterministic grading
            "percentage": percentage,             # rounded for display
            "grade": grade,
            "difficulty_stats": difficulty_stats,
            "blooms_stats": blooms_stats
        }

    # =====================================================================
    # Difficulty Stats
    # =====================================================================
    def _calculate_difficulty_stats(self, responses: List[Dict]) -> Dict:
        stats = {
            "Easy": {"correct": 0, "total": 0},
            "Medium": {"correct": 0, "total": 0},
            "Hard": {"correct": 0, "total": 0}
        }

        for r in responses:
            diff = r.get("difficulty", "Medium")
            if diff not in stats:
                diff = "Medium"

            stats[diff]["total"] += 1
            if r.get("is_correct", False):
                stats[diff]["correct"] += 1

        # compute percentages safely
        for level in stats:
            t = stats[level]["total"]
            if t > 0:
                stats[level]["percentage"] = round(stats[level]["correct"] / t * 100, 2)
            else:
                stats[level]["percentage"] = 0.0

        return stats

    # =====================================================================
    # Bloom's Taxonomy Stats
    # =====================================================================
    def _calculate_blooms_stats(self, responses: List[Dict]) -> Dict:
        stats = {}

        for r in responses:
            level = r.get("blooms_level", "Understand")
            if level not in stats:
                stats[level] = {"correct": 0, "total": 0}

            stats[level]["total"] += 1
            if r.get("is_correct", False):
                stats[level]["correct"] += 1

        # compute %
        for level in stats:
            t = stats[level]["total"]
            stats[level]["percentage"] = round(
                (stats[level]["correct"] / t * 100), 2
            ) if t > 0 else 0.0

        return stats

    # =====================================================================
    # Grade Assignment (Your Custom Scale — deterministic)
    # =====================================================================
    def _assign_grade(self, raw_percentage: float) -> str:
        """
        Assign letter grade based on raw (unrounded) percentage.

        Scale:
          >= 93 -> "S"
          >= 85 -> "A"
          >= 75 -> "B"
          >= 60 -> "C"
          >= 35 -> "D"
          else   -> "F"
        """
        try:
            pct = float(raw_percentage)
        except Exception:
            pct = 0.0

        if pct >= 93.0:
            return "S"
        elif pct >= 85.0:
            return "A"
        elif pct >= 75.0:
            return "B"
        elif pct >= 60.0:
            return "C"
        elif pct >= 35.0:
            return "D"
        else:
            return "F"

    # =====================================================================
    # Feedback Message (Aligned with Grade System)
    # =====================================================================
    def generate_feedback(self, score_stats: Dict) -> str:
        """
        Generate a user-facing feedback string. Uses the stored (already computed) 'percentage' and 'grade'.
        """
        # prefer the rounded display percentage for the message, but use grade from score_stats
        percentage = score_stats.get("percentage", 0.0)
        grade = score_stats.get("grade", self._assign_grade(score_stats.get("raw_percentage", percentage)))

        # Compose feedback according to grade
        if grade == "S":
            feedback = f"Outstanding performance! You scored {percentage}% (Grade: S). You have mastered the concepts exceptionally well."
        elif grade == "A":
            feedback = f"Excellent work! You scored {percentage}% (Grade: A). You show a strong understanding of the material."
        elif grade == "B":
            feedback = f"Good job! You scored {percentage}% (Grade: B). You have a solid grasp of most concepts."
        elif grade == "C":
            feedback = f"Fair performance. You scored {percentage}% (Grade: C). Some areas need review — check the explanations."
        elif grade == "D":
            feedback = f"You scored {percentage}% (Grade: D). Review the material and practice more to improve."
        else:  # F
            feedback = f"You scored {percentage}% (Grade: F). Consider revisiting the material and taking the quiz again."

        # Add targeted advice if hard questions were weak
        hard_stats = score_stats.get("difficulty_stats", {}).get("Hard", {})
        if hard_stats.get("total", 0) > 0 and hard_stats.get("percentage", 100) < 50:
            feedback += " You struggled with hard questions — focus on advanced topics to improve."

        return feedback
