function mostra_popup_ok() {
  document.getElementById("popup_ok").classList.add("visibile")
  setTimeout(() => {
    document.getElementById("popup_ok").classList.remove("visibile")
  }, 2000)
}

function mostra_popup_errore(errore) {
  document.getElementById("popup_errore_text").innerHTML = errore
  document.getElementById("popup_errore").classList.add("attivato")
}

function chiudi_popup_errore() {
  document.getElementById("popup_errore").classList.remove("attivato")
}
