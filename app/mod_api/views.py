from datetime import datetime
from flask import jsonify, make_response, request, render_template
from flask_httpauth import HTTPTokenAuth
from flask_login import login_required
import json
from app.mod_user.models import User
from . import api_module as mod_api
from . import controllers as controller
from .models import *
from app import CONFIG

auth = HTTPTokenAuth(scheme='Token')

success_text = "Success"
error_text = "Error"
failure_text = "Error"
internal_failure_message = "Something went wrong. Please contact a developer."
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

def gen_failure_response(failure_msg):
	# Only print failure message if in DEBUG mode. 
	# Otherwise, use a canned response.
	if CONFIG["DEBUG"]:
		return gen_error_response(failure_msg)
	else:
		return gen_error_response(internal_failure_message)

@auth.verify_token
def verify_token(token):
	# TODO: Make this less scary.
	if CONFIG["DEBUG"] and CONFIG["BYPASS_API_AUTH"]:
		return True

	user = User.verify_auth_token(token)
	if user is None:
		return False
	return True

# TODO: Show some sort of error message in browser if a search fails.
# More of a job for frontend, but I didn't want it to get lost in the HTML.
@auth.error_handler
def unauthorized():
	return make_response(jsonify({'error': 'Unauthorized access'}), 403)

@mod_api.route("/event/add", methods=["PUT"])
@auth.login_required
def add_event():
	if not request.is_json:
		return gen_error_response("Request was not JSON.")

	try:
		data = request.get_json()
		# Check that the correct parameters have been given.
		missing_fields = get_missing_fields(data)
		if len(missing_fields) > 0:
			return gen_error_response("Request was missing %s parameter(s)." % ",".join(missing_fields))
	except Exception as e:
		return gen_failure_response(str(e))

	# Make sure creator matches authorized user.
	try:
		user = User.get_user_in_token(request)
		if user is None or user.netid != data["creator"]:
			return gen_error_response("Attempted to create event for different user.")
	except AuthorizationError:
		return gen_error_response("Invalid authorization.")

	# Try to add new event
	try:
		new_event = controller.add_event(json.dumps(data))
		return gen_data_response({"id": str(new_event.id)})
	except NotUniqueError as e:
		return gen_error_response("An event already exists with that title.")
	except FieldDoesNotExist as e:
		return gen_error_response("Request included a field that does not exist.")
	except ValidationError as e:
		return gen_error_response("Request was malformatted.")
	except Exception as e:
		return gen_failure_response(str(e))
	# Return id of newly added event.

@mod_api.route("/event/get/<id>", methods=["GET"])
@auth.login_required
def get_event(id):
	try:
		event = controller.get_event(id)
		return gen_data_response(get_raw_event(event));
	except ValidationError as e:
		return gen_error_response("Request was malformatted.")
	except Exception as e:
		return gen_failure_response(str(e))

@mod_api.route("/event/delete/<id>", methods=["DELETE"])
@auth.login_required
def delete_event(id):
	try:
		event = controller.get_event(id)
		if event is None:
			return gen_error_response("No event with that id exists.")

		# Make sure it is the creator that is deleting the event.
		event_creator_netid = controller.get_event_creator(id)	
		try:
			user = User.get_user_in_token(request)
			if user is None or user.netid != event_creator_netid:
				return gen_error_response("Attempted to delete event for different user.")
		except AuthorizationError:
			return gen_error_response("Invalid authorization.")


		event = controller.delete_event(id)
		if event is None:
			return gen_error_response("No event with that id exists.")
		return gen_data_response(get_raw_event(event))
	except Exception as e:
		return gen_failure_response(str(e))

@mod_api.route("/event/search/<query>", defaults={"start_datetime":datetime.now()})
@mod_api.route("/event/search/<query>/<start_datetime>")
@auth.login_required
def event_search(query, start_datetime):
	try:
		events = controller.search_events(query, start_datetime)
		events = [get_raw_event(event) for event in events]
		return gen_data_response(events)
	except Exception as e:
		return gen_failure_response(str(e))

@mod_api.route("/user/get_events/<userid>")
@auth.login_required
def get_created_events(userid):
	try:
		user = controller.get_user_by_uid(userid)
		if user is None:
			return gen_error_response("No user with that id exists.")
		events = controller.get_events_by_creator(str(user.netid))
		events = [get_raw_event(event) for event in events]
		return gen_data_response(events)
	except Exception as e:
		return gen_failure_response(str(e))

@mod_api.route("/user/fav/add/<userid>/<eventid>")
@auth.login_required
def add_event_fav(userid, eventid):
	try:
		event = controller.get_event(eventid)
		user = controller.get_user_by_uid(userid)
		if event is None:
			return gen_error_response("No event with that id exists.")
		elif user is None:
			return gen_error_response("No user with that id exists.")
		if eventid not in user.favorites:
			controller.add_user_favorite(user, eventid)
			# increment the event's number of favorites
			controller.edit_event_favorites(eventid, 1)
		return jsonify(event.favorites) # need to return something or views gets angry
	except Exception as e:
		return gen_failure_response(str(e))

@mod_api.route("/user/fav/remove/<userid>/<eventid>")
@auth.login_required
def remove_event_fav(userid, eventid):
	try:
		event = controller.get_event(eventid)
		user = controller.get_user_by_uid(userid)
		if event is None:
			return gen_error_response("No event with that id exists.")
		elif user is None:
			return gen_error_response("No user with that id exists.")
		if eventid in user.favorites:
			controller.remove_user_favorite(user, eventid)
			controller.edit_event_favorites(eventid, -1)
		else:
			return gen_error_response("You can't un-favorite an event that isn't in your favorites!")
		return jsonify(event.favorites)
	except Exception as e:
		return gen_failure_response(str(e))

@mod_api.route("/user/fav/get/<userid>")
@auth.login_required
def get_favorites(userid):
	try:
		user = controller.get_user_by_uid(userid)
		if user is None:
			return gen_error_response("No user with that id exists.")
		return json.dumps(user.favorites)
	except Exception as e:
		return gen_failure_response(str(e))
