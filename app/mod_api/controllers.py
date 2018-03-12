from .models import *
from datetime import datetime
from flask import Blueprint, jsonify, request, render_template
import json
import re

mod_api = Blueprint('api', __name__, url_prefix="/api")

def gen_response(status):
	response = {"status": status}
	return response

def gen_data_response(data):
	response = gen_response("Success")
	response["data"] = data
	return jsonify(data)

def gen_error_response(error_msg):
	response = gen_response("Error")
	response["error_msg"] = error_msg
	return jsonify(response)

@mod_api.route("/event/<title>")
def events(title):
	try:
		regex = re.compile(title)
		event_data = EventEntry.objects(title=regex)
		event_data = [get_raw_event(event) for event in event_data]
		return jsonify(event_data)
	except Exception as e:
		return gen_error_response(str(e))

@mod_api.route("/addevent/<title>")
def add_event_old(title):
	try:
		# This is temporary. 
		# In the future fields will be properly populated.
		new_event = EventEntry(
			title=title, 
			creator="admin",
			location="Princeton University",
			start_datetime=datetime.now(),
			end_datetime=datetime.now(),
			description="This is an event titled %s." % title).save()
		return(gen_data_response({"id": str(new_event.id)}))
	except Exception as e:
		return gen_error_response(str(e))

@mod_api.route("/event/add", methods=["PUT"])
def add_event():
	print(request.data)
	if not request.is_json:
		return gen_error_response("Request was not JSON.")
	data = request.get_json()
	# Check that the correct parameters have been given.
	for field in required_fields:
		if field not in data:
			return gen_error_response("Request was missing %s parameter." % field)
	# Try to add new event
	try:
		print(json.dumps(data))
		new_event = EventEntry.from_json(json.dumps(data))
		new_event.save()
		return gen_data_response({"id": str(new_event.id)})
	except NotUniqueError as e:
		return gen_error_response("An event already exists with that title.")
	except FieldDoesNotExist as e:
		return gen_error_response("Your request included a field that does not exist.")
	except Exception as e:
		return gen_error_response(str(e))
	# Return id of newly added event.
