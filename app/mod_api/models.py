from datetime import datetime, timedelta
from dateutil.parser import *
from mongoengine import *
from app import CONFIG, app

class EventDNEError(Exception):
    pass

class RateError(Exception):
    pass

class ReadableError(Exception):
    pass

class UserEntry(Document):
    netid = StringField(required = True, unique = True)
    favorites = ListField()

    meta = { "strict": False}

class InstanceEntry(EmbeddedDocument):
    location = StringField(required = True, min_length = 3, max_length = 100)
    start_datetime = DateTimeField(required = True)
    end_datetime = DateTimeField(required = True)

    # Override save() method to add custom validation
    def clean(self):
        if type(self.start_datetime) is not datetime:
            self.start_datetime = parse(self.start_datetime)
        if type(self.end_datetime) is not datetime:
            self.end_datetime = parse(self.end_datetime)

        # End datetime cannot be before start datetime.
        if self.end_datetime < self.start_datetime:
            raise ReadableError("End time is earlier than start time.")

class EventEntry(Document):
    title = StringField(required = True, unique = True, min_length = 5, max_length = 100)
    host = StringField(required = True, min_length = 3, max_length = 100)
    instances = EmbeddedDocumentListField(InstanceEntry, required = True, min_length = 1)
        
    description = StringField(required = True, min_length = 10, max_length = 10000)
    visibility = IntField(required = True, default = 0) 
    favorites = IntField(required = True, default = 0)

    # For internal use only.
    creator = StringField(required = True)

    # Optional fields.
    trailer = URLField(max_length = 100)
    poster = URLField()

    def clean(self):
        if self.poster is not None and not self.poster.startswith(CONFIG["S3_LOCATION"]):
            raise ReadableError("Poster URL did not point to an authorized location.")
        
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

# List of system fields (i.e. fields that the user should not touch)
system_fields = [
"id",
"creator",
"favorites"]

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
    # TODO: Make sure obj is the right type, i.e. is a dict.
    missing = []
    for field in required_fields:
        if not has_field(obj, field):
            missing.append(field)
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

class ReportEntry(Document):
    reporter = StringField(required = True)
    report_time = DateTimeField(required = True)
    reason = StringField(required = True, min_length = 5)
    event_dump = StringField(required = True)