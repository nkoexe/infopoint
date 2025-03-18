"""
Connessioni da database a backend / frontend
"""

from pathlib import Path
from flask import send_from_directory


from database import BibliotecaDB, NotizieDB, GalleriaDB, DATABASEPATH


bibliotecadb = BibliotecaDB()
notiziedb = NotizieDB()
galleriadb = GalleriaDB()


def file(cartella: Path, nome_file: str):
    if not isinstance(nome_file, str):
        raise TypeError("Nome del file da mandare deve essere una stringa.")

    # preferire a send_file per evitare attacchi di path traversal
    return send_from_directory(str(cartella.resolve()), nome_file)

    # if not file.exists():
    #     raise FileNotFoundError(f"File {file} non esiste")

    # return send_file(file, mimetype="image/gif")


def file_galleria(nome_file: str):
    try:
        return file(DATABASEPATH / "galleria" / "files", nome_file)
    except FileNotFoundError:
        return ""


def file_biblioteca(nome_file: str):
    try:
        return file(DATABASEPATH / "biblioteca" / "files", nome_file)
    except FileNotFoundError:
        return ""
