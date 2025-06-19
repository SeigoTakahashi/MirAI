# GeminiAPIを使ってテキスト生成
from django.conf import settings
from google import genai

def generate_text(prompt):
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt)
    return response.text