// const template_youtube = `<iframe id="galleria_youtube" src="{src}" type="text/html" frameborder="0" allow="autoplay; encrypted-media" sandbox="allow-same-origin allow-scripts" allowfullscreen></iframe>`
const template_video = `<video id="galleria_video" onended="cambia_elemento_galleria()" autoplay controls><source src="{src}" type="video/mp4"></video>`
const template_immagine = `<img id="galleria_immagine" src="{src}" alt="Qui ci dovrebbe essere un'immagine. Whoops!" />`

// Path messo come fix per proxy
const socket = io('/frontend', { path: "/socket.io" });

// Il nome l'ha scelto David, questo è il riquadro per uscire da schermo intero
const dio = document.getElementById('dio');

// Elementi riquadro biblioteca
const titolobiblioteca = document.getElementById('titolobiblioteca');
const immaginebiblioteca = document.getElementById('immaginebiblioteca');
const descrizionebiblioteca = document.getElementById('descrizionebiblioteca');

let index_galleria = -1;
let dati_galleria = [];
const elemento_galleria = document.getElementById('elemento_galleria');
const galleria_didascalia = document.getElementById('didascaliagalleria').children[0];

// da rimuovere dato che il riquadro dio non viene utilizzato
function toggleFullScreen() {
    if (!document.fullscreenElement &&
        !document.mozFullScreenElement && !document.webkitFullscreenElement) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    } else {
        if (document.cancelFullScreen) {
            document.cancelFullScreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        }
    }
}

document.onkeydown = (event) => {
    if (event.code === 'Escape') {
        dio.classList.toggle('expanded');
    }
}


// -------------------------------


function cambia_elemento_galleria() {
    if (dati_galleria.length === 0) {
        setTimeout(() => {
            cambia_elemento_galleria();
        }, 1000);
        return;
    }

    index_galleria = (index_galleria + 1) % dati_galleria.length;
    let elemento = dati_galleria[index_galleria];

    if (elemento.type === 'youtube') {

        // elemento_galleria.innerHTML = template_youtube.replace("{src}", elemento.path + "?autoplay=1&controls=0&disablekb=1&enablejsapi=1&fs=0&hl=it&loop=1&modestbranding=1&iv_load_policy=3")
        elemento_galleria.innerHTML = '<div id="galleria_youtube"></div>'
        galleria_didascalia.innerHTML = elemento.text;

        new YT.Player('galleria_youtube', {
            videoId: elemento.path,
            playerVars: {
                modestbranding: 1,
                controls: 0,
                disablekb: 1,
                fs: 0,
                hl: 'it',
                iv_load_policy: 3
            },
            events: {
                'onReady': (event) => {
                    event.target.playVideo();
                },
                'onStateChange': (event) => {
                    if (event.data == YT.PlayerState.ENDED) {
                        cambia_elemento_galleria();
                    }
                }
            }
        });

    } else if (elemento.type === 'video') {
        elemento_galleria.innerHTML = template_video.replace("{src}", "galleria/" + elemento.path)
        galleria_didascalia.innerHTML = elemento.text;

    } else if (elemento.type === 'image') {
        elemento_galleria.innerHTML = template_immagine.replace("{src}", "galleria/" + elemento.path)
        galleria_didascalia.innerHTML = elemento.text;

        setTimeout(() => {
            cambia_elemento_galleria();
        }, 10000)

    } else {
        console.log("Errore nel tipo di elemento: " + elemento.type)
        cambia_elemento_galleria();
    }
};

cambia_elemento_galleria()

// -------------------------------



socket.on('biblioteca', (data) => {
    let libro = data.books[data.active];
    titolobiblioteca.innerHTML = libro.title
    immaginebiblioteca.src = "biblioteca/" + libro.img
    descrizionebiblioteca.innerHTML = libro.descr
})

socket.on('galleria', (data) => {
    index_galleria = 0;
    dati_galleria = [];
    for (elemento in data) {
        if (data[elemento].active) {
            dati_galleria.push(data[elemento]);
        }
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
                }, 500);
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