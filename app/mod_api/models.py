from dateutil.parser import *
from mongoengine import *

class EventEntry(Document):
	title = StringField(required = True)
	creator = StringField(required = True)

	location = StringField(required = True)
	start_datetime = DateTimeField(required = True)
	end_datetime = DateTimeField(required = True)

	description = StringField(required = True)
	visibility = IntField(required = True, default = 0)

	# Optional fields
	creator_display = StringField()
	trailer = URLField()

	# Override save() method to add custom validation
	def save(self):
		# End datetime cannot be before start datetime.
		if self.end_datetime < self.start_datetime:
			raise ValidationError("End time is earlier than start time.")
		super(EventEntry, self).save()

def get_raw_event(event_entry):
	raw = event_entry.to_mongo()
	raw["_id"] = str(raw["_id"])
	return raw