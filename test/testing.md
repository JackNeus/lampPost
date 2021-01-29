# Testing
Testing LampPost is semi-automatic.
Currently, the tests are not quite unit tests. They are dependent on one another, and the order in which they are executed matters. 
This should probably be redone when our app becomes massively successful and is being rolled out nationwide.

## Installation
All the files you need are in the repository, though you'll need to install the program ```mongod``` on your machine. https://docs.mongodb.com/manual/installation/ might be helpful.

## Files
```test.sh``` sets up a local MongoDB instance and starts LampPost with the proper testing configuration file.

```test.py``` includes the tests themselves and the code that executes them.

```test_config.public_cfg``` is the test configuration file. Because this contains no actual values, it is safe to commit it to the repository.

```test_data.json``` contains fake event data for testing. All data in this file should be __valid__ event data.

## Running the Tests
To test LampPost, run the following from the main directory:
```
./test/test.sh (in one window)
python3 test/test.py (in a second window)
```
It is important you run test.sh first, as this starts up the local mongo instance.
## Adding Tests
To add tests to ```tests.py```, simply create a function for each test, and add the function name(s) to the ```tests``` array found at the bottom of ```tests.py```. 

If possible, please use ```make_test``` or ```make_test_multi``` to create your tests. These functions automatically handle setup and teardown and will ensure that the database remains clean.

## Tips
If tests are passing on one run but not on the next, try restarting ```test.sh```. If older tests fail, they don't properly clean up the database.

When ```test.sh``` is starting up, make sure you see text like ```child process started successfully, parent exiting```. This means that the local mongod server was successfully started, which is necessary for the tests to run.

If restarting ```test.sh``` doesn't resolve your issues, try running the command ```ps aux | grep -i mongo``` to check if a local mongo db is running in the background. If this is the case, you'll need to kill the process.