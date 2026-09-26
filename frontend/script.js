// ==========================================
// VEGGIESENSE AI - SCRIPT
// ==========================================


// ==========================================
// VARIABLES
// ==========================================

let selectedFile = null;
let cameraStream = null;
let capturedImageBlob = null;


// ==========================================
// HTML ELEMENTS
// ==========================================

const chatBox = document.getElementById("chatBox");

const imageInput = document.getElementById("imageInput");
const galleryBtn = document.getElementById("galleryBtn");

const cameraBtn = document.getElementById("cameraBtn");
const cameraModal = document.getElementById("cameraModal");
const cameraClose = document.getElementById("cameraClose");

const cameraVideo = document.getElementById("cameraVideo");
const cameraCanvas = document.getElementById("cameraCanvas");

const takePhotoBtn = document.getElementById("takePhotoBtn");
const retakeBtn = document.getElementById("retakeBtn");
const usePhotoBtn = document.getElementById("usePhotoBtn");

const previewContainer = document.getElementById("previewContainer");
const previewImage = document.getElementById("previewImage");
const removePreview = document.getElementById("removePreview");

const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");


// ==========================================
// GALLERY BUTTON
// ==========================================

galleryBtn.addEventListener("click", () => {
    imageInput.click();
});


// ==========================================
// GALLERY IMAGE SELECT
// ==========================================

imageInput.addEventListener("change", async function () {

    const file = this.files[0];

    if (!file) {
        return;
    }

    await processSelectedFile(file);
});


// ==========================================
// PROCESS SELECTED FILE
// ==========================================

async function processSelectedFile(file) {

    try {

        // HEIC / HEIF image
        if (
            file.type === "image/heic" ||
            file.type === "image/heif" ||
            file.name.toLowerCase().endsWith(".heic") ||
            file.name.toLowerCase().endsWith(".heif")
        ) {

            const converted = await heic2any({
                blob: file,
                toType: "image/jpeg",
                quality: 0.9
            });

            const blob = Array.isArray(converted)
                ? converted[0]
                : converted;

            selectedFile = new File(
                [blob],
                "converted-image.jpg",
                {
                    type: "image/jpeg"
                }
            );

        } else {

            selectedFile = file;

        }

        showPreview(selectedFile);

    } catch (error) {

        console.error("Image processing error:", error);

        alert("Could not process this image.");

    }
}


// ==========================================
// SHOW IMAGE PREVIEW
// ==========================================

function showPreview(file) {

    const reader = new FileReader();

    reader.onload = function (event) {

        previewImage.src = event.target.result;

        previewContainer.style.display = "block";
    };

    reader.readAsDataURL(file);
}


// ==========================================
// REMOVE IMAGE PREVIEW
// ==========================================

removePreview.addEventListener("click", () => {

    selectedFile = null;

    previewImage.src = "";

    previewContainer.style.display = "none";

    imageInput.value = "";

});


// ==========================================
// OPEN CAMERA
// ==========================================

cameraBtn.addEventListener("click", async () => {

    cameraModal.style.display = "flex";

    await startCamera();

});


// ==========================================
// START CAMERA
// ==========================================

async function startCamera() {

    try {

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {

            alert(
                "Your browser does not support camera access."
            );

            return;
        }

        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment"
            },
            audio: false
        });

        cameraVideo.srcObject = cameraStream;

        cameraVideo.style.display = "block";

        takePhotoBtn.style.display = "flex";

        retakeBtn.style.setProperty("display", "none", "important");

        usePhotoBtn.style.setProperty("display", "none", "important");

    } catch (error) {

        console.error("Camera error:", error);

        alert(
            "Camera access was denied or the camera is not available."
        );

        closeCamera();

    }
}


// ==========================================
// TAKE PHOTO
// ==========================================

takePhotoBtn.addEventListener("click", () => {

    if (!cameraStream) {
        return;
    }

    const width = cameraVideo.videoWidth;
    const height = cameraVideo.videoHeight;

    if (!width || !height) {

        alert("Camera is not ready yet. Please wait a moment.");

        return;
    }

    cameraCanvas.width = width;
    cameraCanvas.height = height;

    const context = cameraCanvas.getContext("2d");

    context.drawImage(
        cameraVideo,
        0,
        0,
        width,
        height
    );

    cameraCanvas.toBlob(
        function (blob) {

            if (!blob) {

                alert("Could not capture image.");

                return;
            }

            capturedImageBlob = blob;

            // Show captured image
            cameraVideo.style.display = "none";

            cameraCanvas.hidden = false;

            // Buttons
            takePhotoBtn.style.setProperty(
                "display",
                "none",
                "important"
            );

            retakeBtn.style.setProperty(
                "display",
                "flex",
                "important"
            );

            usePhotoBtn.style.setProperty(
                "display",
                "flex",
                "important"
            );

        },
        "image/jpeg",
        0.9
    );

});


// ==========================================
// RETAKE PHOTO
// ==========================================

retakeBtn.addEventListener("click", () => {

    capturedImageBlob = null;

    cameraCanvas.hidden = true;

    cameraVideo.style.display = "block";

    takePhotoBtn.style.setProperty(
        "display",
        "flex",
        "important"
    );

    retakeBtn.style.setProperty(
        "display",
        "none",
        "important"
    );

    usePhotoBtn.style.setProperty(
        "display",
        "none",
        "important"
    );

});


// ==========================================
// USE PHOTO
// ==========================================

usePhotoBtn.addEventListener("click", () => {

    if (!capturedImageBlob) {
        return;
    }

    selectedFile = new File(
        [capturedImageBlob],
        "camera-photo.jpg",
        {
            type: "image/jpeg"
        }
    );

    showPreview(selectedFile);

    closeCamera();

});


// ==========================================
// CLOSE CAMERA
// ==========================================

cameraClose.addEventListener("click", () => {

    closeCamera();

});


function closeCamera() {

    // Stop webcam
    if (cameraStream) {

        cameraStream.getTracks().forEach(
            track => track.stop()
        );

        cameraStream = null;
    }

    cameraVideo.srcObject = null;

    cameraModal.style.display = "none";

    cameraCanvas.hidden = true;

    cameraVideo.style.display = "block";

    capturedImageBlob = null;

    takePhotoBtn.style.setProperty(
        "display",
        "flex",
        "important"
    );

    retakeBtn.style.setProperty(
        "display",
        "none",
        "important"
    );

    usePhotoBtn.style.setProperty(
        "display",
        "none",
        "important"
    );

}


// ==========================================
// CLOSE CAMERA WHEN CLICK OUTSIDE
// ==========================================

cameraModal.addEventListener("click", function (event) {

    if (event.target === cameraModal) {

        closeCamera();

    }

});


// ==========================================
// SEND MESSAGE
// ==========================================

sendBtn.addEventListener("click", sendMessage);


// Press ENTER to send
messageInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {

        event.preventDefault();

        sendMessage();

    }

});


// ==========================================
// SEND MESSAGE FUNCTION
// ==========================================

async function sendMessage() {

    const text = messageInput.value.trim();

    // Nothing selected
    if (!selectedFile && !text) {
        return;
    }


    // Show user message
    if (text) {

        appendTextMessage(
            text,
            "user"
        );

    }


    // Show user image
    if (selectedFile) {

        appendImageMessage(
            selectedFile,
            "user"
        );

    }


    // Clear input
    messageInput.value = "";


    // Create FormData
    const formData = new FormData();


    // Add image
    if (selectedFile) {

        formData.append(
            "file",
            selectedFile
        );

    }


    // Add text
    if (text) {

        formData.append(
            "prompt",
            text
        );

    }


    // If no text
    if (!text) {

        formData.append(
            "prompt",
            "Identify this vegetable/crop, analyze its health status, detect any disease or nutrient deficiency, and suggest treatment or farming remedies."
        );

    }


    // Clear selected image
    selectedFile = null;

    previewImage.src = "";

    previewContainer.style.display = "none";

    imageInput.value = "";


    // Bot loading message
    const loadingMessage = appendTextMessage(
        "Analyzing your image... 🌱",
        "bot"
    );


    try {

        const response = await fetch(
            "https://veggie-ai-project.onrender.com/analyze",
            {
                method: "POST",
                body: formData
            }
        );


        // Try JSON
        let data;

        try {

            data = await response.json();

        } catch (jsonError) {

            throw new Error(
                "Server returned an invalid response."
            );

        }


        // Remove loading message
        if (loadingMessage) {
            loadingMessage.remove();
        }


        // Server error
        if (!response.ok) {

            const errorMessage =
                data.detail ||
                data.message ||
                "Something went wrong.";

            appendTextMessage(
                "❌ Error: " + errorMessage,
                "bot"
            );

            return;
        }


        // Success
        appendTextMessage(
            data.reply || "No response received.",
            "bot"
        );


    } catch (error) {

        console.error("Request error:", error);


        if (loadingMessage) {
            loadingMessage.remove();
        }


        appendTextMessage(
            "❌ Connection error: " + error.message,
            "bot"
        );

    }

}


// ==========================================
// ADD TEXT MESSAGE
// ==========================================

function appendTextMessage(text, sender) {

    const message = document.createElement("div");

    message.className =
        sender === "user"
            ? "message user-message"
            : "message bot-message";


    // Bot avatar
    if (sender === "bot") {

        const avatar = document.createElement("div");

        avatar.className = "message-avatar";

        avatar.innerHTML =
            '<i class="fa-solid fa-robot"></i>';

        message.appendChild(avatar);

    }


    // Content
    const content = document.createElement("div");

    content.className = "message-content";

    if (sender === "bot") {

        content.innerHTML = formatText(text);

    } else {

        content.textContent = text;

    }


    message.appendChild(content);

    chatBox.appendChild(message);


    // Scroll bottom
    chatBox.scrollTop = chatBox.scrollHeight;


    return message;

}


// ==========================================
// ADD IMAGE MESSAGE
// ==========================================

function appendImageMessage(file, sender) {

    const message = document.createElement("div");

    message.className =
        sender === "user"
            ? "message user-message"
            : "message bot-message";


    const content = document.createElement("div");

    content.className = "message-content";


    const img = document.createElement("img");

    img.className = "chat-image";

    img.alt = "Uploaded crop image";


    const reader = new FileReader();

    reader.onload = function (event) {

        img.src = event.target.result;

    };

    reader.readAsDataURL(file);


    content.appendChild(img);

    message.appendChild(content);

    chatBox.appendChild(message);


    chatBox.scrollTop = chatBox.scrollHeight;

}


// ==========================================
// FORMAT BOT TEXT
// ==========================================

function formatText(text) {

    // Escape HTML
    const div = document.createElement("div");

    div.textContent = text;

    let safeText = div.innerHTML;


    // Bold Gemini text
    safeText = safeText.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );


    // New lines
    safeText = safeText.replace(
        /\n/g,
        "<br>"
    );


    return safeText;

}


// ==========================================
// STOP CAMERA WHEN PAGE IS CLOSED
// ==========================================

window.addEventListener("beforeunload", () => {

    if (cameraStream) {

        cameraStream.getTracks().forEach(
            track => track.stop()
        );

    }

});