from .models import *
from app import CONFIG, app

InternalError = Exception("InternalError")

def add_event(data):
	new_event = EventEntry.from_json(data)
	new_event.save()
	return new_event

def get_event(id):
	event = EventEntry.objects(id=id)
	if len(event) == 0:
		return None
	if len(event) != 1:
		# More than 1 event returned for the given ID, which is very bad.
		raise InternalError("More than one event exists for that id.")
	return event[0]

def delete_event(id):
	event = get_event(id)
	if event is None:
		return None
	event.delete()
	return event