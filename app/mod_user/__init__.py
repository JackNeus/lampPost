from flask import Blueprint

user_module = Blueprint('user', __name__, url_prefix="")

from . import views