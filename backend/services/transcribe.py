"""
Amazon Transcribe service for audio-to-text conversion
"""
import boto3
import os
import time
import logging
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

class TranscribeService:
    def __init__(self):
        self.transcribe_client = boto3.client(
            'transcribe',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION', 'us-east-1')
        )
    
    def transcribe_audio(self, s3_uri: str, language_code: str = 'en-US') -> dict:
        """
        Transcribe audio file using Amazon Transcribe
        
        Args:
            s3_uri: S3 URI of audio file
            language_code: Language code (e.g., 'en-US', 'hi-IN', 'ta-IN')
            
        Returns:
            Dictionary with transcript text and detected language
        """
        try:
            # Generate unique job name
            job_name = f"transcribe_{int(time.time())}"
            
            # Start transcription job
            logger.info(f"Starting transcription job: {job_name}")
            self.transcribe_client.start_transcription_job(
                TranscriptionJobName=job_name,
                Media={'MediaFileUri': s3_uri},
                MediaFormat='mp3',  # or 'wav' based on file type
                LanguageCode=language_code,
                Settings={
                    'ShowSpeakerLabels': False,
                    'MaxSpeakerLabels': 2
                }
            )
            
            # Wait for job to complete
            max_tries = 60  # 5 minutes max
            while max_tries > 0:
                max_tries -= 1
                job = self.transcribe_client.get_transcription_job(
                    TranscriptionJobName=job_name
                )
                status = job['TranscriptionJob']['TranscriptionJobStatus']
                
                if status == 'COMPLETED':
                    logger.info(f"Transcription job completed: {job_name}")
                    # Get transcript
                    transcript_uri = job['TranscriptionJob']['Transcript']['TranscriptFileUri']
                    transcript_text = self._get_transcript_text(transcript_uri)
                    
                    # Clean up job
                    self._delete_transcription_job(job_name)
                    
                    return {
                        'transcript': transcript_text,
                        'language_code': language_code,
                        'job_name': job_name
                    }
                    
                elif status == 'FAILED':
                    failure_reason = job['TranscriptionJob'].get('FailureReason', 'Unknown')
                    logger.error(f"Transcription job failed: {failure_reason}")
                    self._delete_transcription_job(job_name)
                    raise Exception(f"Transcription failed: {failure_reason}")
                
                # Wait before checking again
                time.sleep(5)
            
            # Timeout
            logger.error(f"Transcription job timed out: {job_name}")
            self._delete_transcription_job(job_name)
            raise Exception("Transcription job timed out")
            
        except ClientError as e:
            logger.error(f"Error in transcription: {e}")
            raise Exception(f"Transcription error: {str(e)}")
    
    def _get_transcript_text(self, transcript_uri: str) -> str:
        """
        Fetch and parse transcript from URI
        
        Args:
            transcript_uri: URI of transcript JSON file
            
        Returns:
            Transcript text
        """
        import requests
        import json
        
        try:
            response = requests.get(transcript_uri)
            response.raise_for_status()
            transcript_json = response.json()
            
            # Extract transcript text
            transcript = transcript_json['results']['transcripts'][0]['transcript']
            return transcript
            
        except Exception as e:
            logger.error(f"Error fetching transcript: {e}")
            raise Exception(f"Failed to fetch transcript: {str(e)}")
    
    def _delete_transcription_job(self, job_name: str):
        """
        Delete transcription job to clean up
        
        Args:
            job_name: Name of transcription job
        """
        try:
            self.transcribe_client.delete_transcription_job(
                TranscriptionJobName=job_name
            )
            logger.info(f"Deleted transcription job: {job_name}")
        except ClientError as e:
            logger.warning(f"Could not delete transcription job: {e}")
    
    def detect_language(self, s3_uri: str) -> str:
        """
        Detect language of audio file
        
        Args:
            s3_uri: S3 URI of audio file
            
        Returns:
            Detected language code
        """
        # For now, return default. Can be enhanced with language identification
        return 'en-US'
