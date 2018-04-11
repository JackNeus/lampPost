#!/bin/bash
rm -rf tmp/
mkdir tmp/
mongod --dbpath tmp/ --port 12345 --fork --logpath tmp/mongod.log
source env/bin/activate
python3 run.py test/test_config.public_cfg
deactivate
mongod --dbpath tmp/ --shutdown
