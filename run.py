from app import app
from app import CONFIG

if __name__=="__main__":
    app.run(debug = CONFIG["DEBUG"], port = CONFIG["PORT"])
