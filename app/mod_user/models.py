from app import app
from flask_login import UserMixin
from itsdangerous import (TimedJSONWebSignatureSerializer as Serializer, BadSignature, SignatureExpired)
from mongoengine import *

class UserEntry(Document):
	netid = StringField(required = True, unique = True)

	meta = { "strict": False }

class User(UserMixin):
	def __init__(self, uid, netid):
		self.uid = str(uid)
		self.netid = netid
		self.token = self.generate_auth_token()

	def is_authenticated(self):
		return True

	def get_id(self):
		return self.uid

	# So long as the expiration time is greater than the CAS expiration time,
	# there should be no problem with a user's token expiring mid-session.
	# TODO: Figure out the exact CAS expiration time.
	def generate_auth_token(self, expiration = 3600 * 24 * 7):
		s = Serializer(app.config['SECRET_KEY'], expires_in = expiration)
		return str(s.dumps({'id': self.uid}))[2:-1]

	@staticmethod
	def verify_auth_token(token):
		s = Serializer(app.config['SECRET_KEY'])
		try:
			data = s.loads(token)
		except SignatureExpired:
			return None  # Valid token, but expired.
		except BadSignature:
			return None  # Invalid token.
		try:
			user = UserEntry.objects(id=data['id'])
		except:
			return None
		if user.count() != 1:
			return None  # Something went wrong.
		return user[0]