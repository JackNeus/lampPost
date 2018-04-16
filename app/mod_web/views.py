from flask_wtf import FlaskForm
from flask import Blueprint, request, render_template, flash, redirect
from flask_login import login_required, current_user
from app import CONFIG
from app.mod_web.forms import NameForm
from . import web_module as mod_web
from . import controllers as controller
from .forms import *
from .models import *
import json
import requests

# Homepage
@mod_web.route('/')
def home():
	return render_template("web/home.html")

@mod_web.route('/browser')
def browser():
	if "USE_MOCK_DATA" in CONFIG and CONFIG["USE_MOCK_DATA"]:
		# Ignore USE_MOCK_DATA flag if not in DEBUG mode.
		if CONFIG["DEBUG"]:
			with open('app/static/mock_data/data.json', 'r') as f:
				data = json.load(f)
				return render_template("web/browser.html", data = data)
			print("Error loading mock data.")
	return render_template("web/browser.html")
	
@mod_web.route('/myevents', methods=['GET', 'POST'])
def myevents():
	if request.method == "POST":
		form = EventForm(request.form)

		if not form.validate_on_submit():
			print(form.errors)
			return render_template("web/myevents.html", form=form, errors=form.errors, display=True)
		else:
			eventData = controller.form_to_event_object(form)

			try:
				if "poster" in request.files:
					# Upload image to S3.
					file_url = controller.upload_file(request.form['event-id'], request.files["poster"])
					# Update event with image URL.
					
					eventData["poster"] = file_url
			except Exception as e:
				flash("Error: " + str(e))
				return render_template("web/myevents.html", form=EventForm())

			# make API request
			r = controller.make_edit_request(request.form['event-id'], eventData)

			if r.status_code != 200:
				flash("Something went wrong. Please contact a developer.")
				return render_template("web/add.html", form=EventForm())
			r = json.loads(r.text)
			if r["status"] == "Success":
				flash("Success! Your event has been edited.")
				return redirect("myevents")
			else:
				flash("Error. " + r["error_msg"])
				return render_template("web/myevents.html", form=EventForm(), display=True, numRows=len(showings))
	else:
		return render_template("web/myevents.html", form=EventForm(), display=False, numRows=1)

@mod_web.route('/add', methods=['GET', 'POST'])
@login_required
def addEvent():
	if request.method == "POST":
		form = EventForm(request.form)
		if not form.validate_on_submit():
			print(form.errors)
			return render_template("web/add.html", form=form, errors=form.errors)
		else:
			eventData = controller.form_to_event_object(form)

			# make API request
			headers = { "Authorization" : "Token %s" % current_user.token }
			r = requests.put(CONFIG["BASE_URL"]+"/api/event/add", 
				json = eventData, headers = headers)

			if r.status_code != 200:
				flash("Something went wrong. Please contact a developer.")
				return render_template("web/add.html", form=EventForm())
			r = json.loads(r.text)
			if r["status"] == "Success":
				event_id = r["data"]["id"]
				# If event was successfully added, upload poster & update event.
				try:
					if "poster" in request.files:
						# Upload image to S3.
						file_url = controller.upload_file(event_id, request.files["poster"])
						# Update event with image URL.
						
						# TODO: Handle failures better (or at all).
						controller.make_edit_request(event_id, {'poster': file_url})
				except Exception as e:
					# If adding the image fail, delete the event and pretend like
					# nothing happened.
					controller.make_delete_request(event_id)
					flash("Error. " + str(e))
					return render_template("web/add.html", form=EventForm())

				flash("Success! Your event has been added.")
				return redirect("add")
			else:
				flash("Error. " + r["error_msg"])
				return render_template("web/add.html", form=EventForm())
	else:
		return render_template("web/add.html", form=EventForm())

