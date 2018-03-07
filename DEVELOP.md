To get started, run the following commands:
aptitude update
aptitude -y upgrade
aptitude install -y build-essential python-dev python2.7-dev

You also need to install pip. Look online for how to do this.

Development for this project will take place in a virtual environment. This will make installing dependencies easier and (hopefully) cleaner.

Run the following command to install virtualenv:
sudo pip install virtualenv

To create and setup your virtual environment, run:
virtualenv env

To enter your virtual environment, run:
source env/bin/activate

You can save time in the long run by adding the following alias to your .bashrc:
alias activate='source env/bin/activate'
Then you can start your virtualenv by running 'activate'.

To exit your virtual environment, run:
deactivate

When you install something new for the project (using pip), please update requirements.txt. This will make it easier for collaborators to install the proper dependencies. To do this, run:
pip freeze > requirements.txt

Conversely, to update your virtual environment (install new dependencies),
run:
pip install -r requirements.txt
YOU NEED TO DO THIS THE FIRST TIME YOU START YOUR VIRTUALENV.
