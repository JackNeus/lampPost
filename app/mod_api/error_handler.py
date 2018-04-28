from . import api_module as mod_api
from . import controllers as controller
from datetime import datetime, timedelta
from dateutil.parser import *

def validation_error(e, data):
	errors = e.errors

	report = ""

	for key in errors:
		message = str(errors[key])
		if message.find("too short") is not -1:
			readable = " is too short."
		elif message.find("too long") is not -1:
			readable = " is too long."
		elif message.find("Invalid scheme") is not -1:
			readable = " is not a URL."
		else:
			readable = str(errors[key])
		report = report + str(key).capitalize() + readable + " "

	if report is not "":
		return report
	else:
		return str(e)