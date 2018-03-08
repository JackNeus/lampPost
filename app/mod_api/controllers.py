from flask import Blueprint, request, render_template
from .models import *

mod_api = Blueprint('api', __name__, url_prefix="/api")

@mod_api.route("/event/<title>")
def events(title):
	try:
		print(title)
		event = EventEntry.objects(title=title)
		print(event)
		if len(event) == 0:
			return("No event found.")
		elif len(event) > 1:
			return("Multiple events found.")
		else:
			return(event[0].title + "<br \>" + event[0].description)
	except Exception:
		return("Error")

@mod_api.route("/addevent/<title>")
def add_event(title):
	try:
		new_event = EventEntry(title=title, description="This is an event titled %s." % title).save()
		return("Event added.")
	except Exception:
		return("Error")