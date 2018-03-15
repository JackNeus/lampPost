from app import app
from .models import *
from flask import Blueprint, jsonify, request, render_template
from flask_login import LoginManager, login_user, logout_user

login_manager = LoginManager()
login_manager.init_app(app)

GenericMongoError = Exception("GenericMongoError")

@login_manager.user_loader
def load_user(user_id):	
	user_entry = get_user(user_id)
	user = User(user_entry.uid) 
	return user

def login(user_id):
	user = load_user(user_id)

	if user != None:
		login_user(user)
	else:
		raise UserDoesNotExistError

def logout():
	logout_user()

def get_user(user_id):
	try:
		entries = UserEntry.objects(uid = user_id.lower())
		if entries.count() == 1:
			return entries[0]
		elif entries.count() == 0:
			return add_user(user_id)
		return None
	except Exception as e:
		raise e

def add_user(user_id):
	entries = UserEntry.objects(uid = user_id.lower())
	if entries.count() > 0:
		raise UserExistsError
	new_user = UserEntry(uid = user_id)
	new_user.save()
	return new_user