from app import app
from flask import Blueprint, jsonify, request, render_template
from flask_login import LoginManager, login_user, logout_user, current_user
from app.mod_api import controllers as mod_api_controllers
from .models import *

login_manager = LoginManager()
login_manager.init_app(app)

GenericMongoError = Exception("GenericMongoError")

@login_manager.user_loader
def load_user(user_id):
	try:
		user_entry = mod_api_controllers.get_user_by_uid(user_id)
		if user_entry is None:
			# Throw an error
			raise UserDoesNotExistError
		user = User(str(user_entry.id), user_entry.netid)
		return user
	except Exception as e:
		raise e

# views calls this in views.login()
def login(netid):
	# Create the user
	uid = mod_api_controllers.get_uid_with_netid(netid)
	if uid is None:
		uid = mod_api_controllers.add_user(netid).id
	user = load_user(uid)
	if user != None:
		login_user(user)
	else:
		raise UserDoesNotExistError

def logout():
	logout_user()
