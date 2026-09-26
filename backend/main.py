import os
import io

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from PIL import Image


app = FastAPI()


# Enable CORS for frontend hosting
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("WARNING: GEMINI_API_KEY is not configured.")

client = genai.Client(api_key=api_key) if api_key else None


@app.get("/")
def home():
    return {
        "message": "VeggieSense AI Backend is Live!"
    }


@app.post("/analyze")
async def analyze_crop(
    file: UploadFile = File(None),
    prompt: str = Form(None)
):
    try:
        # Check API key
        if not client:
            raise HTTPException(
                status_code=500,
                detail="GEMINI_API_KEY is not configured on the server."
            )

        contents = []

        # If user uploaded an image
        if file:
            image_bytes = await file.read()

            if not image_bytes:
                raise HTTPException(
                    status_code=400,
                    detail="The uploaded image is empty."
                )

            try:
                image = Image.open(io.BytesIO(image_bytes))
                image.load()

                # Convert to RGB for reliable processing
                if image.mode != "RGB":
                    image = image.convert("RGB")

                contents.append(image)

            except Exception:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid or unsupported image file."
                )

        # User prompt or default prompt
        text_prompt = (
            prompt.strip()
            if prompt and prompt.strip()
            else
            """
            Identify the vegetable or crop in the image.

            Analyze:
            1. Vegetable/crop name
            2. Whether the plant looks healthy
            3. Visible disease or pest symptoms
            4. Possible nutrient deficiency
            5. Possible causes
            6. Recommended treatment or farming remedies
            7. Preventive measures

            If the image does not clearly show a vegetable or crop,
            clearly say that the image cannot be identified reliably.

            Do not invent a disease when there is not enough visual evidence.
            """
        )

        contents.append(text_prompt)

        # Gemini 2.5 Flash
        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=contents
        )

        # Make sure Gemini returned text
        if not response.text:
            return {
                "reply": "Gemini did not return a text response. Please try another image."
            }

        return {
            "reply": response.text
        }

    except HTTPException:
        raise

    except Exception as e:
        print("Gemini/API Error:", repr(e))

        raise HTTPException(
            status_code=500,
            detail=f"AI analysis failed: {str(e)}"
        )