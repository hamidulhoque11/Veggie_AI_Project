// Initialize Lucide Icons
lucide.createIcons();

let selectedFile = null;
let videoStream = null;

// ==========================================
// FILE UPLOAD HANDLERS
// ==========================================
function previewFile(event) {
  const file = event.target.files[0];
  if (file) {
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('image-preview').src = e.target.result;
      document.getElementById('image-preview-container').classList.remove('hidden');
    }
    reader.readAsDataURL(file);
  }
}

function removeImage() {
  selectedFile = null;
  document.getElementById('file-input').value = '';
  document.getElementById('image-preview-container').classList.add('hidden');
}

// ==========================================
// LIVE CAMERA HANDLERS
// ==========================================
async function openCamera() {
  const modal = document.getElementById('camera-modal');
  const video = document.getElementById('camera-video');

  try {
    // Request back camera on mobile or default camera on PC
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });
    video.srcObject = videoStream;
    modal.classList.remove('hidden');
  } catch (err) {
    alert("Camera permission denied or camera not available on this device.");
    console.error("Camera Access Error:", err);
  }
}

function closeCamera() {
  const modal = document.getElementById('camera-modal');
  const video = document.getElementById('camera-video');

  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
  video.srcObject = null;
  modal.classList.add('hidden');
}

function capturePhoto() {
  const video = document.getElementById('camera-video');
  const canvas = document.createElement('canvas');
  
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;

  const ctx = canvas.getContext('2d');
  // Mirror canvas draw to match mirrored video
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob((blob) => {
    if (blob) {
      selectedFile = new File([blob], `captured_veggie_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // Update UI with preview
      document.getElementById('image-preview').src = URL.createObjectURL(blob);
      document.getElementById('image-preview-container').classList.remove('hidden');
      
      closeCamera();
    }
  }, 'image/jpeg', 0.9);
}

// ==========================================
// SEND MESSAGE & API HANDLER
// ==========================================
async function handleSend(e) {
  e.preventDefault();
  
  const inputField = document.getElementById('text-input');
  const promptText = inputField.value.trim();

  if (!promptText && !selectedFile) return;

  const chatBox = document.getElementById('chat-box');

  // 1. Append User Message
  let userMsgHTML = `
    <div class="flex items-start justify-end gap-3">
      <div class="bg-emerald-600 text-white p-3.5 rounded-2xl rounded-tr-none max-w-[85%] text-sm shadow-sm space-y-2">
  `;

  if (selectedFile) {
    const imgURL = URL.createObjectURL(selectedFile);
    userMsgHTML += `<img src="${imgURL}" class="w-48 h-32 object-cover rounded-lg border border-emerald-400 mb-1">`;
  }

  if (promptText) {
    userMsgHTML += `<p>${promptText}</p>`;
  }

  userMsgHTML += `</div></div>`;
  chatBox.insertAdjacentHTML('beforeend', userMsgHTML);

  const currentPrompt = promptText;
  const currentFile = selectedFile;
  inputField.value = '';
  removeImage();
  chatBox.scrollTop = chatBox.scrollHeight;

  // 2. Append Loading Indicator
  const loadingID = 'loading-' + Date.now();
  const loadingHTML = `
    <div id="${loadingID}" class="flex items-start gap-3">
      <div class="bg-emerald-700 text-white p-2 rounded-full mt-1">
        <i data-lucide="bot" class="w-5 h-5"></i>
      </div>
      <div class="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm text-xs text-slate-500 italic flex items-center gap-2">
        <span class="w-2 h-2 bg-emerald-600 rounded-full animate-ping"></span> Analyzing image and calculating nutrition...
      </div>
    </div>
  `;
  chatBox.insertAdjacentHTML('beforeend', loadingHTML);
  lucide.createIcons();
  chatBox.scrollTop = chatBox.scrollHeight;

  // 3. Send Request to FastAPI Backend
  const formData = new FormData();
  if (currentPrompt) formData.append('prompt', currentPrompt);
  if (currentFile) formData.append('file', currentFile);

  try {
const response = await fetch("https://veggie-ai-project.onrender.com/analyze", {
    method: "POST",
    body: formData,
});

    const data = await response.json();
    document.getElementById(loadingID).remove();

    const botMsgHTML = `
      <div class="flex items-start gap-3">
        <div class="bg-emerald-700 text-white p-2 rounded-full mt-1">
          <i data-lucide="bot" class="w-5 h-5"></i>
        </div>
        <div class="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] text-slate-800 text-sm leading-relaxed whitespace-pre-line">
          ${data.reply}
        </div>
      </div>
    `;
    chatBox.insertAdjacentHTML('beforeend', botMsgHTML);

  } catch (err) {
    document.getElementById(loadingID).remove();
    const errorHTML = `
      <div class="flex items-start gap-3">
        <div class="bg-red-600 text-white p-2 rounded-full mt-1">
          <i data-lucide="alert-triangle" class="w-5 h-5"></i>
        </div>
        <div class="bg-red-50 border border-red-200 text-red-700 p-3 rounded-2xl rounded-tl-none text-xs">
          Backend Connection Error! Make sure your Python server (main.py) is running.
        </div>
      </div>
    `;
    chatBox.insertAdjacentHTML('beforeend', errorHTML);
  }

  lucide.createIcons();
  chatBox.scrollTop = chatBox.scrollHeight;
}