from .models import *
from app import CONFIG, app

from flask_login import current_user

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
	return eventData, len(showings)
