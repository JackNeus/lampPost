from flask import Blueprint

web_module = Blueprint('web', __name__, url_prefix="")

from . import views