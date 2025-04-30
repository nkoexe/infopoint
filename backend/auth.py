from app import app
from json import load
from flask import abort, redirect, render_template, request, url_for
from pathlib import Path
from functools import wraps
from hashlib import sha256
from oauthlib import oauth2
import logging
import requests
import json

from flask_login import (
    LoginManager,
    login_required as login_richiesto,
    login_user,
    logout_user,
    current_user,
)

logger = logging.getLogger(__name__)

users = load(open(Path(__file__).parent / "users.json"))

login_manager = LoginManager(app)

OAUTH_CLIENT_ID = (
    "xxxxxxxxxx"
)
OAUTH_CLIENT_SECRET = "xxxxxx"
REDIRECT_URI = "http://localhost:5000/loginredirect"

OAUTH_CLIENT = oauth2.WebApplicationClient(OAUTH_CLIENT_ID)

SSO_REQ_URI = OAUTH_CLIENT.prepare_request_uri(
    uri="https://accounts.google.com/o/oauth2/v2/auth",
    redirect_uri=REDIRECT_URI,
    scope="https://www.googleapis.com/auth/userinfo.email",
    prompt="select_account",
)
TOKEN_URI = "https://oauth2.googleapis.com/token"
USERINFO_URI = "https://www.googleapis.com/oauth2/v3/userinfo"


class User:
    def __init__(self, email):
        self.email = email
        self.name = users[email].get("name", "")
        self.admin = "admin" in users[email]["roles"]
        self.biblioteca = "biblioteca" in users[email]["roles"] or self.admin
        self.galleria = "galleria" in users[email]["roles"] or self.admin
        self.notizie = "notizie" in users[email]["roles"] or self.admin
        self.is_authenticated = True
        self.is_active = True
        self.is_anonymous = False

    def get_id(self):
        return self.email


class ruolo_richiesto:
    """
    Wrappers per controllare che l'utente che ha mandato la richiesta
    possiede un ruolo richiesto.
    Da usare assieme a (subito dopo) @login_richiesto.
    """

    def admin(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not current_user.admin:
                abort(403)

            return func(*args, **kwargs)

        return wrapper

    def biblioteca(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not current_user.biblioteca:
                abort(403)

            return func(*args, **kwargs)

        return wrapper

    def galleria(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not current_user.galleria:
                abort(403)

            return func(*args, **kwargs)

        return wrapper

    def notizie(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not current_user.notizie:
                abort(403)

            return func(*args, **kwargs)

        return wrapper


@login_manager.unauthorized_handler
def unauthorized():
    logger.info("richiesta non autorizzata")
    """
    Indica cosa fare con richieste di utenti che non hanno
    ancora fatto il login, a pagine che lo richiedono
    """
    return redirect(url_for("login"))


@login_manager.user_loader
def load_user(user_email):
    """
    Crea un oggetto User per lo user_email passato.
    Chiamato automaticamente da Flask-Login prima di
    processare la richiesta ricevuta.
    """
    if user_email in users:
        return User(user_email)
    else:
        return None


@app.route("/login")
def login():
    # Se l'utente ha già eseguito il login lo reindirizza alla homepage
    if current_user.is_authenticated:
        return redirect(url_for("index"))

    return render_template("login.html")


@app.route("/sso")
def ssoredirect():
    return redirect(SSO_REQ_URI)


@app.route("/loginredirect")
def loginredirect():
    """Richiesta di autorizzazione dopo l'autenticazione con Google"""

    code = request.args.get("code")

    token_url, headers, body = OAUTH_CLIENT.prepare_token_request(
        TOKEN_URI,
        authorisation_response=request.url,
        redirect_url=request.base_url,
        code=code,
    )

    try:
        token_response = requests.post(
            token_url,
            headers=headers,
            data=body,
            auth=(OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET),
        )
    except requests.exceptions.RequestException as e:
        logger.error(f"Errore durante l'autenticazione: {e}")
        # flash("Si è verificato un errore durante l'autenticazione.")
        return redirect(url_for("login"))

    try:
        OAUTH_CLIENT.parse_request_body_response(json.dumps(token_response.json()))
    except oauth2.OAuth2Error as e:
        logger.error(
            f"Errore durante l'autenticazione, probabilmente annullata dall'utente: {e}"
        )
        # flash("Autenticazione annullata.")
        return redirect(url_for("login"))

    uri, headers, body = OAUTH_CLIENT.add_token(USERINFO_URI)

    response_user_info = requests.get(uri, headers=headers, data=body)
    info = response_user_info.json()

    if info["email"] in users:
        login_user(User(info["email"]))
        return redirect(url_for("index"))

    # flash("Questo account non è autorizzato all'accesso al sistema.")
    return redirect(url_for("login"))


@app.route("/logout")
@login_richiesto
def logout():
    logout_user()
    return redirect(url_for("login"))
