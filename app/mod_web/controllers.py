from flask import Blueprint, request, render_template

from app.mod_web.forms import NameForm
from app.mod_web.models import User
from .models import *

mod_web = Blueprint('web', __name__, url_prefix="")

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

@mod_web.route('/carrot')
def carrot():
	return render_template("web/carrot.html")

@mod_web.route('/browser')
def browser():
	return render_template("web/browser.html")

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
