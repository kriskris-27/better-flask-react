import google.generativeai as genai
from ..config import app_config

def generate_interview_prep(company, role):
    """
    Queries Google Gemini API to get interview preparation intel for a specific role and company.
    """
    if not app_config.GEMINI_API_KEY:
        return "Gemini API key not configured. Please add a valid key to .env."

    try:
        genai.configure(api_key=app_config.GEMINI_API_KEY)
        model = genai.GenerativeModel(app_config.LLM_MODEL)
        
        prompt = f"""
        I am interviewing for a {role} position at {company}. 
        Provide a concise, professional interview preparation guide.
        Include:
        1. Key things to know about the company's culture/values.
        2. Typical interview questions for a {role} at a company like {company}.
        3. Strategic talking points or technical topics to focus on.
        Keep it under 300 words and use clear bullet points.
        """
        
        response = model.generate_content(prompt)
        return response.text
        
    except Exception as e:
        return f"AI Generation failed: {str(e)}"
