from flask_login import UserMixin
from mongoengine import *

class UserEntry(Document):
	uid = StringField(required = True, unique = True)

class User(UserMixin):
	def __init__(self, uid):
		self.uid = uid

	def is_authenticated(self):
		return True

	def get_id(self):
		return self.uid