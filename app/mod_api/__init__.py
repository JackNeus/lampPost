from flask import Blueprint

api_module = Blueprint('api', __name__, url_prefix="/api")

from . import views