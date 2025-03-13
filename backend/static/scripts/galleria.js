const galleria_preview_container = document.querySelector("#galleria_file .file_preview");
const galleria_preview = document.getElementById("galleria_preview");
const galleria_dropzone = document.getElementById("file_dropzone")
const galleria_file_input = document.getElementById("galleria_file_input")


galleria_file_input.onchange = () => {
    if (galleria_file_input.files[0].size > 1024 * 1024 * 1024) {
        console.log("Il file selezionato è troppo grande.");
        return;
    }

    galleria_file_input.classList.add("loading");


    // show preview
    if (galleria_file_input.files && galleria_file_input.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            galleria_preview.setAttribute('src', e.target.result);
        }
        reader.readAsDataURL(galleria_file_input.files[0]);
        galleria_preview_container.classList.remove("hidden");
        galleria_dropzone.classList.add("hidden");
    }

    // remove yt field
    document.getElementById("oppure").classList.add("hidden");
    document.getElementById("input_link").classList.add("hidden");
}


galleria_dropzone.ondrop = (e) => {
    e.preventDefault();
    galleria_dropzone.classList.remove("filehover")

    let input = galleria_dropzone.querySelector("input")

    galleria_file_input.files = e.dataTransfer.files
    galleria_file_input.onchange()
}

galleria_dropzone.ondragover = (e) => {
    e.preventDefault();
}

galleria_dropzone.ondragenter = (e) => {
    e.preventDefault();
    galleria_dropzone.classList.add("filehover")
}

galleria_dropzone.ondragleave = (e) => {
    galleria_dropzone.classList.remove("filehover")
}

function elimina_preview() {
    galleria_preview_container.classList.add("hidden");
    galleria_dropzone.classList.remove("hidden");
    galleria_file_input.value = "";
    document.getElementById("oppure").classList.remove("hidden");
    document.getElementById("input_link").classList.remove("hidden");
}

document.getElementById("input_link").oninput = (e) => {
    if (e.target.value != "") {
        galleria_preview_container.classList.add("hidden");
        galleria_dropzone.classList.add("hidden");
        document.getElementById("oppure").classList.add("hidden");
    } else {
        galleria_dropzone.classList.remove("hidden");
        galleria_file_input.value = "";
        document.getElementById("oppure").classList.remove("hidden");
    }
}


document.querySelector("#activecheck").onchange = (e) => {
    if (e.target.checked) {
        document.querySelector("#active span").innerHTML = "visibility";
    } else {
        document.querySelector("#active span").innerHTML = "visibility_off";
    }
}


function imgshow(id) {
    $.ajax({
        url: "",
        type: "PUT",
        data: {
            "id": id,
            "active": ""
        },
        success: function (data) {
            location.reload();
        }
    });
}

function imgedit(id) {
    alert("Non implementato, abbi pazienza");
}

function imgdel(id) {
    $.ajax({
        url: "",
        type: "DELETE",
        data: {
            "id": id
        },
        success: function (data) {

            if (data == "ko") {
                alert("L'elemento selezionato non e' eliminabile in quanto attualmente attivo")
            }
            location.reload();
        }
    });
}

