from . import api_module as mod_api
from . import controllers as controller
from datetime import datetime, timedelta
from dateutil.parser import *

def validation_error(e, data):
	errors = e.errors

	# check_instance_times
	cutoff_time = datetime.today() - timedelta(days=1)

	# Make sure event being created is not too far in the past.
	if "instances" in data:
		for instance in data["instances"]:
			if "end_datetime" not in instance:
				continue
			if type(instance["end_datetime"]) is not datetime:
				end_datetime = parse(instance["end_datetime"])
			if end_datetime < cutoff_time:
				return "End time has already passed."
	else:
		return "Event has no instances."

	if "poster" in data and not data["poster"].startswith(CONFIG["S3_LOCATION"]):
		return "Poster URL did not point to an authorized location."

	if "title" not in data:
		return "A title is required."
	else:
		if len(data["title"]) < 5:
			return "Title is too short."
		elif len(data["title"]) > 100:
			return "Title is too long."

	if "host" not in data:
		return "A host is required."
	else:
		if len(data["host"]) < 3:
			return "Host name is too short."
		elif len(data["host"]) > 100:
			return "Host name is too long."

	if "description" not in data:
		return "A description is required."
	else:
		if len(data["description"]) < 10:
			return "Description is too short."
		elif len(data["description"]) > 10000:
			return "Description is too long."

	if "visibility" not in data:
		return "Visibility is a required field."
	elif data["visibility"] > 1:
		return "Incorrect visibility value. Please contact a developer."

	if "favorites" in data and data["favorites"] < 0:
		return "Negative favorites value. Please contact a developer."

	if "trailer" in errors and str(errors["trailer"]).find("Invalid scheme") is not -1:
		return "Trailer is not a valid URL."

	if "trailer" in data and len(data["trailer"]) > 100:
		return "Trailer URL is too long."

	return str(errors)