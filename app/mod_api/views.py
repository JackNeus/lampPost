from datetime import datetime
from flask import jsonify, make_response, request, render_template
from flask_httpauth import HTTPTokenAuth
from flask_login import login_required
import json
from app.mod_user.models import AuthorizationError, User, UserEntry
from . import api_module as mod_api
from . import controllers as controller
from . import error_handler
from .models import *
from app import CONFIG

auth = HTTPTokenAuth(scheme='Token')

success_text = "Success"
error_text = "Error"
failure_text = "Error"
banned_text = "You're banned from lampPost. Please contact a developer."
internal_failure_message = "Something went wrong. Please contact a developer."
event_dne_text = "No event with that id exists."
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

def get_user_in_token(request):
	user = None
	try:
		user = User.get_user_in_token(request)
	except AuthorizationError:
		pass
	return user

@mod_api.route("/event/add", methods=["PUT"])
@auth.login_required
def add_event():
	if not request.is_json:
		return gen_error_response("Request was not JSON.")

	try:
		data = request.get_json()
		if isinstance(data, str):
			# TODO: better error message
			return gen_failure_response("Request must be JSON, not string.")
	except:
		return gen_error_response("Request was malformatted.")

	try:
		# Check that the correct parameters have been given.
		missing_fields = get_missing_fields(data)
		if len(missing_fields) > 0:
			return gen_error_response("Request was missing %s parameter(s)." % ",".join(missing_fields))

		# Make sure creator matches authorized user.
		user = User.get_user_in_token(request)
		if user is None:
			return gen_error_response("Invalid authorization.")
		if user.netid != data["creator"]:
			return gen_error_response("Attempted to create event for different user.")
		if controller.is_banned(user):
			return gen_error_response(banned_text)
		
		# Try to add new event.
		new_event = controller.add_event(data)
		# Return id of newly added event.
		return gen_data_response({"id": str(new_event.id)})
	except Exception as e:
		return gen_error_response(error_handler.main_handler(e))

@mod_api.route("/event/get/<id>", methods=["GET"])
def get_event(id):
	try:
		user = get_user_in_token(request)
		event = controller.get_event(id)
		# Make sure event is visible.
		if event is not None and not controller.is_visible(event, user):
			event = None
		if event is None:
			return gen_error_response(event_dne_text)
		return gen_data_response(get_raw_event(event));
	except Exception as e:
		return gen_error_response(error_handler.main_handler(e))

@mod_api.route("/event/edit/<id>", methods=["POST"])
@auth.login_required
def edit_event(id):
	if not request.is_json:
		return gen_error_response("Request was not JSON.")
	try:
		data = request.get_json()
	except Exception as e:
		return gen_failure_response("Request was malformatted.")

	# Make sure creator matches authorized user.
	try:
		event = controller.get_event(id)

		if event is None:
			return gen_error_response(event_dne_text)
		user = User.get_user_in_token(request)
		if user is None:
			return gen_error_response("Invalid authorization.")
		if user.netid != event.creator:
			return gen_error_response("Attempted to edit event for different user.")
		if controller.is_banned(user):
			return gen_error_response(banned_text)

		updated_event = controller.edit_event(id, data)
	except Exception as e:
		return gen_error_response(error_handler.main_handler(e))

	if updated_event is None:
		return gen_error_response(event_dne_text)
	return gen_data_response(get_raw_event(updated_event))

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
			if user is None:
				return gen_error_response("Invalid authorization.")
			if user.netid != event_creator_netid:
				return gen_error_response("Attempted to delete event for different user.")
		except AuthorizationError:
			return gen_error_response("Invalid authorization.")

		event = controller.delete_event(id)
		if event is None:
			return gen_error_response(event_dne_text)
		return gen_data_response(get_raw_event(event))
	except Exception as e:
		return gen_error_response(error_handler.main_handler(e))

@mod_api.route("/event/search/", defaults={"query":"","start_datetime":datetime.now()}, methods=["GET", "POST"])
@mod_api.route("/event/search/<query>", defaults={"start_datetime":datetime.now()}, methods=["GET", "POST"])
@mod_api.route("/event/search/<query>/<start_datetime>", methods=["GET", "POST"])
def event_search(query, start_datetime):
	tags = None
	# Alternatively, allow user to send json parameters.
	if request.is_json:
		try:
			data = request.get_json()
			# TODO: Uncomment this stuff when we have test coverage.
			
			if "query" in data:
				query = data["query"]
			
			if "start_datetime" in data:
				start_datetime = data["start_datetime"]
			if "tags" in data:
				tags = data["tags"]
		except Exception as e:
			print(type(e))
			return gen_failure_response("Request was malformatted.")

	try:
		user = get_user_in_token(request)
		events = controller.search_events(query, start_datetime, user=user, tags=tags)
		events = [get_raw_event(event) for event in events]
		return gen_data_response(events)
	except Exception as e:
		return gen_error_response(error_handler.main_handler(e))

@mod_api.route("/user/get_events/<userid>", defaults={"include_past":True}, methods=["GET"])
@mod_api.route("/user/get_events/<userid>/<include_past>", methods=["GET"])
@auth.login_required
def get_created_events(userid, include_past):
	try:
		user = controller.get_user_by_uid(userid)
		if user is None:
			return gen_error_response("No user with that id exists.")

		# Make sure creator matches authorized user.
		try:
			token_user = User.get_user_in_token(request)
			if token_user is None or token_user.netid != user.netid:
				return gen_error_response("Attempted to get created events for different user.")
		except AuthorizationError:
			return gen_error_response("Invalid authorization.")
		if isinstance(include_past, str):
			# include_past defaults to True when an invalid value is passed.
			include_past = include_past != "False"
		events = controller.get_events_by_creator(str(user.netid), include_past)
		events = [get_raw_event(event) for event in events]
		
		return gen_data_response(events)
	except Exception as e:
		return gen_error_response(error_handler.main_handler(e))

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

		# Make sure favoriter matches authorized user.
		try:
			token_user = User.get_user_in_token(request)
			if token_user is None or token_user.netid != user.netid:
				return gen_error_response("Attempted to add a favorite for different user.")
		except AuthorizationError:
			return gen_error_response("Invalid authorization.")

		if eventid not in user.favorites:
			controller.add_user_favorite(user, eventid)
		return gen_data_response(event.favorites) # need to return something or views gets angry
	except Exception as e:
		return gen_error_response(error_handler.main_handler(e))

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

		# Make sure favoriter matches authorized user.
		try:
			token_user = User.get_user_in_token(request)
			if token_user is None or token_user.netid != user.netid:
				return gen_error_response("Attempted to remove a favorite for different user.")
		except AuthorizationError:
			return gen_error_response("Invalid authorization.")

		if eventid in user.favorites:
			controller.remove_user_favorite(user, eventid)
		else:
			return gen_error_response("You can't un-favorite an event that isn't in your favorites!")
		return gen_data_response(event.favorites)
	except Exception as e:
		return gen_error_response(error_handler.main_handler(e))

@mod_api.route("/user/fav/get/<userid>")
@auth.login_required
def get_favorites(userid):
	try:
		user = controller.get_user_by_uid(userid)
		if user is None:
			return gen_error_response("No user with that id exists.")

		# Make sure caller matches authorized user.
		try:
			token_user = User.get_user_in_token(request)
			if token_user is None or token_user.netid != user.netid:
				return gen_error_response("Attempted to get a different user's favorites.")
		except AuthorizationError:
			return gen_error_response("Invalid authorization.")
			
		try:
			events = controller.get_favorite_events(user.favorites)
			events = [get_raw_event(event) for event in events]
			return gen_data_response(events)
		except Exception as e:
			return gen_error_response(error_handler.main_handler(e))
	except Exception as e:
		return gen_error_response(error_handler.main_handler(e))

# Allow a user to report an event.
@mod_api.route("/event/report/<eventid>", methods=["PUT"])
@auth.login_required
def report_event(eventid):
	try:
		if not request.is_json:
			return gen_error_response("Request was not JSON.")

		try:
			data = request.get_json()
		except Exception as e:
			return gen_error_response("JSON was malformatted.")

		if "reason" not in data:
			return gen_error_response("Request was missing field 'reason'.")

		try:
			user = User.get_user_in_token(request)
			report = controller.add_report(user, data["reason"], eventid)
		except RateError as e:
			return gen_error_response(str(e))

		return gen_data_response(report)
	except ValidationError as e:
		return gen_error_response(str(e))
	except Exception as e:
		return gen_error_response(error_handler.main_handler(e))

# Get trending events.
@mod_api.route("/event/trending", methods=["GET"])
def trending_events():
	try:
		user = get_user_in_token(request)
		trending_events = controller.get_trending_events(user)
		trending_events = [get_raw_event(event) for event in trending_events]
		return gen_data_response(trending_events)
	except Exception as e:
		return gen_error_response(error_handler.main_handler(e))

# Send in feedback.
@mod_api.route("/feedback/", methods=["PUT"])
@mod_api.route("/feedback", methods=["PUT"])
def send_feedback():
	try:
		if not request.is_json:
			return gen_error_response("Request was not JSON.")

		try:
			data = request.get_json()
		except Exception as e:
			return gen_error_response("JSON was malformatted.")

		return gen_data_response(controller.add_feedback(data))
	except Exception as e:
		return gen_error_response(error_handler.main_handler(e))
