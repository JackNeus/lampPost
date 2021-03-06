import boto3, botocore
import time
from app import CONFIG, app

allowed_extensions = set(["jpg", "jpeg", "png", "gif"])

### Amazon S3 Code ###

s3 = None

def init_s3():
    global s3
    s3 = boto3.client(
       "s3",
       aws_access_key_id=CONFIG["S3_KEY_ID"],
       aws_secret_access_key=CONFIG["S3_KEY_SECRET"]
    )

def upload_file_to_s3(file, acl="public-read"):
    if s3 is None:
        init_s3()
    try:
        s3.upload_fileobj(
            file,
            CONFIG["S3_BUCKET"],
            file.filename,
            ExtraArgs={
                "ACL": acl,
                "ContentType": file.content_type
            }
        )

    except Exception as e:
        raise e

    return "{}{}".format(CONFIG["S3_LOCATION"], file.filename)

class BadFileException(Exception):
    pass

def get_file_type(filename):
    if "." not in filename:
        return ""
    return filename.rsplit(".", 1)[1]

def allowed_file_type(filename):
    return get_file_type(filename).lower() in allowed_extensions
