import pytest
from app.services.text_extractor import extract_text


def test_extract_txt_file():
    assert extract_text(b"Hello from a text file.", "txt") == "Hello from a text file."


def test_extract_md_file():
    result = extract_text(b"# Heading\n\nSome content.", "md")
    assert "Heading" in result
    assert "Some content" in result


def test_txt_preserves_unicode():
    content = "Привет мир — 你好世界"
    assert extract_text(content.encode("utf-8"), "txt") == content


def test_file_type_is_case_insensitive():
    assert extract_text(b"content", "TXT") == "content"


def test_file_type_leading_dot_is_stripped():
    assert extract_text(b"content", ".txt") == "content"


def test_unsupported_extension_raises_value_error():
    with pytest.raises(ValueError, match="Unsupported file type"):
        extract_text(b"content", "xyz")
