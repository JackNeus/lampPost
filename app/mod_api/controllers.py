from .models import *
from datetime import datetime
from flask import Blueprint, jsonify, request, render_template

mod_api = Blueprint('api', __name__, url_prefix="/api")

@mod_api.route("/event/<title>")
def events(title):
	try:
		event_data = EventEntry.objects(title=title)
		event_data = [get_raw_event(event) for event in event_data]
		return jsonify(event_data)
	except Exception as e:
		return jsonify({"error_msg": str(e)})

@mod_api.route("/addevent/<title>")
def add_event(title):
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
		return("Event added.")
	except Exception as e:
		return jsonify({"error_msg": str(e)})