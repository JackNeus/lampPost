import boto3, botocore
from dateutil.parser import *
from mongoengine import *
from app import CONFIG, app


class InstanceEntry(EmbeddedDocument):
    location = StringField(required = True, min_length = 3)
    start_datetime = DateTimeField(required = True)
    end_datetime = DateTimeField(required = True)

    # Override save() method to add custom validation
    def clean(self):
        # End datetime cannot be before start datetime.
        if self.end_datetime < self.start_datetime:
            raise ValidationError("End time is earlier than start time.")

class EventEntry(Document):
    title = StringField(required = True, unique = True, min_length = 5)
    host = StringField(required = True, min_length = 3)
    instances = EmbeddedDocumentListField(InstanceEntry, required = True, min_length = 1)
        
    description = StringField(required = True, min_length = 10)
    visibility = IntField(required = True, default = 0) 

    # For internal use only.
    creator = StringField(required = True)

    # Optional fields.
    trailer = URLField()

    meta = {'strict': False}
        
# List of fields that MUST be supplied by user.
required_fields = [
"title",
"creator",
"host",
"instances",
"instances/location",
"instances/start_datetime",
"instances/end_datetime",
"description"]

# TODO: Make this more generic/less hacky/generally better.
def has_field(obj, field):
    # If a field in instance/, need to check every instance for the field.
    if "/" in field:
        if "instances" not in obj:
            return False
        field = field.split("/")[1]
        for instance in obj["instances"]:
            if field not in instance:
                return False
    # Otherwise, just check obj.
    else:
        return field in obj
    return True

def get_missing_fields(obj):
    missing = []
    print(obj)
    for field in required_fields:
        if not has_field(obj, field):
            missing.append(field)
    print(missing)
    return missing

def get_raw_event(event_entry):
    if event_entry is None:
        return []
    raw = event_entry.to_mongo()
    raw["_id"] = str(raw["_id"])
    for i in range(len(raw["instances"])):
        raw["instances"][i]["start_datetime"] = str(raw["instances"][i]["start_datetime"])
        raw["instances"][i]["end_datetime"] = str(raw["instances"][i]["end_datetime"])
    return raw

### Amazon S3 Code ###

s3 = boto3.client(
   "s3",
   aws_access_key_id=CONFIG["S3_KEY_ID"],
   aws_secret_access_key=CONFIG["S3_KEY_SECRET"]
)

def upload_file_to_s3(file, acl="public-read"):
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
        # This is a catch all exception, edit this part to fit your needs.
        print("Something Happened: ", e)
        return e