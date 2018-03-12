# Installation 

To get started, clone the repository and run the following commands in the directory.
Development for this project will take place in a virtual environment. 
This will make installing dependencies easier and (hopefully) cleaner.

Run the following command to install virtualenv:
sudo pip install virtualenv

To create and setup your virtual environment, run:
virtualenv env

To enter your virtual environment, run:
source env/bin/activate

You then need to install dependencies for the project. Do this by running:
pip3 install -r requirements.txt

Tip:
You can save time in the long run by adding the following alias to your .bashrc:
alias activate='source env/bin/activate'
Then you can start your virtualenv by running 'activate'.

To exit your virtual environment, run:
deactivate

# Installing dependencies

When you install something new for the project (using pip), please update requirements.txt. This will make it easier for collaborators to install the proper dependencies. To do this, run:
pip freeze > requirements.txt

Conversely, to update your virtual environment (install new dependencies),
run:
pip install -r requirements.txt

# Getting Started

Run the following:
cp config.info dev_config.cfg

Then edit dev_config.cfg and add appropriate values.

# Development

Run the following to run the app locally: python run.py

# Stylesheets

Stylesheets are located in static/css.
Use SASS for syntactically better stylesheets.
After installing SASS, you can leave the following running in a terminal window to automatically compile .scss files as you make changes:
sass --watch app/static/css/scss:app/static/css/