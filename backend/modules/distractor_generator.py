import torch
from transformers import T5ForConditionalGeneration, T5Tokenizer
import logging

logger = logging.getLogger("distractor_generator")
logger.setLevel(logging.INFO)


class DistractorGenerator:

    def __init__(self):
        logger.info("🔹 Loading DistractorGenerator model...")

        self.device = 0 if torch.cuda.is_available() else -1

        model_path = "./MCQ_MODEL_Check/Dis_Model/dis_merged"

        try:
            self.tokenizer = T5Tokenizer.from_pretrained(model_path, local_files_only=True)
            self.model = T5ForConditionalGeneration.from_pretrained(model_path, local_files_only=True)

            if self.device >= 0:
                self.model = self.model.to(f"cuda:{self.device}")

            logger.info("✅ Distractor model loaded successfully.")

        except Exception as e:
            logger.error(f"❌ Failed to load distractor model: {str(e)}")
            self.model = None
            self.tokenizer = None


    def generate(self, question: str, answer: str, context: str, num=3):

        if not self.model:
            return []

        try:

            prompt = (
                f"question: {question} "
                f"answer: {answer} "
                f"context: {context}"
            )

            inputs = self.tokenizer(
                prompt,
                return_tensors="pt",
                truncation=True,
                max_length=256
            )

            if self.device >= 0:
                inputs = {k: v.to(f"cuda:{self.device}") for k, v in inputs.items()}

            outputs = self.model.generate(
                **inputs,
                max_length=80,
                num_beams=4,
                num_return_sequences=num,
                temperature=0.9,
                do_sample=True,
                top_k=40,
            )

            distractors = [
                self.tokenizer.decode(o, skip_special_tokens=True).strip()
                for o in outputs
            ]

            return list(set(distractors))[:num]

        except Exception as e:
            logger.error(f"❌ Distractor generation failed: {str(e)}")
            return []
