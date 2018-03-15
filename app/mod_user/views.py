from .controllers import *
from .CASClient import *
from flask import abort, Blueprint, jsonify, request, redirect, render_template


mod_user = Blueprint('user', __name__, url_prefix="")

@mod_user.route('/login', methods=['GET', 'POST'])
def login():
	print(request.args)
	C = CASClient(request.args)
	auth_attempt = C.Authenticate()
	if "netid" in auth_attempt:  # Successfully authenticated.
		print("Successfully authenticated!")
		return redirect("/browser")
	elif "location" in auth_attempt:  # Redirect to CAS.
		print(auth_attempt)
		return redirect(auth_attempt["location"])
	else:  # This should never happen!
		# TODO: Gracefully handle errors.
		# Ideally, we would redirect to browser with an error message displayed.
		abort(500)

