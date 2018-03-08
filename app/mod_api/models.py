from mongoengine import *

class EventEntry(Document):
	title = StringField(required = True)
	description = StringField(required = True)