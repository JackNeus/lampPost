# Testing
Testing LampPost is semi-automatic.
```test.sh``` sets up a local MongoDB instance and starts LampPost with the proper testing configuration file.
```test.py``` runs the tests.
```test_config.public_cfg``` is the test configuration file. Because this contains no actual values, it is safe to commit it to the repository.

To test LampPost, run the following from the main directory:
```
./test/test.sh (in one window)
python3 test/test.py (in a second window)
```