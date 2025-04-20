from fastapi import APIRouter, HTTPException, Security
from fastapi.security import APIKeyHeader
from typing import Dict, Any
import openai
from app.core.config import settings

router = APIRouter()

# API key header definition
API_KEY_HEADER = APIKeyHeader(name="Authorization", auto_error=True)

# Generate a secure API key
def generate_api_key():
    import secrets
    return secrets.token_urlsafe(32)

# Validate API key
async def validate_api_key(api_key: str = Security(API_KEY_HEADER)):
    key = api_key.replace("Bearer ", "")
    if key != settings.FINANCE_GPT_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return key

@router.post("/analyze")
async def analyze_finances(
    data: Dict[Any, Any],
    api_key: str = Security(validate_api_key)
):
    try:
        # Configure OpenAI
        openai.api_key = settings.OPENAI_API_KEY
        
        # Prepare the context for GPT
        prompt = f"""
        As a financial advisor, analyze the following financial data:
        Monthly Income: ${data['userProfile']['monthlyIncome']}
        Monthly Budget: ${data['userProfile']['monthlyBudget']}
        Recent Transactions: {data['expenses']['recentTransactions']}
        Category Breakdown: {data['expenses']['categoryBreakdown']}
        
        Provide insights and recommendations based on this data.
        """
        
        response = await openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a financial advisor assistant."},
                {"role": "user", "content": prompt}
            ]
        )
        
        return {
            "response": response.choices[0].message.content,
            "type": "analysis"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))