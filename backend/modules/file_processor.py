"""
File Processor Module
Handles extraction of text from various file formats (PDF, DOCX, TXT)
"""

import PyPDF2
from docx import Document
import re
from typing import Optional


class FileProcessor:
    """Extracts and processes text from uploaded files"""

    def extract_text(self, file_path: str, file_type: str) -> str:
        """
        Extract text from file based on type

        Args:
            file_path: Path to the uploaded file
            file_type: File extension (.pdf, .docx, .txt)

        Returns:
            Extracted and cleaned text
        """
        if file_type == ".pdf":
            return self._extract_from_pdf(file_path)
        elif file_type == ".docx":
            return self._extract_from_docx(file_path)
        elif file_type == ".txt":
            return self._extract_from_txt(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

    def _extract_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        text = ""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            raise Exception(f"PDF extraction failed: {str(e)}")

        return self._clean_text(text)

    def _extract_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        text = ""
        try:
            doc = Document(file_path)
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
        except Exception as e:
            raise Exception(f"DOCX extraction failed: {str(e)}")

        return self._clean_text(text)

    def _extract_from_txt(self, file_path: str) -> str:
        """Extract text from TXT file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
        except UnicodeDecodeError:
            # Try with different encoding
            with open(file_path, 'r', encoding='latin-1') as file:
                text = file.read()
        except Exception as e:
            raise Exception(f"TXT extraction failed: {str(e)}")

        return self._clean_text(text)

    def _clean_text(self, text: str) -> str:
        """
        Clean and normalize extracted text
        - Remove excessive whitespace
        - Fix line breaks
        - Remove special characters that might interfere with processing
        """
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)

        # Remove non-printable characters except newlines
        text = re.sub(r'[^\x20-\x7E\n]', '', text)

        # Fix multiple newlines
        text = re.sub(r'\n\s*\n', '\n\n', text)

        # Strip leading/trailing whitespace
        text = text.strip()

        return text

    def split_into_chunks(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> list:
        """
        Split text into overlapping chunks for better question generation

        Args:
            text: Input text to split
            chunk_size: Maximum characters per chunk
            overlap: Number of overlapping characters between chunks

        Returns:
            List of text chunks
        """
        chunks = []
        sentences = text.split('. ')

        current_chunk = ""
        for sentence in sentences:
            if len(current_chunk) + len(sentence) < chunk_size:
                current_chunk += sentence + ". "
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())

                # Keep last part for overlap
                words = current_chunk.split()
                overlap_text = " ".join(words[-overlap:]) if len(words) > overlap else ""
                current_chunk = overlap_text + " " + sentence + ". "

        if current_chunk:
            chunks.append(current_chunk.strip())

        return chunks
