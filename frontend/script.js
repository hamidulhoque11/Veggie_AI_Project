// Initialize Lucide Icons
lucide.createIcons();

let selectedFile = null;

// Preview selected image before sending
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

// Remove selected image
function removeImage() {
  selectedFile = null;
  document.getElementById('file-input').value = '';
  document.getElementById('image-preview-container').classList.add('hidden');
}

// Handle sending message and image
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
    const response = await fetch('http://127.0.0.1:8000/analyze', {
      method: 'POST',
      body: formData
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