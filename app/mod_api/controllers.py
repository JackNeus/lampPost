from .models import *
from datetime import datetime
from flask import Blueprint, jsonify, request, render_template
import json
import re

mod_api = Blueprint('api', __name__, url_prefix="/api")

success_text = "Success"
error_text = "Error"
internal_error_text = "Internal error. Please contact a developer."
def gen_response(status):
	response = {"status": status}
	return response

def gen_data_response(data):
	response = gen_response(success_text)
	response["data"] = data
	return jsonify(response)

def gen_error_response(error_msg):
	response = gen_response(error_text)
	response["error_msg"] = error_msg
	return jsonify(response)

@mod_api.route("/event/add", methods=["PUT"])
def add_event():
	if not request.is_json:
		return gen_error_response("Request was not JSON.")
	data = request.get_json()
	# Check that the correct parameters have been given.
	for field in required_fields:
		if field not in data:
			return gen_error_response("Request was missing %s parameter." % field)
	# Try to add new event
	try:
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

@mod_api.route("/event/get/<id>", methods=["GET"])
def get_event(id):
	try:
		event = EventEntry.objects(id=id)
		if len(event) == 0:
			return gen_error_response("No event with that id exists.")
		if len(event) > 1:
			# More than 1 event returned for the given ID, which is very bad
			return gen_error_response(internal_error_text)
		return gen_data_response(get_raw_event(event[0]));
	except Exception as e:
		return gen_error_response(str(e))

@mod_api.route("/event/delete/<id>", methods=["DELETE"])
def delete_event(id):
	try:
		event = EventEntry.objects(id=id)
		if len(event) == 0:
			return gen_error_response("No event with that id exists.")
		if len(event) > 1:
			# This cannot and should not ever happen.
			return gen_error_response(internal_error_text);
		# Delete event.
		event[0].delete()
		return gen_response(success_text)
	except Exception as e:
		return gen_error_response(str(e))

# Search works as follows:
# The query is tokenized (whitespace delimited).
# For each token, events with tokens (whitespace delimited) matching the token are aggregated.
# The current event fields queried are title, location, and creator.
# The intersection of results for the tokens is returned.
# Only events ending after start_datetime are included in search results.
@mod_api.route("/event/search/<query>", defaults={"start_datetime":datetime.now()})
@mod_api.route("/event/search/<query>/<start_datetime>")
def event_search(query, start_datetime):
	try:
		tokens = query.split()
		results = []
		for token in tokens:
			# Need to take creator_display into account.
			token_re = re.compile("\s*" + token)
			events = set(EventEntry.objects(title = token_re, end_datetime__gte = start_datetime))
			events = events.union(set(EventEntry.objects(location = token_re, end_datetime__gte = start_datetime)))
			events = events.union(set(EventEntry.objects(creator = token_re, end_datetime__gte = start_datetime)))
			results.append(events)
		events = set.intersection(*results)
		events = [get_raw_event(event) for event in events]
		return gen_data_response(events)
	except Exception as e:
		return gen_error_response(str(e))