from flask import Blueprint, request, render_template
from app.mod_web.forms import NameForm
from app.mod_web.models import User

mod_web = Blueprint('web', __name__, url_prefix="")

@mod_web.route('/index', methods=['GET', 'POST'])
def index():
	form = NameForm(request.form)
	if form.validate_on_submit():
		name = form.name.data
		msg = "Hello, "+name
		return render_template("web/index.html", msg=msg)
	return render_template("web/index.html", form=form)