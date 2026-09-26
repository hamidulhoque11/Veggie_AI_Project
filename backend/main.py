from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from google import genai
import pandas as pd
import requests
import io
from PIL import Image

app = FastAPI()

# Enable CORS for Frontend Communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini API Key
GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE"
client = genai.Client(api_key=GEMINI_API_KEY)

# Google Drive Direct Export URL
FILE_ID = "1xYI-EjQndv-oNIliIVX6eKPo2PG40C0D"
DRIVE_URL = f"https://docs.google.com/spreadsheets/d/{FILE_ID}/export?format=xlsx"

# Load Dataset from Google Drive
try:
    response = requests.get(DRIVE_URL)
    df = pd.read_excel(io.BytesIO(response.content), skiprows=3)
except Exception as e:
    print(f"Error loading dataset: {e}")

@app.get("/")
def home():
    return {"status": "VeggieSense AI Backend is Running!"}

@app.post("/analyze")
async def analyze_veggie(prompt: str = Form(""), file: UploadFile = File(None)):
    veggie_name = ""
    
    # 1. Identify Leafy Green from Image
    if file:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        
        vision_prompt = (
            "Analyze the image and identify the leafy vegetable. "
            "Your output MUST ONLY be one of the exact category names from this list: "
            f"{list(df['Folder/Class Name'].unique())}. "
            "If the image does not contain any recognizable leafy vegetable from the list, respond strictly with 'INVALID'."
        )
        res = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=[image, vision_prompt]
        )
        veggie_name = res.text.strip()
    else:
        veggie_name = prompt

    # 2. Search Nutrition Info in Dataset
    matched_data = df[df['Folder/Class Name'].str.lower() == veggie_name.lower()]
    
    if matched_data.empty:
        context_info = "No specific dataset row found. Prompt the user politely that you can only recognize supported leafy greens."
    else:
        context_info = matched_data.to_dict(orient='records')[0]

    # 3. Strict System Instruction & English Final Prompt
    final_prompt = f"""
    You are 'VeggieSense AI', a specialized AI assistant expert in leafy green vegetables and nutrition tracking.
    
    STRICT RULES:
    1. Answer ONLY in English language.
    2. Respond strictly regarding leafy greens, nutrition, calories, vitamins, and health benefits based on the provided dataset.
    3. If the user asks anything unrelated to vegetables or nutrition (e.g., sports, coding, general chat), politely decline in English, stating that you are dedicated solely to leafy vegetables and nutritional information.

    User Input/Question: {prompt if prompt else veggie_name}
    Identified Category: {veggie_name}
    Nutritional Dataset Info: {context_info}

    Provide a well-structured, clear, and professional response in English summarizing the vegetable name, nutritional values (calories, protein, iron, calcium, vitamins), and health benefits.
    """
    
    final_response = client.models.generate_content(
        model='gemini-1.5-flash',
        contents=final_prompt
    )

    return {
        "identified_name": veggie_name,
        "reply": final_response.text
    }