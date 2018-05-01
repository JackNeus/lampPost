from datetime import datetime, timedelta
from dateutil.parser import *
import json
import os
import re
import sendgrid
from sendgrid.helpers.mail import *

from .models import *
from app import CONFIG, app

InternalError = Exception("InternalError")

if "SENDGRID_API_KEY" in CONFIG:
	sg = sendgrid.SendGridAPIClient(apikey=CONFIG['SENDGRID_API_KEY'])
else:
	sg = None

def get_max_visibility(user):
	if user is None:
		return 0
	else:
		return 1

def is_visible(event, user):
	return event.visibility <= get_max_visibility(user)

def add_event(data):
	new_event = EventEntry.from_json(json.dumps(data))
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
	
# Returns event objects for all event ids in ids
def get_favorite_events(ids):
	events = []
	for event_id in ids:
		try:
			event = get_event(event_id)
			if event is not None:
				events.append(event)
		except:
			pass
	return events

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

# Get trending events. This is curently the 15 events occurring in the next week 
# with the most favories.
def get_trending_events(user = None):
	trending_size = 15
	# Start a day ago.
	start_datetime = datetime.now() - timedelta(days = 1)
	end_datetime = datetime.now() + timedelta(days = 7)
	trending_events = EventEntry.objects(instances__end_datetime__gte = start_datetime,
		instances__end_datetime__lte = end_datetime, 
		visibility__lte = get_max_visibility(user))
	trending_events = trending_events.order_by('-favorites').limit(trending_size)
	return trending_events

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
	# Query settings that go with ALL queries.
	query_settings = {"visibility__lte": get_max_visibility(user),
		"instances__end_datetime__gte": start_datetime}

	tokens = query.split()
	results = []
	for token in tokens:
		# We want to either match the first word, or a subsequent word (i.e. text preceded by whitespace).
		prefix_re = re.compile("(\s+|^)%s" % token, re.IGNORECASE)
		full_word_re = re.compile("(\s+|^)%s(\s+|$)" % token, re.IGNORECASE)

		# Queries to run.
		queries = [{"title": prefix_re},
			{"host": prefix_re},
			{"instances__location": prefix_re},
			{"description": full_word_re}]

		sources = list(map(lambda query: set(EventEntry.objects(**query, **query_settings)), queries))
		events = set().union(*sources)
		
		results.append(events)
	events = []
	if len(results) > 0:
		events = set.intersection(*results)
	return events

def get_most_recent_report(reporter):
	reports = ReportEntry.objects(reporter=reporter.netid).order_by('-report_time')
	if reports.count() == 0:
		return None
	return reports[0]

def add_report(reporter, reason, event_id):
	last_report = get_most_recent_report(reporter)

	if last_report is not None:
		last_report_time = last_report.report_time

		# Time limit between reports.
		report_rate = CONFIG["REPORT_TIME_LIMIT"]
		cutoff_time = datetime.today() - timedelta(seconds=report_rate)
		if last_report_time >= cutoff_time:
			delta = last_report_time - cutoff_time
			second_delta = delta.total_seconds()
			raise RateError("You must wait %d seconds before reporting another event." % second_delta)

	event = get_event(event_id)
	if event is None:
		raise EventDNEError()
	event_dump = str(event.to_json())
	new_report = ReportEntry(reporter=reporter.netid,
		report_time=datetime.now(),
		reason=reason,
		event_dump=event_dump)
	send_report_email(new_report)

	# Save after report has been successfully emailed.
	new_report.save()
	return new_report.to_json()

def send_report_email(report):
	if CONFIG["DEBUG"] and sg is None:
		return
	for admin in CONFIG["ADMINS"]:
		from_email = Email("system@lamppost.info")
		to_email = Email(admin)
		subject = "An event was reported."
		content_string = "Reporter: %s<br />Time: %s<br />Reason: %s<br />Event: %s<br />" % (report.reporter, report.report_time, report.reason, report.event_dump)
		content = Content("text/html", content_string)
		mail = Mail(from_email, subject, to_email, content)
		response = sg.client.mail.send.post(request_body=mail.get())
		print(response.status_code)
		print(response.body)
		print(response.headers)
