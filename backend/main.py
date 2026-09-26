import os
import io
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from PIL import Image

app = FastAPI()

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini Client
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

@app.get("/")
def read_root():
    return {"message": "Veggie AI Backend is Running!"}

@app.post("/analyze")
async def analyze_vegetable(file: UploadFile = File(...)):
    if not client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY environment variable not set on Render")
    
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        prompt = (
            "Analyze this vegetable/crop image. Provide: "
            "1. Name of the vegetable/crop. "
            "2. Disease status (Healthy or Disease name). "
            "3. Simple remedies or care tips."
        )
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[image, prompt]
        )
        
        return {"result": response.text}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))