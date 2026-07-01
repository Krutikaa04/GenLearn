"""Extract plain text from PDF, DOCX, TXT, and MD file content."""
import io
from pypdf import PdfReader
from docx import Document as DocxDocument


def extract_text(content: bytes, file_type: str) -> str:
    file_type = file_type.lower().lstrip(".")

    if file_type == "pdf":
        return _extract_pdf(content)
    elif file_type == "docx":
        return _extract_docx(content)
    elif file_type in ("txt", "md"):
        return content.decode("utf-8", errors="replace")
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


def _extract_pdf(content: bytes) -> str:
    text_parts = []
    reader = PdfReader(io.BytesIO(content))
    for page in reader.pages:
        text = page.extract_text()
        if text:
            text_parts.append(text)
    return "\n\n".join(text_parts)


def _extract_docx(content: bytes) -> str:
    doc = DocxDocument(io.BytesIO(content))
    return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())
