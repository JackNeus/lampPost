import re
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

# Edits the event with given id.
# Editing works as follows:
# For each field in data, the corresponding field in the event is updated.
# This ONLY works at the top-level -- if data contains "instances", for example,
# the entire "instances" list will be replaced.
def edit_event(id, data):
	event = get_event(id)
	if event is None:
		return None
	for field in data:
		event[field] = data[field]
	event.save()
	return event
	
# Search works as follows:
# The query is tokenized (whitespace delimited).
# For each token, events with tokens (whitespace delimited) matching the token are aggregated.
# The current event fields queried are title, location, and host.
# The intersection of results for the tokens is returned.
# Only events ending after start_datetime are included in search results.
# Currently, if one or more instances of an event match the search terms, all instances are returned.
def search_events(query, start_datetime):
	tokens = query.split()
	results = []
	for token in tokens:
		# We want to either match the first word, or a subsequent word (i.e. text preceded by whitespace).
		token_re = re.compile("(\s*|^)" + token, re.IGNORECASE)
		events = set()
		events = events.union(set(EventEntry.objects(title = token_re, instances__end_datetime__gte = start_datetime)))
		events = events.union(set(EventEntry.objects(host = token_re, instances__end_datetime__gte = start_datetime)))
		events = events.union(set(EventEntry.objects(instances__location = token_re, instances__end_datetime__gte = start_datetime)))
		results.append(events)
	events = set.intersection(*results)
	return events