from .models import *
from app import CONFIG, app

from flask_login import current_user
from werkzeug.utils import secure_filename

def form_to_event_object(form):
	eventData = {}
	eventData['title'] = form.title.data
	eventData['description'] = form.description.data
	# TODO: let's actually let users determine this
	eventData['visibility'] = 0

	showings = []
	for i in range(int(form.numShowings.data)):
		instanceDict = {}
		instanceDict["location"] = form.locations.data[i]
		instanceDict["start_datetime"] = str(form.startDates.data[i]) + " " + str(form.startTimes.data[i])
		instanceDict["end_datetime"] = str(form.endDates.data[i]) + " " + str(form.endTimes.data[i])
		showings.append(instanceDict)

	eventData['instances'] = showings
	eventData['creator'] = current_user.netid
	eventData['host'] = form.host.data

	if (form.link.data != ""):
		eventData['trailer'] = form.link.data

	return eventData

def make_edit_request(event_id, edits):
	headers = { "Authorization" : "Token %s" % current_user.token }
	return requests.post(CONFIG["BASE_URL"] + "/api/event/edit/"+event_id, json=edits, headers=headers)
			
def upload_file(event_id, file):
	if not allowed_file_type(file.filename): 
		raise BadFileTypeExtension("File must be .jpg, .jpeg, .png, or .gif.")
	file.filename = secure_filename(event_id+"."+get_file_type(file.filename))
	print(file.filename)
	print(upload_file_to_s3(file))
	return None

def add_image_to_event(event_id, file):
	file_url = upload_file(event_id, file)
	r = make_edit_request(event_id, {'poster': file_url})