import os
import uuid
import shutil
from typing import Optional
from datetime import datetime, timedelta

# Try loading boto3, otherwise handle gracefully
BOTO3_AVAILABLE = False
try:
    import boto3
    from botocore.client import Config
    BOTO3_AVAILABLE = True
except ImportError:
    pass

# Retrieve configuration from environments
S3_BUCKET = os.getenv("S3_BUCKET", "")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "")
S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL", "")  # For Backblaze/R2/MinIO
S3_REGION = os.getenv("S3_REGION", "us-east-1")

def get_s3_client():
    if not BOTO3_AVAILABLE or not S3_BUCKET or not S3_ACCESS_KEY:
        return None
    try:
        return boto3.client(
            "s3",
            aws_access_key_id=S3_ACCESS_KEY,
            aws_secret_access_key=S3_SECRET_KEY,
            endpoint_url=S3_ENDPOINT_URL or None,
            region_name=S3_REGION,
            config=Config(signature_version="s3v4")
        )
    except Exception as e:
        print(f"S3 client initialization failed: {e}")
        return None

def upload_to_storage(file_content, filename: str, content_type: str) -> str:
    """
    Uploads a file. If S3 is configured, uploads to S3 and returns a signed url prefix or unique key.
    Otherwise, saves to local static files.
    """
    ext = os.path.splitext(filename)[1].lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    
    client = get_s3_client()
    if client:
        try:
            # Upload to S3-compatible storage
            client.put_object(
                Bucket=S3_BUCKET,
                Key=unique_name,
                Body=file_content,
                ContentType=content_type
            )
            # We return a dynamic placeholder URL that our backend will translate to signed URLs on the fly
            # or a direct S3 key
            return f"s3://{S3_BUCKET}/{unique_name}"
        except Exception as e:
            print(f"S3 upload failed, falling back to local: {e}")
            
    # Local fallback
    UPLOAD_DIR = "backend/static/uploads"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)
        
    return f"/static/uploads/{unique_name}"

def get_download_url(url_or_key: str) -> str:
    """
    Returns a publicly accessible or presigned URL for the given key/url.
    """
    if url_or_key.startswith("s3://"):
        client = get_s3_client()
        if client:
            try:
                parts = url_or_key[5:].split("/", 1)
                bucket = parts[0]
                key = parts[1]
                # Generate signed URL valid for 1 hour
                signed_url = client.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": bucket, "Key": key},
                    ExpiresIn=3600
                )
                return signed_url
            except Exception as e:
                print(f"Failed to generate presigned URL: {e}")
                return url_or_key
                
    # Return local URL as-is
    return url_or_key
