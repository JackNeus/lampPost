from flask_wtf import FlaskForm
from wtforms_components import TimeField
from wtforms import StringField, TextField, TextAreaField, RadioField, FieldList, DateField, FileField, validators, SelectMultipleField, widgets
from wtforms.validators import Required, DataRequired

class MultiCheckboxField(SelectMultipleField):
    widget = widgets.ListWidget(prefix_label=False)
    option_widget = widgets.CheckboxInput()

class EventForm(FlaskForm):
    event_id = TextField()
    title = StringField('Title', validators=[DataRequired()])
    description = TextAreaField('Description', validators=[DataRequired()])
    host = StringField('Host', validators=[DataRequired()])
    visibility = RadioField('Intended Audience:', choices=[("0","General Public"), ("1","Princeton University")], default="0")
    numShowings = RadioField('Number of Showings:', choices=[("1","1"),("2","2"),("3","3"),("4","4")], default="1")
    locations = FieldList(StringField('Location'), min_entries=4)
    startDates = FieldList(DateField('Start Date', format='%m/%d/%Y', validators=(validators.Optional(),)), min_entries=4)
    startTimes = FieldList(TimeField('Start Time', validators=(validators.Optional(),)), min_entries=4)
    endDates = FieldList(StringField('End Date', validators=(validators.Optional(),)), min_entries=4)
    endTimes = FieldList(TextField('End Time', validators=(validators.Optional(),)), min_entries=4)
    startTimes = FieldList(TextField('Start Time', validators=(validators.Optional(),)), min_entries=4)
    endDates = FieldList(StringField('End Date', validators=(validators.Optional(),)), min_entries=4)
    endTimes = FieldList(TextField('End Time', validators=(validators.Optional(),)), min_entries=4)
    deletePoster = TextField()
    poster = FileField('Event Photo/Poster')
    link = StringField('Promo Video')
    tags = MultiCheckboxField('Tags:', choices=[("Music","Music"), ("Dance", "Dance"), ("Talk", "Talk"), ("Theater", "Theater"), ("Street", "Street"),("Orientation", "Orientation")])

class ReportForm(FlaskForm):
    event_id = TextField()
    category = RadioField('Reason:', choices=[("Duplicate event", "Duplicate event"), ("Spam/Offensive","Spam/Offensive"), ("Other", "Other")])
    description = TextAreaField('Description')

class FeedbackForm(FlaskForm):
    feedback = TextAreaField('Feedback')
