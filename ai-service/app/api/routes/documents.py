from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.middleware.auth import verify_internal_key

router = APIRouter(dependencies=[Depends(verify_internal_key)])


class ProcessDocumentRequest(BaseModel):
    documentId: str
    studentId: str
    storagePath: str
    fileType: str


@router.post("/process")
async def process_document(request: ProcessDocumentRequest):
    raise NotImplementedError("Document processing not yet implemented")
