from .models import *
from datetime import datetime
from flask import Blueprint, jsonify, request, render_template

mod_api = Blueprint('api', __name__, url_prefix="/api")

@mod_api.route("/event/<title>")
def events(title):
	try:
		print(title)
		event_data = EventEntry.objects(title=title)
		event_data = [get_raw_event(event) for event in event_data]
		return jsonify(event_data)
		return None
	except Exception:
		raise
		return("Error")

@mod_api.route("/addevent/<title>")
def add_event(title):
	try:
		new_event = EventEntry(
			title=title, 
			creator="admin",
			start_datetime=datetime.now(),
			end_datetime=datetime.now(),
			description="This is an event titled %s." % title).save()
		return("Event added.")
	except Exception as e:
		print(e)
		return("Error")