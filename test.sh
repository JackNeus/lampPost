#!/bin/bash
mongod --dbpath test/ --port 12345 --fork --logpath test/mongod.log
source env/bin/activate
python3 run.py test_config.cfg
deactivate
mongod --dbpath test/ --shutdown
