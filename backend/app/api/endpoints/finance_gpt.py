from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from ...services.finance_gpt import validate_api_key
import google.generativeai as genai
from ...core.config import settings


router = APIRouter(
    prefix="/finance-gpt",
    tags=["finance-gpt"]
)

@router.post("/")
async def get_finance_response(
    request: Dict[str, Any],
    api_key: str = Depends(validate_api_key)
):
    try:
        message = request.get("message")
        context = request.get("context", {})

        # Configure Gemini
        genai.configure(api_key=settings.GEMINI_API_KEY)
        print(f"Using Gemini API key: {settings.GEMINI_API_KEY[:10]}...")

        # Prepare system message with financial advisor context
        system_message = """You are an expert financial advisor with deep knowledge of:
        - Personal finance and budgeting
        - Investment strategies
        - Debt management
        - Tax planning
        - Retirement planning

        Provide clear, actionable advice based on the user's financial situation."""

        # Prepare conversation history
        messages = [{"role": "system", "content": system_message}]

        # Add financial context if available
        if context.get("userProfile"):
            profile = context["userProfile"]
            financial_context = f"""
            Monthly Income: ${profile.get('monthlyIncome', 0)}
            Monthly Budget: ${profile.get('monthlyBudget', 0)}
            Financial Goals: {profile.get('financialGoals', [])}
            """
            messages.append({"role": "system", "content": financial_context})

        # Add message history
        for msg in context.get("messageHistory", []):
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })

        # Add the current message
        messages.append({
            "role": "user",
            "content": message
        })

        try:
            # Set up the model
            model = genai.GenerativeModel('gemini-1.5-pro')
            print(f"Using Gemini model: gemini-1.5-pro")

            # Convert messages to Gemini format
            gemini_messages = []

            # Add system message as a user message (Gemini doesn't have system messages)
            gemini_messages.append({"role": "user", "parts": [system_message]})
            gemini_messages.append({"role": "model", "parts": ["I'll act as your expert financial advisor and provide advice based on your questions."]})

            # Add message history if available
            for msg in context.get("messageHistory", []):
                gemini_messages.append({
                    "role": "user" if msg["role"] == "user" else "model",
                    "parts": [msg["content"]]
                })

            # Create a chat session
            chat = model.start_chat(history=gemini_messages)

            # Send the message to Gemini
            print("Sending message to Gemini:", message)
            result = chat.send_message(message)
            ai_response = result.text
            print("Gemini response:", ai_response)

            model_used = "gemini-1.5-pro"
        except Exception as e:
            print(f"Error with Gemini API: {str(e)}")
            print("Falling back to smart response system")

            # Generate a smart fallback response based on keywords in the message
            lower_message = message.lower()
            ai_response = "As your financial assistant, I recommend creating a budget that tracks your income and expenses. This will help you identify areas where you can save money and work toward your financial goals. Start by categorizing your expenses, setting realistic spending limits, and regularly reviewing your progress."

            if any(keyword in lower_message for keyword in ["budget", "spending", "save"]):
                ai_response = """Based on your question about budgeting, I recommend tracking your expenses carefully and creating a monthly budget that allocates your income to different categories. A common approach is the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings and debt repayment.

To get started:
1. Track all expenses for a month to understand your spending patterns
2. Categorize expenses as needs, wants, and savings/debt
3. Set realistic spending limits for each category
4. Use budgeting apps or spreadsheets to monitor your progress
5. Review and adjust your budget regularly"""
            elif any(keyword in lower_message for keyword in ["invest", "stock", "fund", "market"]):
                ai_response = """Regarding your investment question, it's important to diversify your portfolio across different asset classes. Consider a mix of stocks, bonds, and possibly real estate or other alternative investments based on your risk tolerance and time horizon.

Key investment principles to follow:
1. Start investing early to benefit from compound growth
2. Diversify across different asset classes and sectors
3. Consider low-cost index funds for broad market exposure
4. Align your investment strategy with your time horizon and risk tolerance
5. Regularly rebalance your portfolio to maintain your target asset allocation"""
            elif any(keyword in lower_message for keyword in ["debt", "loan", "credit", "mortgage"]):
                ai_response = """For managing debt effectively, focus on paying off high-interest debt first while making minimum payments on other debts. Consider the debt avalanche method (paying highest interest first) or the debt snowball method (paying smallest balances first for psychological wins).

Effective debt management strategies:
1. List all debts with their interest rates and minimum payments
2. Create a debt repayment plan (avalanche or snowball method)
3. Consider consolidating high-interest debts if you qualify for lower rates
4. Avoid taking on new debt while paying off existing obligations
5. Build an emergency fund to prevent future debt from unexpected expenses"""
            elif any(keyword in lower_message for keyword in ["retire", "pension", "401k", "ira"]):
                ai_response = """For retirement planning, start saving early and take advantage of compound interest. Contribute to tax-advantaged accounts like 401(k)s or IRAs, and aim to save at least 15% of your income for retirement.

Retirement planning essentials:
1. Start saving as early as possible to benefit from compound growth
2. Maximize employer matches in retirement accounts (free money!)
3. Consider a mix of pre-tax (traditional) and after-tax (Roth) contributions
4. Increase your savings rate gradually, especially after pay raises
5. Adjust your investment mix to become more conservative as you approach retirement"""
            elif any(keyword in lower_message for keyword in ["tax", "deduction", "write-off"]):
                ai_response = """Regarding tax optimization, make sure you're taking advantage of all available deductions and credits. Consider tax-advantaged investment accounts, and keep good records of all potential deductions throughout the year.

Tax optimization strategies:
1. Maximize contributions to tax-advantaged accounts (401(k), IRA, HSA)
2. Keep detailed records of deductible expenses throughout the year
3. Consider tax-loss harvesting for investment accounts
4. Time income and deductions strategically when possible
5. Consult with a tax professional for personalized advice"""
            elif any(keyword in lower_message for keyword in ["insurance", "coverage", "policy"]):
                ai_response = """Insurance is a crucial part of financial planning. Make sure you have adequate coverage for health, life, disability, auto, and home/renters insurance based on your specific needs.

Insurance planning tips:
1. Review your coverage annually to ensure it still meets your needs
2. Consider higher deductibles to lower premium costs if you have adequate savings
3. Look for bundling discounts when purchasing multiple policies
4. Ensure you have enough liability coverage to protect your assets
5. Consider term life insurance if you have dependents relying on your income"""
            elif any(keyword in lower_message for keyword in ["emergency", "fund", "savings"]):
                ai_response = """An emergency fund is essential for financial security. Aim to save 3-6 months of essential expenses in a readily accessible account.

Emergency fund guidelines:
1. Start with a small goal (like $1,000) before building to 3-6 months of expenses
2. Keep your emergency fund in a high-yield savings account for easy access
3. Use the fund only for true emergencies (job loss, medical issues, urgent repairs)
4. Replenish the fund as soon as possible after using it
5. Consider increasing your emergency savings if you have variable income or dependents"""

            model_used = "fallback"

        # Analyze response type and extract key information
        analysis = analyze_response(ai_response)
        recommendations = extract_recommendations(ai_response)
        response_type = determine_response_type(ai_response)

        return {
            "response": ai_response,
            "type": response_type,
            "analysis": analysis,
            "recommendations": recommendations,
            "model": model_used or "fallback"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def analyze_response(response: str) -> Dict[str, Any]:
    # Add your response analysis logic here
    return {
        "sentiment": "positive" if "recommend" in response.lower() else "neutral",
        "topics": [],  # Placeholder for financial topics extraction logic
        "actionable": "actionable" in response.lower() or "recommend" in response.lower()
    }

def extract_recommendations(response: str) -> List[str]:
    # Add your recommendation extraction logic here
    recommendations = []
    lines = response.split('\n')
    for line in lines:
        if any(keyword in line.lower() for keyword in ['suggest', 'recommend', 'should', 'consider']):
            recommendations.append(line.strip())
    return recommendations

def determine_response_type(response: str) -> str:
    # Add your response type determination logic here
    if "budget" in response.lower():
        return "budget"
    elif "invest" in response.lower():
        return "investment"
    elif "debt" in response.lower():
        return "debt"
    elif "recommend" in response.lower():
        return "recommendation"
    return "analysis"
