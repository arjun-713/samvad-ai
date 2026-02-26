"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional

class TranscribeRequest(BaseModel):
    """Request model for transcription"""
    language_code: str = Field(default='en-US', description='Language code for transcription')

class TranscribeResponse(BaseModel):
    """Response model for transcription"""
    transcript: str = Field(description='Transcribed text')
    language_code: str = Field(description='Language code used')
    s3_uri: str = Field(description='S3 URI of uploaded audio')
    job_name: str = Field(description='Transcription job name')

class ErrorResponse(BaseModel):
    """Error response model"""
    error: str = Field(description='Error message')
    detail: Optional[str] = Field(default=None, description='Detailed error information')
