from mongoengine import *

class UserEntry(Document):
	netid = StringField(required = True, unique = True)
	name = StringField(required = True)