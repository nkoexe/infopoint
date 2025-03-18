import logging
from secrets import token_hex

from flask import Flask
from flask_socketio import SocketIO
from werkzeug.middleware.proxy_fix import ProxyFix


logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = token_hex(32)
# app.secret_key = "dev"
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 24 * 60 * 60

app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

socketio = SocketIO(app)


logger.debug("Inizializzazione del sistema...")
import routes

logger.info("Sistema inizializzato.")
