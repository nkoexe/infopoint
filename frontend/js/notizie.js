// https://github.com/nkoexe/scuolasync


let notizie = []

const ui_notizia_html_template = `<span class="notizia">{testo}</span>`

// Elementi riquadro notizie
const ui_notizie_container = document.getElementById("notizie-container")
const ui_notizie_lista = document.getElementById("notizie-lista")

const notizie_scroll_speed = 0.8;
let notizie_should_scroll = false
let notizie_marginleft = 0;


function refresh_notizie() {
    ui_notizie_lista.innerHTML = ""

    // remove previously inserted adjacenthtml if there is any
    if (ui_notizie_container.children.length > 1) {
        ui_notizie_container.removeChild(ui_notizie_container.children[1])
    }

    for (const notizia of Object.values(notizie)) {
        if (notizia.active) {
            // escape html characters that can cause trouble
            const escapedText = notizia.text.replace(/[&<>"']/g, function (m) {
                return {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#039;'
                }[m];
            });
            const notizia_html = ui_notizia_html_template.replace("{testo}", escapedText);
            ui_notizie_lista.insertAdjacentHTML('beforeend', notizia_html);
        }
    }


    // No need for scroll if total length is smaller than container (plus 20px of padding)
    if (ui_notizie_lista.clientWidth < ui_notizie_container.clientWidth - 20) {
        // set the news to be aligned left, not stuck midway
        notizie_marginleft = 10;
        ui_notizie_lista.style.marginLeft = `${notizie_marginleft}px`;

        // stop scrolling
        notizie_should_scroll = false;
    } else {
        // duplicate the content in order for it to scroll without blank spaces
        copy = ui_notizie_lista.cloneNode(true);
        copy.removeAttribute("id");
        copy.style.marginLeft = '0';
        ui_notizie_container.appendChild(copy);
        // start scrolling if not already started
        if (!notizie_should_scroll) {
            notizie_should_scroll = true;
            scroll_notizie()
        }
    }
}

function scroll_notizie() {
    // stop scrolling if asked to
    if (!notizie_should_scroll) { return }
    // set the marginleft property to an increasing negative number, making the news scroll
    ui_notizie_lista.style.marginLeft = `-${notizie_marginleft}px`;
    // reset position once a full 'lap' has been made
    if (notizie_marginleft > ui_notizie_lista.clientWidth) {
        notizie_marginleft = 0;
    }
    // increase position by velocity
    notizie_marginleft += notizie_scroll_speed;
    // let the function repeat itself
    setTimeout(scroll_notizie, 10)
}