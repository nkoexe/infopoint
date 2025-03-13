// const template_youtube = `<iframe id="galleria_youtube" src="{src}" type="text/html" frameborder="0" allow="autoplay; encrypted-media" sandbox="allow-same-origin allow-scripts" allowfullscreen></iframe>`
const template_video = `<video onended="cambia_elemento_galleria()"><source src="{src}" type="video/mp4"></video>`
const template_immagine = `<img src="{src}" alt="Qui ci dovrebbe essere un'immagine. Whoops!" />`

// Path messo come fix per proxy
const socket = io('/frontend', { path: "/socket.io" });

// Elementi riquadro biblioteca
const titolobiblioteca = document.getElementById('titolobiblioteca');
const immaginebiblioteca = document.getElementById('immaginebiblioteca');
const descrizionebiblioteca = document.getElementById('descrizionebiblioteca');

let index_galleria = -1;
let dati_galleria = [];
const galleria = document.getElementById('elementi_galleria');
const galleria_didascalia = document.getElementById('didascaliagalleria').children[0];
let playing_video = false;

// -------------------------------


function crea_elementi_galleria() {
    galleria.innerHTML = "";

    for (let i = 0; i < dati_galleria.length; i++) {
        let elemento = dati_galleria[i];
        let elemento_galleria = document.createElement('div');
        elemento_galleria.id = `elemento_galleria_${i}`;

        elemento_galleria.classList.add("hidden");
        galleria.appendChild(elemento_galleria);

        if (elemento.type === 'youtube') {
            elemento_galleria.innerHTML = `<div id="galleria_youtube_${i}"></div>`

        } else if (elemento.type === 'video') {
            elemento_galleria.innerHTML = template_video.replace("{src}", "galleria/" + elemento.path)

        } else if (elemento.type === 'image') {
            elemento_galleria.innerHTML = template_immagine.replace("{src}", "galleria/" + elemento.path)

        } else {
            console.log("Errore nel tipo di elemento: " + elemento.type)
            galleria.removeChild(elemento_galleria);
        }
    }
}


function cambia_elemento_galleria() {
    if (dati_galleria.length === 0) {
        setTimeout(() => {
            cambia_elemento_galleria();
        }, 1000);
        return;
    }

    playing_video = false;

    if (index_galleria >= 0) {
        let elemento_precedente = document.getElementById(`elemento_galleria_${index_galleria}`);
        elemento_precedente.classList.add("hidden")
    }

    index_galleria = (index_galleria + 1) % dati_galleria.length;
    let elemento = dati_galleria[index_galleria];

    let elemento_sucessivo = document.getElementById(`elemento_galleria_${index_galleria}`);
    elemento_sucessivo.classList.remove("hidden")

    galleria_didascalia.innerHTML = elemento.text;

    if (elemento.type === 'youtube') {
        playing_video = true;
        window.YT.ready(() => {
            new YT.Player(`galleria_youtube_${index_galleria}`, {
                videoId: elemento.path,
                playerVars: {
                    enablejsapi: 1,
                    modestbranding: 1,
                    controls: 0,
                    // disablekb: 1,
                    fs: 0,
                    hl: 'it',
                    iv_load_policy: 3,
                    autoplay: 1,
                    loop: 0,
                    rel: 0,
                },
                events: {
                    'onReady': (event) => {
                        event.target.seekTo(0);
                        event.target.playVideo();
                    },
                    'onStateChange': (event) => {
                        if (event.data == YT.PlayerState.ENDED) {
                            cambia_elemento_galleria();
                            event.target.destroy();
                        }
                    }
                }
            })
        });


    } else if (elemento.type === 'video') {
        playing_video = true;
        elemento_sucessivo.children[0].play();
    } else if (elemento.type === 'image') {
        setTimeout(() => {
            cambia_elemento_galleria();
        }, 1000)
    } else {
        console.log("Errore nel tipo di elemento: " + elemento.type)
        cambia_elemento_galleria();
    }
}


cambia_elemento_galleria()

// -------------------------------



socket.on('biblioteca', (data) => {
    let libro = data.books[data.active];
    titolobiblioteca.innerHTML = libro.title
    immaginebiblioteca.src = "biblioteca/" + libro.img
    descrizionebiblioteca.innerHTML = libro.descr
})

socket.on('galleria', (data) => {
    if (index_galleria >= 0) {
        document.getElementById(`elemento_galleria_${index_galleria}`).classList.add("hidden")
        index_galleria = -1;
        dati_galleria = [];
    }

    for (elemento in data) {
        if (data[elemento].active) {
            dati_galleria.push(data[elemento]);
        }
    }

    // todo: aggiornare dinamicamente lista senza ricaricare tutti gli elementi
    crea_elementi_galleria();

    if (playing_video) {
        // dato che gli elementi della galleria vengono caricati nuovamente, un video non più esistente
        // non può passare al prossimo elemento della galleria, per questo il cambio manuale
        cambia_elemento_galleria();
    }
})

socket.on('notizie', (data) => {
    notizie = data

    refresh_notizie()
})

socket.on("setzoom", (data) => {
    document.body.style.zoom = data;
})


// socket.on('connect_error', reconnect)
socket.on('connect_failed', reconnect)
socket.on('disconnect', reconnect)

function reconnect() {
    fetch('/')
        .then((response) => {
            if (response.ok) {
                setTimeout(() => {
                    location.reload()
                }, 10000);
            }
        })
        .catch(() => { })
        .finally(() => {
            setTimeout(reconnect, 10000)
        })
}


// per ora il meteo non si aggiorna automaticamente, quindi ricarichiamo la pagina ogni 2 ore
setTimeout(() => {
    location.reload()
}, 7200000);