from copy import deepcopy
from datetime import datetime, timedelta
from dateutil.parser import *
import dateutil.parser
import functools
from itsdangerous import TimedJSONWebSignatureSerializer as Serializer
import json
import requests
import sys
import os
from subprocess import call, check_output
import traceback
import unittest

# Get JSONified response data.
def get_data(response):
	return json.loads(response.text)

# Get function name from string representation of a function, 
# which contains extra junk.
def get_test_name(f):
	f = str(f)
	return f[f.index("function")+9:f.index(" at")]

# Comparison function for JSON event objects.
# For all fields in source, checks if the corresponding fields in record match.
# Ignores extra fields in record.
def compare_events(source, record):
	source = deepcopy(source)
	record = deepcopy(record)
	for field in source:
		if field == "instances":
			# Source and record have different numbers of instances.
			if len(source[field]) != len(record[field]):
				return False

			# Extra formatting for datetimes because we don't know what format 
			# they're in in source.
			for subfield in ["start_datetime", "end_datetime"]:
				for i in range(len(source[field])):
					source[field][i][subfield] = dateutil.parser.parse(source[field][i][subfield]).timestamp()
					record[field][i][subfield] = dateutil.parser.parse(record[field][i][subfield]).timestamp()

			def cmp(x, y):
				if x["start_datetime"] == y["start_datetime"]:
					return x["end_datetime"] - y["end_datetime"]
				return x["start_datetime"] - y["start_datetime"]
			source["instances"] = sorted(source["instances"], key=functools.cmp_to_key(cmp))
			record["instances"] = sorted(record["instances"], key=functools.cmp_to_key(cmp))

			# For each instance:
			for i in range(len(source[field])):
				# For each field in instance:
				for subfield in source[field][i]:
					source_value = source[field][i][subfield]
					record_value = record[field][i][subfield]

					# Fields not equal.
					if source_value != record_value:
						return False
		else:
			# Fields not equal.
			if source[field] != record[field]:
				return False
	return True

# Function I stole from the app. This is pretty janky.
def generate_auth_token(netid, expiration = 3600 * 24 * 7):
	uid = user_ids[netid]
	s = Serializer("this_secret_key_is_for_testing_only", expires_in = expiration)
	token = s.dumps({'id': uid})
	# Hack found after 3 hours of debugging.
	return str(token)[2:-1]

def is_success(r):
	return r["status"] == "Success"

def is_error(r):
	return r["status"] == "Error"

app_url = "http://localhost:5002/api"

def get_requests_method(method):
	m = {"get": requests.get,
		 "put": requests.put,
		 "post": requests.post,
		 "delete": requests.delete}
	return m[method.lower()]

def make_request(method, endpoint, params="", token=None, json=None):
	headers = None
	if token is not None:
		headers = {"Authorization": "Token %s" % token}
	request = get_requests_method(method)
	r = request(app_url + endpoint + params, json=json, headers=headers)
	assert r.status_code == 200
	return get_data(r)

def make_add_event_request(event_data, token=None):
	return make_request("put", "/event/add", json=event_data, token=token)

def make_get_event_request(event_id, token=None):
	return make_request("get", "/event/get/", event_id, token)

def make_delete_event_request(event_id, token=None):
	return make_request("delete", "/event/delete/", event_id, token)

def make_edit_event_request(event_id, data, token=None):
	return make_request("post", "/event/edit/", event_id, token, data)

def make_add_fav_request(user_id, event_id, token=None):
	return make_request("get", "/user/fav/add/", "%s/%s" % (user_id, event_id), token)

def make_del_fav_request(user_id, event_id, token=None):
	headers = None
	if token is not None:
		headers = {"Authorization": "Token %s" % token}
	r = requests.get(app_url + "/user/fav/remove/" + user_id + "/" + event_id, headers=headers)
	return r

def make_get_fav_request(user_id, token=None):
	return make_request("get", "/user/fav/get/", user_id, token)
	
def make_get_created_events_request(user_id, token=None):
	return make_request("get", "/user/get_events/", user_id, token)

def make_report_event_request(event_id, report, token=None):
	return make_request("put", "/event/report/", event_id, token, json=report)

def make_get_trending_request(token=None):
	return make_request("get", "/event/trending", token=token)

def make_search_request(query, start_datetime=None, token=None, json=None):
	params = query
	if start_datetime is not None:
		params += "/" + str(start_datetime)
	return make_request("get", "/event/search/", params, token, json=json)

def make_feedback_request(data=None, token=None):
	return make_request("put", "/feedback/", json=data, token=token)

user_ids = {}
dummy_events = {}

def setup():
	def add_user(netid):
		r = check_output('echo "use lamppost\n%s" | mongo --port 12345' % ("db.user_entry.insert({\'netid\':\'%s\'})" % netid),
				 shell = True)
		r = check_output('echo "use lamppost\n%s" | mongo --port 12345' % ("db.user_entry.find({\'netid\':\'%s\'})" % netid),
				 shell = True)
		user_id_line = str(r.split(b'\n')[-3]).split(",", 1)[0]
		user_id = user_id_line[user_id_line.index("ObjectId")+10:-2]
		return user_id
	global user_ids
	for user in ["jneus", "tpollner", "bwk", "rrliu"]:
		user_ids[user] = add_user(user)

	global dummy_events
	with open('test/test_data.json', 'r') as f:
		dummy_events = json.load(f)

valid_events = {}

def test_add_valid_events():
	for event in dummy_events:
		r = make_add_event_request(event, generate_auth_token(event["creator"]))
		assert is_success(r)
		valid_events[r["data"]["id"]] = event

def test_get_valid_events():
	for event_id in valid_events:
		r = make_get_event_request(event_id)
		visibility = 0
		if 'visibility' in valid_events[event_id]:
			visibility = valid_events[event_id]["visibility"]
		if visibility > 0:
			assert is_error(r)
		else:
			assert is_success(r)
			assert compare_events(valid_events[event_id], r["data"])
      
def test_delete_valid_events():
	for event_id in valid_events:
		creator_netid = valid_events[event_id]["creator"]
		r = make_delete_event_request(event_id, generate_auth_token(creator_netid))
		assert is_success(r)
		assert compare_events(valid_events[event_id], r["data"])

base_event = {"title": "Party", "host":"LampPost Team", "creator": "bwk",
				  "description": "This event should cause some trouble.",
				  "instances": [{"start_datetime": "3pm April 1 2100",
				  				 "end_datetime": "4pm April 1 2100",
				  				 "location": "Princeton University"},
				  				 {"start_datetime": "3pm April 2 2100",
				  				 "end_datetime": "4pm April 2 2100",
				  				 "location": "Princeton University"}],
				  	"favorites": 10}

def test_add_event_missing_field():
	# Missing required fields.
	for field in ["title", "host", "creator", "description", "instances"]:
		# Remove field.
		no_value = deepcopy(base_event)
		del no_value[field]
		r = make_add_event_request(no_value, generate_auth_token(base_event["creator"]))
		assert is_error(r)
		assert "missing" in r["error_msg"]

def test_add_event_bad_type():		
	# String fields type check.
	for field in ["title", "host", "description", "tags"]:
		# Incorrectly-typed value.
		bad_value = deepcopy(base_event)
		bad_value[field] = 123
		r = make_add_event_request(bad_value, generate_auth_token(base_event["creator"]))
		assert is_error(r)
		if field == "creator":
			assert "different" in r["error_msg"]
		else:
			assert "wrong type" in r["error_msg"]
	# Test string fields inside tags.
	bad_value = deepcopy(base_event)
	bad_value["tags"] = [123, 456]
	r = make_add_event_request(bad_value, generate_auth_token(base_event["creator"]))
	assert is_error(r)
	assert "wrong type" in r["error_msg"]

def test_add_event_bad_field_length_short():		
	# String fields length check.
	for field, length in [("title", 5), ("host",3), ("description", 10)]:
		# Insufficiently long value.
		short_value = deepcopy(base_event)
		short_value[field] = "A"*(length-1)
		r = make_add_event_request(short_value, generate_auth_token(short_value["creator"]))
		assert is_error(r)	
		assert "short" in r["error_msg"]

	# Instance subfields
	for field, length in [("location", 3)]:
		# Insufficiently long value.
		short_value = deepcopy(base_event)
		short_value["instances"][0][field] = "A"*(length-1)
		r = make_add_event_request(short_value, generate_auth_token(short_value["creator"]))
		assert is_error(r)
		assert "short" in r["error_msg"]
	
def test_add_event_bad_field_length_long():		
	# String fields length check.
	for field, length in [("title", 100), ("host",100), ("description", 10000)]:
		long_value = deepcopy(base_event)
		long_value[field] = "A"*(length+1)
		r = make_add_event_request(long_value, generate_auth_token(long_value["creator"]))
		assert is_error(r)
		assert "long" in r["error_msg"]
	
	# Instance subfields
	for field, length in [("location", 100)]:
		long_value = deepcopy(base_event)
		long_value["instances"][0][field] = "A"*(length+1)
		r = make_add_event_request(long_value, generate_auth_token(long_value["creator"]))
		assert is_error(r)
		assert "long" in r["error_msg"]

def test_add_event_bad_instance_data():
	# Instances tests.

	# End datetime earlier than start datetime.
	time_swap = deepcopy(base_event)
	time_swap["instances"][0]["start_datetime"] = base_event["instances"][0]["end_datetime"]
	time_swap["instances"][0]["end_datetime"] = base_event["instances"][0]["start_datetime"]
	r = make_add_event_request(time_swap, generate_auth_token(time_swap["creator"]))
	assert is_error(r)
	assert "earlier" in r["error_msg"]
	
	# Missing required fields.
	for field in ["location", "start_datetime", "end_datetime"]:
		no_value = deepcopy(base_event)
		del no_value["instances"][0][field]
		r = make_add_event_request(no_value, generate_auth_token(no_value["creator"]))
		assert is_error(r)
		assert "missing" in r["error_msg"]

	# Insufficiently long value.
	short_value = deepcopy(base_event)
	short_value["instances"][0]["location"] = "AB"
	r = make_add_event_request(short_value, generate_auth_token(short_value["creator"]))
	assert is_error(r)
	assert "short" in r["error_msg"]

def test_add_event_extra_field():
	# This test is currently disabled because the EventEntry type has
	# meta: strict disabled and extra fields are quietly ignored.
	assert False

	# Extraneous fields.
	extra_field = deepcopy(base_event)
	extra_field["bad_field_does_not_exist"] = "uh oh"
	r = make_add_event_request(extra_field)
	assert is_error(r)
	assert "malformatted" in r["error_msg"]

# Try to get event that does not exist.
def test_get_event_event_dne():
	r = make_get_event_request("5ac579ff1b41577c54130835", generate_auth_token("bwk"))
	assert is_error(r)
	assert "exist" in r["error_msg"]

# Try to get event with invalid id.
def test_get_event_bad_id():
	r = make_get_event_request("bad_id_format", generate_auth_token("bwk"))
	assert is_error(r)
	assert "not a valid" in r["error_msg"]

# Try to delete event that does not exist.
def test_delete_event_event_dne():
	r = make_delete_event_request("5ac579ff1b41577c54130835", generate_auth_token("bwk"))
	assert is_error(r)
	assert "exist" in r["error_msg"]

# Try to delete event with invalid id.
def test_delete_event_bad_id():
	r = make_delete_event_request("bad_id_format", generate_auth_token("bwk"))
	assert is_error(r)
	assert "not a valid" in r["error_msg"]

def abort():
	print("Something went wrong.")
	print("Please restart the testing platform (test.sh).")
	exit()

# Base for tests.
# If event_to_add is not None, that event will be used.
def make_test(test_body, event_to_add = None):
	# Setup
	if event_to_add is not None:
		new_event = deepcopy(event_to_add)
	else:
		new_event = deepcopy(base_event)
	creator_netid = new_event["creator"]
	r = make_add_event_request(new_event, generate_auth_token(creator_netid))
	assert is_success(r)
	event_id = r["data"]["id"]

	try: 
		test_body(new_event, event_id, creator_netid)
	except Exception as e:  # Temporarily catch exception.
		# Try to clean-up, if we can't, abort.
		try:
			r = make_delete_event_request(event_id, generate_auth_token(creator_netid))
		except:
			abort()
		raise e  # Reraise exception

	# Cleanup
	r = make_delete_event_request(event_id, generate_auth_token(creator_netid))
	assert is_success(r)

# Base for tests in which multiple events need to be added.
# generator should be a function that takes a single integer parameter
# and returns a single event.
def make_test_multi(test_body, num_events, generator):
	events = []
	def teardown():
		for event in events:
			r = make_delete_event_request(event["_id"], generate_auth_token(event["creator"]))
			if is_error(r):
				print(r)
				abort()
	try:
		# Setup
		for i in range(num_events):
			new_event = generator(i)
			creator_netid = new_event["creator"]
			r = make_add_event_request(new_event, generate_auth_token(creator_netid))
			assert is_success(r)
			new_event["_id"] = r["data"]["id"]
			events.append(new_event)
	except Exception as e:
		raise e
		teardown()
		assert False

	try:
		test_body(events)
	except Exception as e:  # Temporarily catch exception.
		# Try to cleanup, if we can't, abort
		teardown()
		raise e  # Reraise exception

	# Cleanup
	teardown()

# Valid event editing.
def test_edit_event_valid():
	def test(new_event, event_id, creator_netid):
		event_edits = {"title": "Festival", "host": "LampPost Users",
					  "description": "This event is A OK.",
					  "instances": [{"start_datetime": "3pm April 2 2100",
					  				 "end_datetime": "4pm April 2 2100",
					  				 "location": "Princeton University"},
					  				 {"start_datetime": "3pm April 2 2100",
					  				 "end_datetime": "4pm April 2 2100",
					  				 "location": "Yale University"}],
					  "tags": ["Dance", "Party"],
					  "tags": []}
		# Try editing each field separately.
		for field in event_edits:
			if field is not "instances":
				edit = {field: event_edits[field]}
				new_event[field] = deepcopy(event_edits[field])
				r = make_edit_event_request(event_id, edit, generate_auth_token(creator_netid))
				assert is_success(r)
				assert compare_events(new_event, r["data"])
	make_test(test)

def test_edit_event_system_fields():
	def test(new_event, event_id, creator_netid):
		event_edit = {"creator":"victim", "id": "5ac579ff1b41577c54130835"}
		r = make_edit_event_request(event_id, event_edit, generate_auth_token(creator_netid))
		assert is_success(r)
		# Event should not have changed.
		assert compare_events(new_event, r["data"])
	make_test(test)

def test_edit_event_extra_field():
	def test(new_event, event_id, creator_netid):
		# Extraneous fields.
		extra_field = deepcopy(base_event)
		extra_field["bad_field_does_not_exist"] = "uh oh"
		r = make_edit_event_request(event_id, extra_field, generate_auth_token(creator_netid))
	make_test(test)

# Try to edit event that does not exist.
def test_edit_event_event_dne():
	r = make_edit_event_request("5ac579ff1b41577c54130835", {}, generate_auth_token("bwk"))
	assert is_error(r)
	assert "exist" in r["error_msg"]

# Try to delete event with invalid id.
def test_edit_event_bad_id():
	r = make_edit_event_request("bad_id_format", {}, generate_auth_token("bwk"))
	assert is_error(r)
	assert "not a valid" in r["error_msg"]

# Try to edit event that does not belong to us.
def test_edit_event_different_creator():
	def test(new_event, event_id, creator_netid):
		r = make_edit_event_request(event_id, {"description":"My event sucks!"}, generate_auth_token("jneus"))
		assert is_error(r)
	make_test(test)

def test_edit_event_bad_poster_url():
	# Events whose poster URLs do not start with 'http://princeton-lamppost.s3.amazonaws.com/'
	# are invalid.
	def test(new_event, event_id, creator_netid):
		edits = {"poster": "http://www.google.com/logo.jpg"}
		r = make_edit_event_request(event_id, edits, generate_auth_token(creator_netid))
		assert is_error(r)
	make_test(test)
  
# Try to add a valid favorite.
def test_add_valid_fav():
	def test(new_event, event_id, creator_netid):
		r = make_add_fav_request(user_ids[creator_netid], event_id, generate_auth_token(creator_netid))
		assert is_success(r)
	make_test(test)

# Try to add a favorite to a different user.
def test_add_fav_wrong_user():
	def test(new_event, event_id, creator_netid):
		r = make_add_fav_request(user_ids["rrliu"], event_id, generate_auth_token(creator_netid))
		assert is_error(r)
	make_test(test)

# Try to favorite an event twice. Event should stay favorited.
def test_add_double_favorite():
	def test(new_event, event_id, creator_netid):
		r = make_add_fav_request(user_ids[creator_netid], event_id, generate_auth_token(creator_netid))
		assert is_success(r)
		r = make_add_fav_request(user_ids[creator_netid], event_id, generate_auth_token(creator_netid))
		assert is_success(r)
	make_test(test)

# Try to add a favorite to an invalid event id.
def test_add_fav_bad_event():
	def test(new_event, event_id, creator_netid):
		r = make_add_fav_request(user_ids[creator_netid], "5ac579ff1b41577c54130835", generate_auth_token(creator_netid))
		assert is_error(r)
		assert "exist" in r["error_msg"]
	make_test(test)

# Try to delete a valid favorite.
def test_del_valid_fav():
	def test(new_event, event_id, creator_netid):
		r = make_add_fav_request(user_ids[creator_netid], event_id, generate_auth_token(creator_netid))
		assert is_success(r)
		r = make_del_fav_request(user_ids[creator_netid], event_id, generate_auth_token(creator_netid))
		assert is_success(get_data(r))
	make_test(test)

# Try to delete a favorite without authorization.
def test_del_fav_no_auth():
	def test(new_event, event_id, creator_netid):
		r = make_add_fav_request(user_ids[creator_netid], event_id, generate_auth_token(creator_netid))
		assert is_success(r)
		r = make_del_fav_request(user_ids[creator_netid], event_id)
		assert r.status_code == 403
	make_test(test)

# Try to delete a favorite that doesn't exist.
def test_del_fav_no_fav():
	def test(new_event, event_id, creator_netid):
		r = make_del_fav_request(user_ids[creator_netid], event_id, generate_auth_token(creator_netid))
		r = get_data(r)
		assert is_error(r)
		assert "isn't in" in r["error_msg"]
	make_test(test)

# Try to get a valid user's favorites.
def test_get_valid_fav():
	def test(new_event, event_id, creator_netid):
		r = make_add_fav_request(user_ids[creator_netid], event_id, generate_auth_token(creator_netid))
		assert is_success(r)
		r = make_get_fav_request(user_ids[creator_netid], generate_auth_token(creator_netid))
		assert is_success(r)
	make_test(test)

# Try to get a different user's favorites.
def test_get_fav_wrong_user():
	def test(new_event, event_id, creator_netid):
		r = make_add_fav_request(user_ids[creator_netid], event_id, generate_auth_token(creator_netid))
		assert is_success(r)
		r = make_get_fav_request(user_ids["rrliu"], generate_auth_token(creator_netid))
		assert is_error(r)
		assert "different" in r["error_msg"]
	make_test(test)

def test_get_created_events_wrong_token():
	r = make_get_created_events_request(user_ids["rrliu"], generate_auth_token("jneus"))
	assert is_error(r)
	assert "different" in r["error_msg"]

# Valid report of event.
def test_report_event():
	def test(new_event, event_id, creator_netid):
		report = {"reason": "I hate events. I hate lamp posts. What more can I say?"}
		r = make_report_event_request(event_id, report, generate_auth_token("jneus"))
		assert is_success(r)
		data = json.loads(r["data"])
		assert data["reporter"] == "jneus"
		assert data["reason"] == report["reason"]
	make_test(test)

# Reason is too short.
def test_report_event_short_reason():
	def test(new_event, event_id, creator_netid):
		report = {"reason": "bad"}
		r = make_report_event_request(event_id, report, generate_auth_token("rrliu"))
		assert is_error(r)
		assert "short" in r["error_msg"]
	make_test(test)	

def generate_event(i):
	event = deepcopy(base_event)
	event["title"] += str(i)
	event["favorites"] = i
	event["visibility"] = (i % 2) == 0
	now = datetime.now().replace(second=0, microsecond=0)
	event["instances"][0]["start_datetime"] = str(now)
	event["instances"][0]["end_datetime"] = str(now + timedelta(hours=1))
	return event

trending_size = 15

def test_trending_event_valid_no_auth():
	def test(new_events):
		r = make_get_trending_request()
		assert is_success(r)
		expected_trending = sorted(new_events, key=lambda x: x["favorites"], reverse=True)
		# We should only get back public events.
		expected_trending = list(filter(lambda x: x["visibility"] == 0, expected_trending))
		for i in range(len(r['data'])):
			assert compare_events(expected_trending[i], r['data'][i])
	make_test_multi(test, trending_size + 5, generate_event)

def test_trending_event_valid():
	def test(new_events):
		r = make_get_trending_request(generate_auth_token("jneus"))
		assert is_success(r)
		expected_trending = sorted(new_events, key=lambda x: x["favorites"], reverse=True)
		for i in range(len(r['data'])):
			assert compare_events(expected_trending[i], r['data'][i])
	make_test_multi(test, trending_size + 5, generate_event)

# Make sure that all trending events occur sometime in the next week.
def test_trending_event_date_range():
	now = datetime.now().replace(second=0, microsecond=0)
	d = timedelta(days=1)

	# Each element in the array is instance data for an event.
	# Each tuple in an element is an instance in the form of (start time, end time).
	test_event_datetimes = [[(now - d, now)], 
		[(now - 7 * d, now - d)], 
		[(now - 7 * d, now - d), (now + d, now + 10 * d)],
		[(now, now + d), (now, now + 2 * d)], 
		[(now + 99 * d, now + 100 * d)], 
		[(now - d, now - timedelta(minutes = 1))],
		[(now - 10 * d, now - 9 * d), (now + 10 * d, now + 11 * d)]]
	# Hardcoded inrange answers.
	test_event_inrange = [True, False, True, True, False, True, False]
	assert len(test_event_datetimes) == len(test_event_inrange)

	def test_data(i):
		trending_event = generate_event(i)
		if i >= len(test_event_datetimes):
			return trending_event
		trending_event["instances"] = []
		for start, end in test_event_datetimes[i]:
			trending_event["instances"].append({
				'location': 'trend city',
				'start_datetime': str(start),
				'end_datetime': str(end)
				})		
		return trending_event

	# Is event in the correct date range to be eligible for 'trending'?
	def in_range(event):
		for instance in event["instances"]:
			start_in_range = parse(instance["end_datetime"]) >= now - timedelta(minutes = 5)
			end_in_range = parse(instance["start_datetime"]) <= now + timedelta(days = 7)
			if start_in_range and end_in_range:
				return True
		return False

	def test(new_events):
		r = make_get_trending_request(generate_auth_token("jneus"))
		
		assert is_success(r)
		events_in_range = filter(in_range, new_events)
		expected_trending = sorted(events_in_range, key=lambda x: x["favorites"], reverse=True)
		
		for i in range(len(r['data'])):
			assert compare_events(expected_trending[i], r['data'][i])
		# As an extra sanity check, look at hardcoded answer key.
		# This relies on the fact that test_data(i) has i favorites.
		expected_events = set(filter(lambda x: test_event_inrange[x], range(len(test_event_inrange))))
		
		for i in range(len(r['data'])):
			assert r['data'][i]['favorites'] in expected_events
			expected_events.remove(r['data'][i]['favorites'])
		assert len(expected_events) == 0

	make_test_multi(test, len(test_event_datetimes), test_data)

# Can't add two reports within a certain number of seconds of one another.
def test_report_two_reports():
	def test(new_event, event_id, creator_netid):
		report = {"reason": "This event is AGAINST my ideals."}
		r = make_report_event_request(event_id, report, generate_auth_token("bwk"))
		assert is_success(r)
		r = make_report_event_request(event_id, report, generate_auth_token("bwk"))
		assert is_error(r)
		assert "must wait" in r["error_msg"]
	make_test(test)

def get_dummy_event(i):
	return deepcopy(dummy_events[i])

def get_dummy_event_now(i):
	event = get_dummy_event(i)
	today = datetime.now() + timedelta(minutes=10)
	yesterday = today - timedelta(days=1)
	event["instances"][0]["start_datetime"] = str(yesterday)
	event["instances"][0]["end_datetime"] = str(today + timedelta(hours=i-1))
	# Delete other instances.
	event["instances"] = event["instances"][:1]
	return event 

def get_ids(events):
	return set(map(lambda x: x["_id"], events))

# Empty search query.
def test_search_empty():
	def test(new_events):
		r = make_search_request("", None, token=generate_auth_token("bwk"))
		assert is_success(r)
		assert len(r["data"]) == 0
	make_test_multi(test, len(dummy_events), get_dummy_event)

# Check that an unauthenticated search only returns public events.
def test_search_no_auth():
	def test(new_events):
		r = make_search_request("*", None)
		assert is_success(r)
		expected = filter(lambda x: "visibility" not in x or x["visibility"] == 0, new_events)
		expected_ids = get_ids(expected)
		event_ids = get_ids(r["data"])
		assert expected_ids == event_ids
	make_test_multi(test, len(dummy_events), get_dummy_event)

# Check that an authenticated search for '*' returns all events.
def test_search_all():
	def test(new_events):
		r = make_search_request("*", None, token=generate_auth_token("bwk"))
		assert is_success(r)
		expected_ids = get_ids(new_events)
		event_ids = get_ids(r["data"])

		assert expected_ids == event_ids
	make_test_multi(test, len(dummy_events), get_dummy_event)

# Check that when a start time is not given, the current time is used.
def test_search_default_starttime():
	def test(new_events):
		r = make_search_request("*", None, token=generate_auth_token("bwk"))
		assert is_success(r)
		expected = filter(lambda x: parse(x["instances"][0]["end_datetime"]) >= datetime.now(), new_events)
		expected_ids = get_ids(expected)
		event_ids = get_ids(r["data"])
		assert expected_ids == event_ids
	make_test_multi(test, len(dummy_events), get_dummy_event_now)

# Standard start time check.
def test_search_starttime():
	def test(new_events):
		last_week = datetime.now() - timedelta(days=7)
		r = make_search_request("*", last_week, token=generate_auth_token("bwk"))
		assert is_success(r)
		expected_ids = get_ids(new_events)
		event_ids = get_ids(r["data"])
		assert expected_ids == event_ids
	make_test_multi(test, len(dummy_events), get_dummy_event_now)

def test_search_tag():
	def test(new_events):
		expected = filter(lambda x: x["title"] == "Conference Series #2", new_events)
		expected_ids = get_ids(expected)

		# Search for Conference.
		# This should match.
		r = make_search_request("Conference", None, token=generate_auth_token("bwk"))
		assert is_success(r)
		event_ids = get_ids(r["data"])
		assert expected_ids == event_ids

		# Search for Conference and the tag "Academic"
		# This should match.
		r = make_search_request("Conference AcAdEmIc", None, token=generate_auth_token("bwk"))
		assert is_success(r)
		event_ids = get_ids(r["data"])
		assert expected_ids == event_ids

		# Search for Conference and part of the tag "Academic"
		# This should not match anything.
		r = make_search_request("Conference AcaDem", None, token=generate_auth_token("bwk"))
		assert is_success(r)
		assert get_ids(r["data"]) == set()
	make_test_multi(test, len(dummy_events), get_dummy_event)

def test_search_tag_json():
	def test(new_events):
		# Search for Academic. We should get events tagged Academic, but also 
		# potentially other events that match the query on some other field.
		r = make_search_request("AcaDeMic", None, token=generate_auth_token("bwk"))
		assert is_success(r)
		expected = filter(lambda x: x["title"] in ["Test #1", "Conference Series #2"], new_events)
		expected_ids = get_ids(expected)
		event_ids = get_ids(r["data"])
		assert expected_ids == event_ids

		# Search for the Academic tag using json.
		# Only events which are tagged Academic should be shown.
		r = make_search_request("AcaDeMic", None, token=generate_auth_token("bwk"), json={"tags":["Academic"]})
		assert is_success(r)
		expected = filter(lambda x: x["title"] in ["Conference Series #2"], new_events)
		expected_ids = get_ids(expected)
		event_ids = get_ids(r["data"])
		assert expected_ids == event_ids
	make_test_multi(test, len(dummy_events), get_dummy_event)

def test_search_json_override():
	def test(new_events):
		# Query submitted via JSON should override the URL query.
		r = make_search_request("first", None, token=generate_auth_token("bwk"), json={"query": "multiple"})
		assert is_success(r)
		expected = filter(lambda x: x["title"] in ["Conference Series #2"], new_events)
		expected_ids = get_ids(expected)
		event_ids = get_ids(r["data"])
		assert expected_ids == event_ids

		# start_datetime should override the URL start_datetime.
		r = make_search_request("This", "3:30pm April 16th 2030", token=generate_auth_token("bwk"), json={"start_datetime": "5pm April 20th 2030"})
		assert is_success(r)
		expected = filter(lambda x: x["title"] in ["Test #1", "Test #3"], new_events)
		expected_ids = get_ids(expected)
		event_ids = get_ids(r["data"])
		assert expected_ids == event_ids
	make_test_multi(test, len(dummy_events), get_dummy_event)

# Valid feedback check.
def test_valid_feedback():
	test_json = "{'name': 'John', 'age': 30, 'car': None}"
	r = make_feedback_request(test_json)
	assert is_success(r)

# Invalid feedback check.
def test_invalid_feedback():
	r = make_feedback_request()
	assert is_error(r)

# Execution order of tests.
# Only tests in this list will be executed.
# Please do not modify the order of the tests.
# If adding a new test, add to the beginning or end of the list.
# Yes, I know this is a little janky.

tests = [
test_get_event_event_dne,  # This test should run first to ensure no event with ID exists.
test_add_valid_events,  # Related
test_get_valid_events,	# Related
test_delete_valid_events,	# Related
test_add_event_missing_field,
test_add_event_bad_type,
test_add_event_bad_field_length_short,
test_add_event_bad_field_length_long,
test_add_event_bad_instance_data,
test_add_event_extra_field,
test_get_event_bad_id,
test_delete_event_event_dne,
test_delete_event_bad_id,
test_edit_event_valid,
test_edit_event_system_fields,
test_edit_event_extra_field,
test_edit_event_event_dne,
test_edit_event_bad_id,
test_edit_event_different_creator,
test_edit_event_bad_poster_url,
test_add_valid_fav,
test_add_fav_wrong_user,
test_add_double_favorite,
test_add_fav_bad_event,
test_del_valid_fav,
test_del_fav_no_auth,
test_del_fav_no_fav,
test_get_valid_fav,
test_get_fav_wrong_user,
test_get_created_events_wrong_token,
test_report_event,
test_report_event_short_reason,
test_trending_event_valid_no_auth, 
test_trending_event_valid,
test_report_two_reports,
test_search_empty,
test_search_no_auth,
test_search_all,
test_search_default_starttime,
test_search_tag,
test_search_tag_json,
test_search_json_override,
test_valid_feedback,
test_invalid_feedback,
test_trending_event_date_range]

if __name__ == '__main__':
	setup()
	failed = 0
	nl_just_printed = False
	for test in tests:
		try:
			test()
			sys.stdout.write(".")
			sys.stdout.flush()
			nl_just_printed = False
		except AssertionError:
			failed += 1
			p = ""
			if not nl_just_printed:
				p = "\n"
			print(p + get_test_name(test) + " failed")
			
			nl_just_printed = True
			# TODO: Print stack trace only if a flag is set.
			#traceback.print_exc()

	print("\n%d/%d tests passed." % (len(tests) - failed, len(tests)))