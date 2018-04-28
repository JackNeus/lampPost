from . import api_module as mod_api
from . import controllers as controller
from app.mod_api.models import ReadableError
from app.mod_user.models import AuthorizationError
from mongoengine import *

def main_handler(e):
	if type(e) is ValidationError:
		return validation_error(e)
	elif type(e) is NotUniqueError:
		return "An event already exists with that title."
	elif type(e) is FieldDoesNotExist:
		return "Request included a field that does not exist."
	elif type(e) is ReadableError:
		return str(e)
	elif type(e) is AuthorizationError:
		return "Invalid authorization."
	elif type(e) is KeyError:
		return "Event object does not include field %s" % str(e)
	else:
		return str(e)

def validation_error(e):
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