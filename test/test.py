import dateutil.parser
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
	source["instances"].sort()
	record["instances"].sort()
	for field in source:
		if field == "instances":
			# Source and record have different numbers of instances.
			if len(source[field]) != len(record[field]):
				return False
			# For each instance:
			for i in range(len(source[field])):
				# For each field in instance:
				for subfield in source[field][i]:
					source_value = source[field][i][subfield]
					record_value = record[field][i][subfield]
					# Special logic for datetimes because we don't know what format 
					# they're in in source.
					if subfield in ["start_datetime", "end_datetime"]:
						source_value = dateutil.parser.parse(source_value)
						record_value = dateutil.parser.parse(record_value)
					# Fields not equal.
					if source_value != record_value:
						return False
		else:
			# Fields not equal.
			if source[field] != record[field]:
				return False
	return True

valid_events = {}

def test_add_valid_events():
	with open('test/test_data.json', 'r') as f:
		data = json.load(f)
	for entry in data:
		r = requests.put(app_url + "/event/add", json=entry)
		assert r.status_code == 200
		r = get_data(r)
		assert r["status"] == "Success"
		valid_events[r["data"]["id"]] = entry

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

tests = [test_add_valid_events,
test_get_valid_events,
test_delete_valid_events]

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