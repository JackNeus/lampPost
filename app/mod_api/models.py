from dateutil.parser import *
from mongoengine import *

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

# List of system fields (i.e. fields that the user should not touch)
system_fields = [
"id",
"creator"]

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

