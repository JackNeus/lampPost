from flask_wtf import FlaskForm
from flask import Blueprint, request, render_template, flash, redirect
from flask_login import current_user
from app import CONFIG
from app.mod_web.forms import NameForm
from app.mod_web.models import User
from .models import *
from .forms import *
import json
import requests


mod_web = Blueprint('web', __name__, url_prefix="")

# Homepage
@mod_web.route('/')
def home():
	return render_template("web/home.html")

@mod_web.route('/index', methods=['GET', 'POST'])
def index():
	form = NameForm(request.form)
	if form.validate_on_submit():
		name = form.name.data
		msg = "Hello, "+name
		return render_template("web/index.html", msg=msg)
	return render_template("web/index.html", form=form)

@mod_web.route('/spud', methods=['GET'])
@mod_web.route('/spuds', methods=['GET'])
@mod_web.route('/potato', methods=['GET'])
def potato():
	print("This is the server speaking!")
	print(request.args)
	if "msg" in request.args:
		my_message = request.args["msg"]
	else:
		my_message = None
	return render_template("web/potato.html", my_message=my_message)

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

@mod_web.route('/add', methods=['GET', 'POST'])
def addEvent():
	if request.method == "POST":
		form = EventForm(request.form)
		if not form.validate_on_submit():
			print(form.errors)
			return render_template("web/add.html", form=form, errors=form.errors)
		else:
			eventData = {}
			eventData['title'] = form.title.data
			eventData['description'] = form.description.data
			# TODO: let's actually let users determine this
			eventData['visibility'] = 0

			showings = []
			for i in range(int(form.numShowings.data)):
				instanceDict = {}
				instanceDict["location"] = form.locations.data[i]
				instanceDict["start_datetime"] = str(form.startDates.data[i]) + " " + str(form.startTimes.data[i])
				instanceDict["end_datetime"] = str(form.endDates.data[i]) + " " + str(form.endTimes.data[i])
				showings.append(instanceDict)

			eventData['instances'] = showings

			eventData['poster'] = form.poster.data
			print(eventData['poster'])

			eventData['creator'] = current_user.netid
			eventData['host'] = form.host.data

			if (form.link.data != ""):
				eventData['trailer'] = form.link.data

			# make API request
			r = requests.put("http://localhost:5001/api/event/add", json=eventData)
			print(r.text)
			if json.loads(r.text)["status"] == "Success":
				flash("Success! Your event has been added.")
				return redirect("add")
			else:
				flash("Error. " + json.loads(r.text)["error_msg"])
				return render_template("web/add.html", form=EventForm())
	else:
		return render_template("web/add.html", form=EventForm())

@mod_web.route('/main')
def main():
	with open('app/static/carrot/events.json', 'r') as fid:
		data = json.load(fid)
	if data:
		return render_template("web/main.html", data=data)
	else:
		return render_template("web/main.html")

@mod_web.route('/puppies', methods=['GET', 'POST'])
def puppies():
	if request.method == 'POST' and "dog" in request.form:
		dog=request.form['dog']
		with open('app/mod_web/votes.txt', 'r') as fid:
			line = fid.readline()
			name=[]
			num=[]
			i = 0
			while line:
				votes = line.split(":")
				print(votes)
				name.append(votes[0])
				num.append(int(votes[1]))
				if (name[i] == dog):
					num[i] += 1
				line = fid.readline()
				i += 1
				
		with open('app/mod_web/votes.txt', 'w') as fid:
			for j in range(0, i):
				fid.write(name[j] + ":" + str(num[j]) +'\n')
				
		return render_template("web/puppies.html", dog=dog, votes1=num[0], votes2=num[1], votes3=num[2], votes4=num[3])
	else:
		return render_template("web/puppies.html")
		
@mod_web.route('/hello', methods=['GET', 'POST'])
def hello():
	return render_template("web/hello.html")

