from .models import *
from app import CONFIG, app

InternalError = Exception("InternalError")

def get_event(id):
	event = EventEntry.objects(id=id)
	if len(event) == 0:
		return None
	if len(event) != 1:
		# More than 1 event returned for the given ID, which is very bad.
		raise InternalError("More than one event exists for that id.")
	return event[0]
