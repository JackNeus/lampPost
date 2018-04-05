from app import app
from .models import *
from flask import Blueprint, jsonify, request, render_template
from flask_login import LoginManager, login_user, logout_user

login_manager = LoginManager()
login_manager.init_app(app)

GenericMongoError = Exception("GenericMongoError")

@login_manager.user_loader
def load_user(user_id):
	try:
		user_entry = UserEntry.objects(id = user_id)
		if user_entry.count() != 1:
			return None
		user_entry = user_entry[0]
		user = User(str(user_entry.id), user_entry.netid) 
		return user
	except Exception as e:
		raise e

def login(netid):
	user = load_user(get_user(netid).id)
	if user != None:
		login_user(user)
	else:
		raise UserDoesNotExistError

def logout():
	logout_user()

def get_user(netid):
	netid = netid.lower()
	try:
		entries = UserEntry.objects(netid = netid)
		if entries.count() == 1:
			return entries[0]
		elif entries.count() == 0:
			return add_user(netid)
		return None
	except Exception as e:
		raise e

# Add UserEntry for given netid.
def add_user(netid):
	netid = netid.lower()
	entries = UserEntry.objects(netid = netid)
	if entries.count() > 0:
		raise UserExistsError
	new_user = UserEntry(netid = netid)
	new_user.save()
	return new_user