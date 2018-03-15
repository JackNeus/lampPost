from app import CONFIG
import sys, os, cgi, urllib, re

class CASClient:
   def __init__(self, form):
      self.form = form
      self.cas_url = 'https://fed.princeton.edu/cas/'

   def Authenticate(self):
      # If the request contains a login ticket, try to validate it
      if 'ticket' in self.form:
         netid = self.Validate(self.form['ticket'])
         if netid != None:
            return {"netid":netid}
         return {}
      # No valid ticket; redirect the browser to the login page to get one
      login_url = self.cas_url + 'login' \
         + '?service=' + urllib.parse.quote(self.ServiceURL())
      return {"location":login_url}

   def Validate(self, ticket):
      val_url = self.cas_url + "validate" + \
         '?service=' + urllib.parse.quote(self.ServiceURL()) + \
         '&ticket=' + urllib.parse.quote(ticket)
      r = [x.decode('UTF-8') for x in urllib.request.urlopen(val_url).readlines()]   # returns 2 lines
      if len(r) == 2 and re.match("yes", r[0]) != None:
         return str(r[1]).strip()
      return None

   def ServiceURL(self):
      if 'REQUEST_URI' in os.environ:
         ret = 'http://' + os.environ['HTTP_HOST'] + os.environ['REQUEST_URI']
         ret = re.sub(r'ticket=[^&]*&?', '', ret)
         ret = re.sub(r'\?&?$|&$', '', ret)
         return ret
      elif CONFIG["DEBUG"]:
         ret = "http://localhost:" + str(CONFIG["PORT"]) + "/login"
         return ret
      return "something is badly wrong"

def main():
  print("CASClient does not run standalone")

if __name__ == '__main__':
  main()
