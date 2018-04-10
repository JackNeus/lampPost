from copy import deepcopy
import dateutil.parser
import functools
import json
import requests
import os
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

def is_success(r):
	return r["status"] == "Success"

def is_error(r):
	return r["status"] == "Error"

app_url = "http://localhost:5002/api"

def make_add_event_request(event_data):
	r = requests.put(app_url + "/event/add", json=event_data)
	assert r.status_code == 200
	return get_data(r)

def make_get_event_request(event_id):
	r = requests.get(app_url + "/event/get/" + event_id)
	assert r.status_code == 200
	return get_data(r)

def make_delete_event_request(event_id):
	r = requests.delete(app_url + "/event/delete/" + event_id)
	assert r.status_code == 200
	return get_data(r)

valid_events = {}

def test_add_valid_events():
	with open('test/test_data.json', 'r') as f:
		data = json.load(f)
	for event in data:
		r = make_add_event_request(event)
		assert is_success(r)
		valid_events[r["data"]["id"]] = event

def test_get_valid_events():
	for event_id in valid_events:
		r = make_get_event_request(event_id)
		assert is_success(r)
		assert compare_events(valid_events[event_id], r["data"])

def test_delete_valid_events():
	for event_id in valid_events:
		r = make_delete_event_request(event_id)
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
		r = make_add_event_request(no_value)
		assert is_error(r)

def test_add_event_bad_type():		
	# String fields type check.
	for field in ["title", "host", "creator", "description"]:
		# Incorrectly-typed value.
		bad_value = deepcopy(base_event)
		bad_value[field] = 123
		r = make_add_event_request(bad_value)
		assert is_error(r)

def test_add_event_bad_field_length():		
	# String fields length check.
	for field, length in [("title", 5), ("host",3), ("description", 10)]:
		# Insufficiently long value.
		short_value = deepcopy(base_event)
		short_value[field] = "A"*(length-1)
		r = make_add_event_request(short_value)
		assert is_error(r)
	

def test_add_event_bad_instance_data():
	# Instances tests.

	# End datetime earlier than start datetime.
	time_swap = deepcopy(base_event)
	time_swap["instances"][0]["start_datetime"] = base_event["instances"][0]["end_datetime"]
	time_swap["instances"][0]["end_datetime"] = base_event["instances"][0]["start_datetime"]
	r = make_add_event_request(time_swap)
	assert is_error(r)
	
	# Missing required fields.
	for field in ["location", "start_datetime", "end_datetime"]:
		no_value = deepcopy(base_event)
		del no_value["instances"][0][field]
		r = make_add_event_request(no_value)
		assert is_error(r)

	# Insufficiently long value.
	short_value = deepcopy(base_event)
	short_value["instances"][0]["location"] = "AB"
	r = make_add_event_request(short_value)
	assert is_error(r)

def test_add_event_extra_field():
	# This test is currently disabled because the EventEntry type has
	# meta: strict disabled and extra fields are quietly ignored.
	assert False

	# Extraneous fields.
	extra_field = deepcopy(base_event)
	extra_field["bad_field_does_not_exist"] = "uh oh"
	r = make_add_event_request(extra_field)
	print(r)
	assert is_error(r)
	assert "malformatted" in r["error_msg"]

# Try to get event that does not exist.
def test_get_event_event_dne():
	r = make_get_event_request("5ac579ff1b41577c54130835")
	assert is_success(r)
	assert len(r["data"]) == 0

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
test_delete_event_bad_id
]

if __name__ == '__main__':
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