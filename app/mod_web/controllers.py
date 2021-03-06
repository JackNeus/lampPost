from .models import *
from app import CONFIG, app
from flask import escape
import copy
from flask_login import current_user
from werkzeug.utils import secure_filename
import os
import requests

def form_to_event_object(form):
	eventData = {}
	eventData['title'] = escape(form.title.data)
	eventData['description'] = escape(form.description.data)
	eventData['visibility'] = escape(int(form.visibility.data))

	showings = []
	for i in range(int(form.numShowings.data)):
		instanceDict = {}
		instanceDict["location"] = escape(form.locations.data[i])
		instanceDict["start_datetime"] = str(escape(form.startDates.data[i])) + " " + str(escape(form.startTimes.data[i]))
		instanceDict["end_datetime"] = str(escape(form.endDates.data[i])) + " " + str(escape(form.endTimes.data[i]))
		showings.append(instanceDict)

	eventData['instances'] = showings
	eventData['creator'] = current_user.netid
	eventData['host'] = escape(form.host.data)

	eventData['tags'] = form.tags.data

	# If deletePoster field is not empty,
	# delete the poster field.
	if (form.deletePoster.data != ""):
		eventData["poster"] = None

	if (escape(form.link.data) != ""):
		eventData['trailer'] = escape(form.link.data)
	return eventData, len(showings)

def make_edit_request(event_id, edits):
	headers = { "Authorization" : "Token %s" % current_user.token }
	return requests.post(CONFIG["BASE_URL"] + "/api/event/edit/"+event_id, json=edits, headers=headers)
		
def make_delete_request(event_id):
	headers = { "Authorization" : "Token %s" % current_user.token }
	return requests.delete(CONFIG["BASE_URL"] + "/api/event/delete/"+event_id, headers=headers)
		

def upload_file(event_id, file):
	if not allowed_file_type(file.filename): 
		raise BadFileException("File must be .jpg, .jpeg, .png, or .gif.")

	# TODO: Some sort of resolution/file size requirement.

	# Currently all files are suffixed with -0. This is to make it easier for when
	# we support multiple images.
	file.filename = secure_filename(event_id+"-0."+get_file_type(file.filename))

	# Compute file size.
	file.seek(0, os.SEEK_END)
	file_size = file.tell() / 1000  # Convert to kilobytes.
	file.seek(0, 0)
	if file_size > CONFIG["MAX_FILE_SIZE"]:
		raise BadFileException("File must not be greater than %d kB." % CONFIG["MAX_FILE_SIZE"])

	url = upload_file_to_s3(file)
	return url
