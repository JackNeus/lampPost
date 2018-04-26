import argparse
import sys
from flask import Flask, render_template
from mongoengine import register_connection

# Command line flags.
parser = argparse.ArgumentParser()
parser.add_argument("--test_mode")
args = parser.parse_args()

class FlaskApp(Flask):
    def __init__(self):
        Flask.__init__(self, __name__)

app = FlaskApp()

if args.test_mode:
    try:
        app.config.from_pyfile("../test/test_config.public_cfg")
        print("Running app in TEST mode.")
    except:
        print("Supplied configuration not found.")
else:
    try:
        app.config.from_pyfile("../dev_config.cfg")
    except FileNotFoundError:
        print("Development configuration not found.")

CONFIG = app.config

try:
    # MongoLab
    register_connection (
        alias = "default", 
        name = CONFIG["DB_NAME"],
        username = CONFIG["DB_USERNAME"],
        password = CONFIG["DB_PASSWORD"],
        host = CONFIG["DB_HOST"],
        port = CONFIG["DB_PORT"]
    )
except Exception as e:
    print("Database could not be configured.")
    pass

@app.errorhandler(404)
def error(e):
    return render_template("404.html"), 404

from app.mod_web import web_module
app.register_blueprint(web_module)
from app.mod_api import api_module
app.register_blueprint(api_module)
from app.mod_user import user_module
app.register_blueprint(user_module)
