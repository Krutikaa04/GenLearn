import tempfile
import os
import pytest
from app.services.text_extractor import extract_text


def write_temp(suffix: str, content: str) -> str:
    fd, path = tempfile.mkstemp(suffix=suffix)
    try:
        os.write(fd, content.encode("utf-8"))
    finally:
        os.close(fd)
    return path


def test_extract_txt_file():
    path = write_temp(".txt", "Hello from a text file.")
    try:
        assert extract_text(path) == "Hello from a text file."
    finally:
        os.unlink(path)


def test_extract_md_file():
    path = write_temp(".md", "# Heading\n\nSome content.")
    try:
        result = extract_text(path)
        assert "Heading" in result
        assert "Some content" in result
    finally:
        os.unlink(path)


def test_txt_preserves_unicode():
    path = write_temp(".txt", "Привет мир — 你好世界")
    try:
        assert extract_text(path) == "Привет мир — 你好世界"
    finally:
        os.unlink(path)


def test_unsupported_extension_raises_value_error():
    path = write_temp(".xyz", "content")
    try:
        with pytest.raises(ValueError, match="Unsupported file type"):
            extract_text(path)
    finally:
        os.unlink(path)
