from . import api_module as mod_api
from . import controllers as controller
from app.mod_api.models import ReadableError
from app.mod_user.models import AuthorizationError
from mongoengine import *
from app import CONFIG

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
		if CONFIG["DEBUG"]:
			print(type(e))
			return str(e)
		else:
			return "Something went wrong."

def validation_error(e):
	errors = e.errors

	report = ""

	if errors is not None:
		for key in errors:
			location = str(key).capitalize()
			message = str(errors[key])

			if key is "instances":
				location = "Showings"

			if message.find("too short") is not -1:
				readable = " is too short."
			elif message.find("too long") is not -1:
				readable = " is too long."
			elif message.find("Invalid scheme") is not -1:
				readable = " is not a URL."
			elif message.find("only accepts") is not -1:
				readable = " is the wrong type."
			elif message.find("may be used in a list") is not -1:
				readable = " is the wrong type."
			elif message.find("not a valid") is not -1:
				readable = " is not a valid id."
			elif message.find("Unknown string format") is not -1:
				readable = " has the wrong format."
			else:
				# Don't want to expose ugly erros to user.
				if CONFIG["DEBUG"]:
					readable = str(errors[key])
				else:
					readable = " was malformatted."
			report = report + location + readable + " "

	if report is not "":
		return report
	else:
		if CONFIG["DEBUG"]:
			return str(e)
		else:
			return "Request was malformatted."