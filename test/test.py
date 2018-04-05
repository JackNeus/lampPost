from copy import deepcopy
import dateutil.parser
import functools
import json
import requests
import os
import traceback
import unittest

app_url = "http://localhost:5002/api"

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

def make_add_event_request(event_data):
	r = requests.put(app_url + "/event/add", json=event_data)
	assert r.status_code == 200
	return get_data(r)

valid_events = {}

def test_add_valid_events():
	with open('test/test_data.json', 'r') as f:
		data = json.load(f)
	for event in data:
		r = make_add_event_request(event)
		assert r["status"] == "Success"
		valid_events[r["data"]["id"]] = event

def test_get_valid_events():
	for event_id in valid_events:
		r = requests.get(app_url + "/event/get/" + event_id)
		assert r.status_code == 200
		r = get_data(r)
		assert r["status"] == "Success"
		assert compare_events(valid_events[event_id], r["data"])

def test_delete_valid_events():
	for event_id in valid_events:
		r = requests.delete(app_url + "/event/delete/" + event_id)
		assert r.status_code == 200
		r = get_data(r)

def test_add_invalid_events():
	base_event = {"title": "Party", "host":"LampPost Team", "creator": "bwk",
				  "description": "This event should cause some trouble.",
				  "instances": [{"start_datetime": "3pm April 1 2100",
				  				 "end_datetime": "4pm April 1 2100",
				  				 "location": "Princeton University"},
				  				 {"start_datetime": "3pm April 2 2100",
				  				 "end_datetime": "4pm April 2 2100",
				  				 "location": "Princeton University"}]}
	events = []
	
	# Missing required fields.
	for field in ["title", "host", "creator", "description", "instances"]:
		# Remove field.
		no_value = deepcopy(base_event)
		del no_value[field]
		r = make_add_event_request(no_value)
		assert r["status"] == "Error"
	# String fields type check.
	for field in ["title", "host", "creator", "description"]:
		# Incorrectly-typed value.
		bad_value = deepcopy(base_event)
		bad_value[field] = 123
		r = make_add_event_request(bad_value)
		assert r["status"] == "Error"
	# String fields length check.
	for field, length in [("title", 5), ("host",3), ("description", 10)]:
		# Insufficiently long value.
		short_value = deepcopy(base_event)
		short_value[field] = "A"*(length-1)
		r = make_add_event_request(short_value)
		assert r["status"] == "Error"
	
	# Instances tests.

	# End datetime earlier than start datetime.
	time_swap = deepcopy(base_event)
	time_swap["instances"][0]["start_datetime"] = base_event["instances"][0]["end_datetime"]
	time_swap["instances"][0]["end_datetime"] = base_event["instances"][0]["start_datetime"]
	r = make_add_event_request(time_swap)
	assert r["status"] == "Error"
	
	# Missing required fields.
	for field in ["location", "start_datetime", "end_datetime"]:
		no_value = deepcopy(base_event)
		del no_value["instances"][0][field]
		r = make_add_event_request(no_value)
		assert r["status"] == "Error"

	# Insufficiently long value.
	short_value = deepcopy(base_event)
	short_value["instances"][0]["location"] = "AB"
	r = make_add_event_request(short_value)
	assert r["status"] == "Error"

	# Extraneous fields.
	extra_field = deepcopy(base_event)
	extra_field["bad_field_does_not_exist"] = "uh oh"
	r = make_add_event_request(extra_field)
	assert r["status"] == "Error"

# TODO: add search tests

tests = [test_add_valid_events,
test_get_valid_events,
test_delete_valid_events,
test_add_invalid_events]

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
			traceback.print_exc()
	print("%d/%d tests passed." % (len(tests) - failed, len(tests)))