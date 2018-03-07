from flask_wtf import FlaskForm
from wtforms import TextField
from wtforms.validators import Required, EqualTo

class NameForm(FlaskForm):
	name = TextField('Name', [Required(message='Forgot your name?')])