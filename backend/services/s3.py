"""
S3 service for audio file uploads
"""
import boto3
import os
from datetime import datetime
from botocore.exceptions import ClientError
import logging

logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION', 'us-east-1')
        )
        self.bucket_name = os.getenv('S3_BUCKET_NAME', 'samvad-audio-uploads-dev')
    
    def upload_audio_file(self, file_content: bytes, file_name: str) -> str:
        """
        Upload audio file to S3 bucket
        
        Args:
            file_content: Audio file content as bytes
            file_name: Original file name
            
        Returns:
            S3 URI of uploaded file
        """
        try:
            # Generate unique file name with timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            s3_key = f"uploads/{timestamp}_{file_name}"
            
            # Upload to S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_content,
                ContentType='audio/mpeg'
            )
            
            # Return S3 URI
            s3_uri = f"s3://{self.bucket_name}/{s3_key}"
            logger.info(f"Uploaded file to S3: {s3_uri}")
            return s3_uri
            
        except ClientError as e:
            logger.error(f"Error uploading to S3: {e}")
            raise Exception(f"Failed to upload audio file: {str(e)}")
    
    def get_presigned_url(self, s3_uri: str, expiration: int = 3600) -> str:
        """
        Generate presigned URL for S3 object
        
        Args:
            s3_uri: S3 URI (s3://bucket/key)
            expiration: URL expiration time in seconds
            
        Returns:
            Presigned URL
        """
        try:
            # Parse S3 URI
            s3_key = s3_uri.replace(f"s3://{self.bucket_name}/", "")
            
            # Generate presigned URL
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': s3_key},
                ExpiresIn=expiration
            )
            return url
            
        except ClientError as e:
            logger.error(f"Error generating presigned URL: {e}")
            raise Exception(f"Failed to generate presigned URL: {str(e)}")
    
    def delete_file(self, s3_uri: str):
        """
        Delete file from S3 bucket
        
        Args:
            s3_uri: S3 URI (s3://bucket/key)
        """
        try:
            s3_key = s3_uri.replace(f"s3://{self.bucket_name}/", "")
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=s3_key)
            logger.info(f"Deleted file from S3: {s3_uri}")
        except ClientError as e:
            logger.error(f"Error deleting from S3: {e}")
            raise Exception(f"Failed to delete file: {str(e)}")
