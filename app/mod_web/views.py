from flask_wtf import FlaskForm
from flask import Blueprint, request, render_template, flash, redirect, session
from flask_login import login_required, current_user
from app import CONFIG
from . import web_module as mod_web
from . import controllers as controller
from .forms import *
from .models import *
import json
import requests

# Homepage
@mod_web.route('/')
def home():
	# User is not logged in.
	if not current_user.is_authenticated and "guest_mode" not in session:
		return redirect("/welcome")
	return redirect("/browse")
	
# Splash page
@mod_web.route('/welcome')
def welcome():
	if "proceed" in request.args:
		session["guest_mode"] = True
		return redirect("/browse")
	return render_template("web/splashpage.html")

@mod_web.route('/browse', methods=['GET', 'POST'])
def browser():
	if request.method == "POST":
		form = ReportForm(request.form)

		if "category" not in request.form:
			flash("Error: Reason cannot be empty.")
			return render_template("web/browser.html", formR=ReportForm(), wasError=True)
		
		eventData = {"reason": request.form["category"] + ": " + request.form["description"]}
		headers = { "Authorization" : "Token %s" % current_user.token }
		r = requests.put(CONFIG["BASE_URL"]+"/api/event/report/" + request.form['event_id'], 
			json = eventData, headers = headers)
		r = json.loads(r.text)
		if r["status"] == "Success":
			flash("The event has successfully been reported.")
			return render_template("web/browser.html", formR=ReportForm())
		else:
			flash("Error in reporting event: " + r["error_msg"])
			return render_template("web/browser.html", formR=ReportForm(), wasError=True)

	if "USE_MOCK_DATA" in CONFIG and CONFIG["USE_MOCK_DATA"]:
		# Ignore USE_MOCK_DATA flag if not in DEBUG mode.
		if CONFIG["DEBUG"]:
			with open('app/static/mock_data/data.json', 'r') as f:
				data = json.load(f)
				return render_template("web/browser.html", data = data)
			print("Error loading mock data.")
	return render_template("web/browser.html", formR=ReportForm())
	
@mod_web.route('/myevents', methods=['GET', 'POST'])
def myevents():
	if request.method == "POST":
		form = EventForm(request.form)

		if not form.validate_on_submit():
			print(form.errors)
			return render_template("web/myevents.html", form=form, errors=form.errors, display=True)
		else:
			eventData, numShowings = controller.form_to_event_object(form)

			try:
				if "poster" in request.files:
					# Upload image to S3.
					file_url = controller.upload_file(request.form['event_id'], request.files["poster"])
					# Update event with image URL.
					
					eventData["poster"] = file_url
			except Exception as e:
				flash("Error: " + str(e))
				return render_template("web/myevents.html", form=EventForm())

			# make API request
			event_id = request.form['event_id']
			r = controller.make_edit_request(event_id, eventData)
			
			if r.status_code != 200:
				flash("Something went wrong. Please contact a developer.")
				return render_template("web/myevents.html", form=EventForm())
      
			r = json.loads(r.text)
			if r["status"] == "Success":
				flash("Success! Your event has been edited.")
				return redirect("/myevents?event=%s" % event_id)
			else:
				flash("Error. " + r["error_msg"])
				return render_template("web/myevents.html", form=EventForm(), display=True, numRows=numShowings)
	else:
		return render_template("web/myevents.html", form=EventForm(), display=False, numRows=1)

@mod_web.route('/add', methods=['GET', 'POST'])
@login_required
def addEvent():
	if request.method == "POST":
		form = EventForm(request.form)
		if not form.validate_on_submit():
			return render_template("web/add.html", form=form, errors=form.errors)
		else:
			eventData, numShowings = controller.form_to_event_object(form)
			
			# make API request
			headers = { "Authorization" : "Token %s" % current_user.token }
			r = requests.put(CONFIG["BASE_URL"]+"/api/event/add", 
				json = eventData, headers = headers)

			if r.status_code != 200:
				flash("Error: something went wrong. Please contact a developer.")
				return render_template("web/add.html", form=EventForm(), numRows=numShowings)
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
					return render_template("web/add.html", form=EventForm(), numRows=numShowings)

				flash("Success! Your event has been added.")
				return redirect("/myevents?event="+event_id)
			else:
				flash("Error. " + r["error_msg"])
				return render_template("web/add.html", form=EventForm(), numRows=numShowings)
	else:
		return render_template("web/add.html", form=EventForm(), numRows=1)
		
@mod_web.route('/myfavorites')
def myfavorites():
	return render_template("web/myfavorites.html")

