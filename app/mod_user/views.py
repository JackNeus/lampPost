from . import controllers as controller
from . import CASClient as CASClient
from . import user_module as mod_user
from flask import abort, Blueprint, jsonify, make_response, request, redirect, render_template
from flask_login import login_required, current_user


@mod_user.route('/login', methods=['GET'])
def login():
	C = CASClient.CASClient(request.args)
	auth_attempt = C.Authenticate()
	if "netid" in auth_attempt:  # Successfully authenticated.
		print("HERE")
		controller.login(auth_attempt["netid"])
		# TODO: Redirect to where user came from.
		response = make_response(redirect("/browser"))
		# Generate Authorization Token for API use.
		response.set_cookie('api_token', current_user.token)
		return response
	elif "location" in auth_attempt:  # Redirect to CAS.
		return redirect(auth_attempt["location"])
	else:  # This should never happen!
		# TODO: Gracefully handle errors.
		# Ideally, we would redirect to browser with an error message displayed.
		abort(500)

@mod_user.route('/logout', methods=['GET', 'POST'])
def logout():
	controller.logout()
	response = make_response(redirect("/browser"))
	# Remove cookie.
	response.set_cookie('api_token', '', expires=0)
	return response
