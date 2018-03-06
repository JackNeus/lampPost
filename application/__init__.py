from flask import Flask, render_template

class FlaskApp(Flask):
    def __init__(self):
        Flask.__init__(self, __name__)

app = FlaskApp()

try:
    app.config.from_pyfile("../dev_config.cfg")
except FileNotFoundError:
    print("Development configuration not found.")

CONFIG = app.config

@app.errorhandler(404)
def error(e):
    return render_template("404.html"), 404
