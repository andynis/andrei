"""
Document Parser Module
Parses PDF, DOC, DOCX, and plain text documents
"""

import os
import logging
from typing import Optional
import docx
import PyPDF2
import pdfplumber

logger = logging.getLogger(__name__)


class DocumentParser:
    """Parses various document formats to extract text content"""

    def __init__(self, max_file_size_mb: int = 10):
        self.max_file_size_bytes = max_file_size_mb * 1024 * 1024

    def parse_document(self, filepath: str) -> Optional[str]:
        """
        Parse document and extract text content

        Args:
            filepath: Path to the document file

        Returns:
            Extracted text content or None if parsing fails
        """
        if not os.path.exists(filepath):
            logger.error(f"File not found: {filepath}")
            return None

        # Check file size
        file_size = os.path.getsize(filepath)
        if file_size > self.max_file_size_bytes:
            logger.error(
                f"File too large: {file_size} bytes "
                f"(max: {self.max_file_size_bytes} bytes)"
            )
            return None

        # Determine file type and parse accordingly
        ext = os.path.splitext(filepath)[1].lower()

        try:
            if ext == '.pdf':
                return self._parse_pdf(filepath)
            elif ext in ['.doc', '.docx']:
                return self._parse_docx(filepath)
            elif ext == '.txt':
                return self._parse_txt(filepath)
            else:
                logger.error(f"Unsupported file format: {ext}")
                return None

        except Exception as e:
            logger.error(f"Error parsing document {filepath}: {e}")
            return None

    def _parse_pdf(self, filepath: str) -> Optional[str]:
        """Parse PDF document using multiple methods for best results"""
        text = ""

        # Try pdfplumber first (better for complex layouts)
        try:
            logger.info(f"Parsing PDF with pdfplumber: {filepath}")
            with pdfplumber.open(filepath) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n\n"
                    logger.debug(f"Extracted page {page_num}/{len(pdf.pages)}")

            if text.strip():
                logger.info(f"Successfully extracted {len(text)} characters from PDF")
                return text.strip()

        except Exception as e:
            logger.warning(f"pdfplumber failed: {e}, trying PyPDF2")

        # Fallback to PyPDF2
        try:
            logger.info(f"Parsing PDF with PyPDF2: {filepath}")
            with open(filepath, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                num_pages = len(pdf_reader.pages)

                for page_num in range(num_pages):
                    page = pdf_reader.pages[page_num]
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n\n"
                    logger.debug(f"Extracted page {page_num + 1}/{num_pages}")

            if text.strip():
                logger.info(f"Successfully extracted {len(text)} characters from PDF")
                return text.strip()
            else:
                logger.error("Could not extract text from PDF")
                return None

        except Exception as e:
            logger.error(f"PyPDF2 also failed: {e}")
            return None

    def _parse_docx(self, filepath: str) -> Optional[str]:
        """Parse DOCX document"""
        try:
            logger.info(f"Parsing DOCX: {filepath}")
            doc = docx.Document(filepath)

            # Extract all paragraphs
            text = []
            for para in doc.paragraphs:
                if para.text.strip():
                    text.append(para.text)

            # Extract text from tables
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        if cell.text.strip():
                            text.append(cell.text)

            content = "\n\n".join(text)

            if content.strip():
                logger.info(f"Successfully extracted {len(content)} characters from DOCX")
                return content.strip()
            else:
                logger.warning("DOCX file appears to be empty")
                return None

        except Exception as e:
            logger.error(f"Error parsing DOCX: {e}")
            return None

    def _parse_txt(self, filepath: str, encoding: str = 'utf-8') -> Optional[str]:
        """Parse plain text file"""
        encodings_to_try = [encoding, 'utf-8', 'latin-1', 'iso-8859-1', 'cp1252']

        for enc in encodings_to_try:
            try:
                logger.info(f"Parsing TXT with encoding {enc}: {filepath}")
                with open(filepath, 'r', encoding=enc) as file:
                    text = file.read()

                if text.strip():
                    logger.info(f"Successfully extracted {len(text)} characters from TXT")
                    return text.strip()
                else:
                    logger.warning("TXT file appears to be empty")
                    return None

            except UnicodeDecodeError:
                logger.warning(f"Encoding {enc} failed, trying next")
                continue
            except Exception as e:
                logger.error(f"Error parsing TXT with {enc}: {e}")
                continue

        logger.error("Could not parse TXT file with any encoding")
        return None

    def clean_text(self, text: str) -> str:
        """
        Clean extracted text (remove excessive whitespace, etc.)

        Args:
            text: Raw extracted text

        Returns:
            Cleaned text
        """
        if not text:
            return ""

        # Remove excessive whitespace
        lines = [line.strip() for line in text.split('\n')]
        # Remove empty lines but keep paragraph breaks
        cleaned_lines = []
        prev_empty = False

        for line in lines:
            if line:
                cleaned_lines.append(line)
                prev_empty = False
            elif not prev_empty:
                cleaned_lines.append("")
                prev_empty = True

        return "\n".join(cleaned_lines).strip()

    def extract_metadata(self, filepath: str) -> dict:
        """Extract metadata from document"""
        metadata = {
            'filename': os.path.basename(filepath),
            'size_bytes': os.path.getsize(filepath),
            'extension': os.path.splitext(filepath)[1].lower()
        }

        ext = metadata['extension']

        try:
            if ext == '.pdf':
                with open(filepath, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    if pdf_reader.metadata:
                        metadata['title'] = pdf_reader.metadata.get('/Title', '')
                        metadata['author'] = pdf_reader.metadata.get('/Author', '')
                        metadata['subject'] = pdf_reader.metadata.get('/Subject', '')
                    metadata['num_pages'] = len(pdf_reader.pages)

            elif ext in ['.doc', '.docx']:
                doc = docx.Document(filepath)
                core_props = doc.core_properties
                if core_props:
                    metadata['title'] = core_props.title or ''
                    metadata['author'] = core_props.author or ''
                    metadata['subject'] = core_props.subject or ''
                metadata['num_paragraphs'] = len(doc.paragraphs)

        except Exception as e:
            logger.warning(f"Could not extract metadata: {e}")

        return metadata
