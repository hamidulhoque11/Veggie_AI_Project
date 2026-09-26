// Global variable for file
let selectedFile = null;

// Event listener for image selection
const imageInput = document.getElementById('imageInput');
if (imageInput) {
    imageInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            selectedFile = e.target.files[0];
        }
    });
}

// Function to send data to Render FastAPI backend
async function sendMessage() {
    const userInput = document.getElementById('userInput');
    const messageText = userInput ? userInput.value.trim() : "";
    
    if (!messageText && !selectedFile) {
        return;
    }

    // Append User Message to UI
    appendMessage(messageText || "Image uploaded", 'user');
    if (userInput) userInput.value = "";

    // Prepare FormData
    const formData = new FormData();
    if (selectedFile) {
        formData.append('file', selectedFile);
    }

    try {
        const response = await fetch("https://veggie-ai-project.onrender.com/analyze", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            // Read both reply and result key cleanly
            const botReply = data.reply || data.result || "No response content received.";
            appendMessage(botReply, 'bot');
        } else {
            appendMessage("Error: " + (data.detail || "Failed to analyze image."), 'bot');
        }
    } catch (error) {
        appendMessage("Network Error: " + error.message, 'bot');
    }

    // Reset file selection
    selectedFile = null;
    if (imageInput) imageInput.value = "";
}

// Helper function to append message to chat box
function appendMessage(text, sender) {
    const chatBox = document.getElementById('chatBox'); // adjust container ID if needed
    if (!chatBox) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}-message`;
    msgDiv.innerText = text;
    
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}