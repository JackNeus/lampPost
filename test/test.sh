#!/bin/bash
rm -rf tmp/
mkdir tmp/
mongod --dbpath tmp/ --port 12345 --fork --logpath tmp/mongod.log
source env/bin/activate
python3 run.py --test_mode True
deactivate
mongod --dbpath tmp/ --shutdown
