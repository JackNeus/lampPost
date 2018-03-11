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
