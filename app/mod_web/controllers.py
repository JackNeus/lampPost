from flask import Blueprint, request, render_template
from app import CONFIG
from app.mod_web.forms import NameForm
from app.mod_web.models import User
from .models import *
import json
import urllib

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

@mod_web.route('/addEvent', methods=['GET', 'POST'])
def addEvent():
	if request.method == 'POST':
		eventData = {}
		eventData['title'] = request.form['title']
		eventData['description'] = request.form['description']
		eventData['visibility'] = 0 # this is just a default, later let's actually let users determine this
		
		allLocations = request.form.getlist("location")
		allDates = request.form.getlist("date")
		allTimes = request.form.getlist("time")
		showings = []
		# get num of showings from iRO field, assumes that this number must be <= 9
		numShowings = int(request.form['inlineRadioOptions'][-1])
		for i in range(numShowings):
			instanceDict = {}
			instanceDict["location"] = allLocations[i]
			instanceDict["start_datetime"] = allDates[2*i] + " " + allTimes[2*i]
			instanceDict["end_datetime"] = allDates[2*i+1] + " " + allTimes[2*i+1]
			showings.append(instanceDict)

		eventData['instances'] = showings
		eventDataJSON = json.dumps(eventData)

		print(eventDataJSON)
	return render_template("web/addEvent.html")

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

