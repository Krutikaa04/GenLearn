"""Tests for the document processing route models."""
import pytest
from app.api.routes.documents import ProcessDocumentRequest, ProcessDocumentResponse


class TestProcessDocumentRequest:
    def test_all_fields_required(self):
        req = ProcessDocumentRequest(
            documentId="doc-1",
            studentId="student-1",
            fileContent="aGVsbG8=",
            fileType="pdf",
        )
        assert req.documentId == "doc-1"
        assert req.studentId == "student-1"
        assert req.fileContent == "aGVsbG8="
        assert req.fileType == "pdf"

    def test_missing_document_id_raises(self):
        with pytest.raises(Exception):
            ProcessDocumentRequest(studentId="s1", fileContent="aGVsbG8=", fileType="pdf")

    def test_missing_file_content_raises(self):
        with pytest.raises(Exception):
            ProcessDocumentRequest(documentId="d1", studentId="s1", fileType="pdf")


class TestProcessDocumentResponse:
    def test_chunk_count_only(self):
        resp = ProcessDocumentResponse(chunkCount=12, pageCount=None)
        assert resp.chunkCount == 12
        assert resp.pageCount is None

    def test_with_page_count(self):
        resp = ProcessDocumentResponse(chunkCount=8, pageCount=5)
        assert resp.pageCount == 5

    def test_zero_chunks_for_empty_document(self):
        resp = ProcessDocumentResponse(chunkCount=0, pageCount=None)
        assert resp.chunkCount == 0
