import logging
from flask import (
    Blueprint,
    redirect,
    render_template,
    request,
    send_from_directory,
    url_for,
)

from app import app
from auth import users, login_richiesto, ruolo_richiesto, current_user
from databaseconnections import (
    bibliotecadb,
    notiziedb,
    galleriadb,
    file_biblioteca,
    file_galleria,
)
from frontend import (
    aggiorna_galleria,
    aggiorna_biblioteca,
    aggiorna_notizie,
    frontend as frontend_blueprint,
)


logger = logging.getLogger(__name__)


app.register_blueprint(frontend_blueprint)


@app.errorhandler(404)
def page_not_found(e):
    return render_template("404.html"), 404


@app.route("/")
@login_richiesto
def index():
    # Se l'utente ha solo un permesso non mostrare la homepage ma
    # reindirizza direttamente alla pagina a cui si ha accesso.
    if sum((current_user.biblioteca, current_user.galleria, current_user.notizie)) == 1:
        if current_user.biblioteca:
            return redirect(url_for("biblioteca"))
        elif current_user.galleria:
            return redirect(url_for("galleria"))
        elif current_user.notizie:
            return redirect(url_for("notizie"))

    # Altrimenti mostra la homepage con pulsanti in base ai propri permessi
    return render_template("home.html", user=current_user)


@app.route("/impostazioni")
@login_richiesto
@ruolo_richiesto.admin
def impostazioni():
    return render_template("impostazioni.html")


@app.route("/impostazioni/utenti")
@login_richiesto
@ruolo_richiesto.admin
def impostazioni_utenti():
    return render_template("utenti.html", users=users)


@app.route("/biblioteca", methods=["GET", "POST", "DELETE", "PUT"])
@login_richiesto
@ruolo_richiesto.biblioteca
def biblioteca():
    if request.method == "GET":
        return render_template("biblioteca.html", libri=bibliotecadb.data["books"])

    # Inserimento di un nuovo libro e modifica
    elif request.method == "POST":
        if "img_duplicated" not in request.form:
            copertina = request.files["copertina"]
            titolo = request.form["titolo"].strip()
            descrizione = request.form["descrizione"].strip()
            id = request.form["metodo"]
            # Inserimento di un libro nuovo
            if id == "0":
                if titolo and descrizione and copertina:
                    bibliotecadb.add(titolo, descrizione, copertina)
                return redirect(url_for("biblioteca"))
            # Modifica di un libro esistente
            elif id != "0" and id != "duplicate":
                if titolo and descrizione and copertina:
                    bibliotecadb.editImg(id, titolo, descrizione, copertina)
                elif titolo and descrizione:
                    bibliotecadb.edit(id, titolo, descrizione)
                return redirect(url_for("biblioteca"))

        elif "img_duplicated" in request.form:
            img = request.form["img_duplicated"].strip()
            titolo = request.form["titolo"].strip()
            descrizione = request.form["descrizione"].strip()
            if titolo and descrizione and img:
                bibliotecadb.duplicate(titolo, descrizione, img)
            return redirect(url_for("biblioteca"))

    elif request.method == "DELETE":
        id = request.form["id"]
        if bibliotecadb.data["active"] != id:
            bibliotecadb.delete(id)
        else:
            return "ko"

    elif request.method == "PUT":
        id = request.form["id"]
        # Modifica dello stato visibile o meno della notizia
        if "active" in request.form:
            bibliotecadb.editActive(id, active=True)
    return "ok"


@app.route("/galleria", methods=["GET", "POST", "DELETE", "PUT"])
@login_richiesto
@ruolo_richiesto.galleria
def galleria():
    if request.method == "GET":
        return render_template("galleria.html", media=galleriadb.data)

    elif request.method == "POST":
        media = request.files["galleria"]
        link = request.form["link"]
        text = request.form["descrizione"]
        if request.form.get("checkbox"):
            active = True
        else:
            active = False
        logging.debug(active)

        if media.filename or link:
            galleriadb.add(text, active, media, link)

            aggiorna_galleria()

        return redirect(url_for("galleria"))

    elif request.method == "DELETE":
        id = request.form["id"]
        galleriadb.delete(id)

    elif request.method == "PUT":
        id = request.form["id"]
        # Inverti la visibilità
        if "active" in request.form:
            element = galleriadb.data.get(id)
            if element is not None:
                galleriadb.edit(id, active=(not element["active"]))

    aggiorna_galleria()

    return "ok"


@app.route("/notizie", methods=["GET", "POST", "DELETE", "PUT"])
@login_richiesto
@ruolo_richiesto.notizie
def notizie():
    if request.method == "GET":
        return render_template("notizie.html", notizie=notiziedb.data)

    # Eliminazione di una notizia esistente
    elif request.method == "DELETE":
        id = request.form["id"]
        notiziedb.delete(id)

    # Inserimento di una nuova notizia
    elif request.method == "POST":
        notizia = request.form["text"].strip()

        if notizia:
            notiziedb.add(notizia)

            aggiorna_notizie()

        return redirect(url_for("notizie"))

    # Aggiornamento della notizia
    elif request.method == "PUT":
        id = request.form["id"]

        # Modifica del testo
        if "text" in request.form:
            notizia = request.form["text"].strip()

            if not notizia:
                return "ko"

            notiziedb.edit(id, text=notizia)

        # Modifica dello stato visibile o meno della notizia
        # invertendo il valore precedente
        if "active" in request.form:
            active = not notiziedb.data[id]["active"]
            notiziedb.edit(id, active=active)
            aggiorna_notizie()
            return "1" if active else "0"

    aggiorna_notizie()

    return "ok"


@app.route("/galleria/<path:filename>")
@login_richiesto
def media_galleria(filename):
    return file_galleria(filename)


@app.route("/biblioteca/<path:filename>")
@login_richiesto
def media_biblioteca(filename):
    return file_biblioteca(filename)


# @app.route("/zoom")
# @login_richiesto
# def zoom():
#     level = request.args.get("l", 100)

#     with app.test_request_context("/"):
#         emit("setzoom", str(level) + "%", broadcast=True, namespace="/frontend")

#     return "ok"


@app.route("/update")
@login_richiesto
@ruolo_richiesto.admin
def update():
    import subprocess

    try:
        subprocess.check_call(["/usr/bin/git", "pull"])
    except subprocess.CalledProcessError as e:
        logger.error(f"Error during git pull: {e}")
        return "Error in git pull"

    subprocess.Popen(["/usr/bin/systemctl", "restart", "infopoint.service"])

    return "Updating..."
