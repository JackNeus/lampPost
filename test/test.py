from copy import deepcopy
from datetime import datetime, timedelta
import dateutil.parser
import functools
from itsdangerous import TimedJSONWebSignatureSerializer as Serializer
import json
import requests
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

def make_add_event_request(event_data, token=None):
	headers = None
	if token is not None:
		headers = {"Authorization": "Token %s" % token}
	r = requests.put(app_url + "/event/add", json=event_data, headers=headers)
	assert r.status_code == 200
	return get_data(r)

def make_get_event_request(event_id, token=None):
	headers = None
	if token is not None:
		headers = {"Authorization": "Token %s" % token}
	r = requests.get(app_url + "/event/get/" + event_id, headers=headers)
	assert r.status_code == 200
	return get_data(r)

def make_delete_event_request(event_id, token=None):
	headers = None
	if token is not None:
		headers = {"Authorization": "Token %s" % token}
	r = requests.delete(app_url + "/event/delete/" + event_id, headers=headers)
	assert r.status_code == 200
	return get_data(r)

def make_edit_event_request(event_id, data, token=None):
	headers = None
	if token is not None:
		headers = {"Authorization": "Token %s" % token}
	r = requests.post(app_url + "/event/edit/" + event_id, json=data, headers=headers)
	assert r.status_code == 200
	return get_data(r)

user_ids = {}

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
	for user in ["jneus", "tpollner", "bwk"]:
		user_ids[user] = add_user(user)
valid_events = {}

def test_add_valid_events():
	with open('test/test_data.json', 'r') as f:
		data = json.load(f)
	for event in data:
		r = make_add_event_request(event, generate_auth_token(event["creator"]))
		assert is_success(r)
		valid_events[r["data"]["id"]] = event

def test_get_valid_events():
	for event_id in valid_events:
		r = make_get_event_request(event_id)
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
				  				 "location": "Princeton University"}]}
	
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
	for field in ["title", "host", "description"]:
		# Incorrectly-typed value.
		bad_value = deepcopy(base_event)
		bad_value[field] = 123
		r = make_add_event_request(bad_value, generate_auth_token(base_event["creator"]))
		assert is_error(r)
		assert "malformatted" in r["error_msg"]

def test_add_event_bad_field_length():		
	# String fields length check.
	for field, length in [("title", 5), ("host",3), ("description", 10)]:
		# Insufficiently long value.
		short_value = deepcopy(base_event)
		short_value[field] = "A"*(length-1)
		r = make_add_event_request(short_value, generate_auth_token(base_event["creator"]))
		assert is_error(r)
		assert "malformatted" in r["error_msg"]
	
def test_add_event_bad_instance_data():
	# Instances tests.

	# End datetime earlier than start datetime.
	time_swap = deepcopy(base_event)
	time_swap["instances"][0]["start_datetime"] = base_event["instances"][0]["end_datetime"]
	time_swap["instances"][0]["end_datetime"] = base_event["instances"][0]["start_datetime"]
	r = make_add_event_request(time_swap, generate_auth_token(base_event["creator"]))
	assert is_error(r)
	assert "malformatted" in r["error_msg"]
	
	# Missing required fields.
	for field in ["location", "start_datetime", "end_datetime"]:
		no_value = deepcopy(base_event)
		del no_value["instances"][0][field]
		r = make_add_event_request(no_value, generate_auth_token(base_event["creator"]))
		assert is_error(r)
		assert "missing" in r["error_msg"]

	# Insufficiently long value.
	short_value = deepcopy(base_event)
	short_value["instances"][0]["location"] = "AB"
	r = make_add_event_request(short_value, generate_auth_token(base_event["creator"]))
	assert is_error(r)
	assert "malformatted" in r["error_msg"]
 
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

def test_add_event_in_past():
	# Tests events with endtimes that have already happened.
	old_event = deepcopy(base_event)

	days_ago = 7
	start_datetime = str(datetime.today() - timedelta(days=days_ago))
	end_datetime = str(datetime.today() - timedelta(days=days_ago-1))
	old_event["instances"] = [{"location": "Location",
							  "start_datetime": start_datetime,
							  "end_datetime": end_datetime}]
	r = make_add_event_request(old_event, generate_auth_token(old_event["creator"]))
	assert is_error(r)
	assert "malformatted" in r["error_msg"]

# Try to get event that does not exist.
def test_get_event_event_dne():
	r = make_get_event_request("5ac579ff1b41577c54130835")
	assert is_error(r)

# Try to get event with invalid id.
def test_get_event_bad_id():
	r = make_get_event_request("bad_id_format")
	assert is_error(r)

# Try to delete event that does not exist.
def test_delete_event_event_dne():
	r = make_delete_event_request("5ac579ff1b41577c54130835")
	assert is_error(r)

# Try to delete event with invalid id.
def test_delete_event_bad_id():
	r = make_delete_event_request("bad_id_format")
	assert is_error(r)

# Base for edit tests.
def make_edit_test(test_body):
	# Setup
	new_event = deepcopy(base_event)
	creator_netid = new_event["creator"]
	r = make_add_event_request(new_event, generate_auth_token(creator_netid))
	assert is_success(r)
	event_id = r["data"]["id"]

	test_body(new_event, event_id, creator_netid)

	# Cleanup
	r = make_delete_event_request(event_id, generate_auth_token(creator_netid))
	assert is_success(r)


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
					  				 "location": "Yale University"}]}
		# Try editing each field separately.
		for field in event_edits:
			edit = {field: event_edits[field]}
			new_event[field] = deepcopy(event_edits[field])
			r = make_edit_event_request(event_id, edit, generate_auth_token(creator_netid))
			assert is_success(r)
			assert compare_events(new_event, r["data"])
	make_edit_test(test)

def test_edit_event_system_fields():
	def test(new_event, event_id, creator_netid):
		event_edit = {"creator":"victim", "id": "5ac579ff1b41577c54130835"}
		r = make_edit_event_request(event_id, event_edit, generate_auth_token(creator_netid))
		assert is_success(r)
		# Event should not have changed.
		assert compare_events(new_event, r["data"])
	make_edit_test(test)

def test_edit_event_extra_field():
	def test(new_event, event_id, creator_netid):
		# Extraneous fields.
		extra_field = deepcopy(base_event)
		extra_field["bad_field_does_not_exist"] = "uh oh"
		r = make_edit_event_request(event_id, extra_field, generate_auth_token(creator_netid))
	make_edit_test(test)

def test_edit_event_bad_type():	
	def test(new_event, event_id, creator_netid):
		# String fields type check.
		for field in ["title", "host", "description"]:
			# Incorrectly-typed value.
			r = make_edit_event_request(event_id, {field: 123}, generate_auth_token(creator_netid))
			assert is_error(r)
			assert "malformatted" in r["error_msg"]
	make_edit_test(test)

def test_edit_event_bad_field_length():	
	def test(new_event, event_id, creator_netid):
		# String fields length check.
		for field, length in [("title", 5), ("host",3), ("description", 10)]:
			# Insufficiently long value.
			short_value = "A"*(length-1)
			r = make_edit_event_request(event_id, {field: short_value}, generate_auth_token(creator_netid))
			assert is_error(r)
			assert "malformatted" in r["error_msg"]
	make_edit_test(test)

# Try to edit event that does not exist.
def test_edit_event_event_dne():
	r = make_edit_event_request("5ac579ff1b41577c54130835", {})
	assert is_error(r)
	assert "exist" in r["error_msg"]

# Try to delete event with invalid id.
def test_edit_event_bad_id():
	r = make_edit_event_request("bad_id_format", {})
	assert is_error(r)
	assert "malformatted" in r["error_msg"]

# Try to edit event that does not belong to us.
def test_edit_event_different_creator():
	def test(new_event, event_id, creator_netid):
		r = make_edit_event_request(event_id, {"description":"My event sucks!"}, generate_auth_token("jneus"))
		assert is_error(r)
	make_edit_test(test)

def test_edit_event_in_past():
	# Tests an event edit where the edit includes an instance with endtimes 
	# that have already happened.
	def test(new_event, event_id, creator_netid):
		days_ago = 7
		start_datetime = str(datetime.today() - timedelta(days=days_ago))
		end_datetime = str(datetime.today() - timedelta(days=days_ago-1))
		edits = {"instances": [{"location": "Location",
							   "start_datetime": start_datetime,
							  "end_datetime": end_datetime}]}
		r = make_edit_event_request(event_id, edits, generate_auth_token(creator_netid))
		assert is_error(r)
		assert "malformatted" in r["error_msg"]
	make_edit_test(test)

def test_edit_event_bad_poster_url():
	# Events whose poster URLs do not start with 'http://princeton-lamppost.s3.amazonaws.com/'
	# are invalid.
	def test(new_event, event_id, creator_netid):
		edits = {"poster": "http://www.google.com/logo.jpg"}
		r = make_edit_event_request(event_id, edits, generate_auth_token(creator_netid))
		assert is_error(r)
	make_edit_test(test)

# TODO: add search tests

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
test_add_event_bad_field_length,
test_add_event_bad_instance_data,
test_add_event_extra_field,
test_get_event_bad_id,
test_delete_event_event_dne,
test_delete_event_bad_id,
test_edit_event_valid,
test_edit_event_system_fields,
test_edit_event_extra_field,
test_edit_event_bad_type,
test_edit_event_bad_field_length,
test_edit_event_event_dne,
test_edit_event_bad_id,
test_edit_event_different_creator,
test_add_event_in_past,
test_edit_event_in_past,
test_edit_event_bad_poster_url
]

if __name__ == '__main__':
	setup()
	failed = 0
	for test in tests:
		try:
			test()
			print(".")
		except AssertionError:
			failed += 1
			print(get_test_name(test) + " failed")
			# TODO: Print stack trace only if a flag is set.
			#traceback.print_exc()
	print("%d/%d tests passed." % (len(tests) - failed, len(tests)))