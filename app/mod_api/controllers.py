import re
from .models import *
from app import CONFIG, app

InternalError = Exception("InternalError")

def is_visible(event, user):
	if user is None:
		desired_visibility = 0
	else:
		desired_visibility = 1
	return event.visibility <= desired_visibility

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
		# Don't allow user to modify system fields. 
		if field in system_fields:
			continue
		field_data = data[field]
		if field == "instances":
			field_data = data[field]
			field_data = [InstanceEntry(location = instance["location"],
										start_datetime = instance["start_datetime"],
										end_datetime = instance["end_datetime"]) for instance in field_data]
		event[field] = field_data
	event.save()
	return event
	
# Get list of events by creator's netid.
def get_events_by_creator(netid):
	events = EventEntry.objects(creator = netid)
	return events

# Get [netid of] creator for event (by event id).
def get_event_creator(id):
	event = EventEntry.objects(id=id)
	if len(event) == 0:
		return None
	return event[0].creator

def get_user_by_netid(netid):
	netid = netid.lower()
	try:
		entries = UserEntry.objects(netid = netid)
		if entries.count() == 1:
			return entries[0]
		elif entries.count() == 0:
			return None
		return None
	except Exception as e:
		raise e

def get_user_by_uid(uid):
	entries = UserEntry.objects(id = uid)
	if entries.count() == 1:
		return entries[0]
	return None


# Add UserEntry for given netid.
def add_user(netid):
	netid = netid.lower()
	entries = UserEntry.objects(netid = netid)
	if entries.count() > 0:
		raise UserExistsError
	new_user = UserEntry(netid = netid)
	new_user.save()
	return new_user

def edit_event_favorites(id, increment):
	event = get_event(id)
	if event is None:
		return None
	event.favorites = event.favorites + increment
	event.save()
	return event.favorites

def add_user_favorite(user, eventid):
	user.favorites.append(eventid)
	edit_event_favorites(eventid, 1)
	user.save()

def remove_user_favorite(user, eventid):
	user.favorites.remove(eventid)
	edit_event_favorites(eventid, -1)
	user.save()

# Search works as follows:
# The query is tokenized (whitespace delimited).
# For each token, events with tokens (whitespace delimited) matching the token are aggregated.
# The current event fields queried are title, location, and host.
# The intersection of results for the tokens is returned.
# Only events ending after start_datetime are included in search results.
# Currently, if one or more instances of an event match the search terms, all instances are returned.
def search_events(query, start_datetime, user=None):
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
	return filter(lambda x: is_visible(x, user), events)
