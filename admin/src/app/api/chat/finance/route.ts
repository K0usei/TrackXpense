import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize Gemini Pro client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Log API key (first few characters for debugging)
console.log('Using Gemini API key:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + '...' : 'Not set');

// Set up the model
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
});

export async function POST(request: Request) {
  console.log('API route called');
  try {
    // Parse the request body
    const body = await request.json().catch(error => {
      console.error('Error parsing request JSON:', error);
      return { message: 'Unknown question', messageHistory: [] };
    });

    console.log('Request body:', body);
    const { message = 'Unknown question', messageHistory = [] } = body;
    console.log('Extracted message:', message);

    // Prepare system message with financial advisor context
    const systemPrompt = `You are Xpenser AI, an expert financial advisor within the TrackXpense application. You have deep knowledge of:
    - Personal finance and budgeting
    - Investment strategies and market analysis
    - Debt management and reduction
    - Tax planning and optimization
    - Retirement planning and savings
    - Financial goal setting
    - Expense tracking and categorization
    - Credit scores and credit management
    - Insurance and risk management
    - Financial literacy and education

    IMPORTANT CONSTRAINTS:
    1. You MUST ONLY answer questions related to finance, money, budgeting, expenses, investments, or financial planning.
    2. For any questions outside of financial topics, politely inform the user that you can only assist with financial matters.
    3. Do not provide advice on non-financial topics even if the user insists.
    4. Be concise but thorough in your financial advice.
    5. Provide actionable steps when appropriate.
    6. Always maintain a professional, helpful tone.
    7. When uncertain about specific financial details, acknowledge limitations rather than providing potentially incorrect information.
    8. Never mention that you are powered by any specific AI technology or company.

    Your purpose is to help users manage their finances better through the TrackXpense application.`;

    // Format message history for Gemini
    const formattedHistory = messageHistory
      .filter((msg: any) => msg.role === 'user' || msg.role === 'assistant')
      .map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

    // Create a chat session
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'I need help with financial advice.' }],
        },
        {
          role: 'model',
          parts: [{ text: 'I\'m your financial assistant. I can help with budgeting, investments, debt management, retirement planning, and other financial topics. What specific financial question do you have today?' }],
        },
        ...formattedHistory
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1000,
      },
    });

    console.log('Sending message to Gemini:', message);

    let responseText = '';
    let responseType = 'general';
    let modelUsed = 'gemini-1.5-pro';

    try {
      // Send the message to Gemini
      const result = await chat.sendMessage(message);
      responseText = result.response.text();
      console.log('Gemini response:', responseText);

      // Determine the response type based on content analysis
      const lowerResponse = responseText.toLowerCase();

      if (lowerResponse.includes('budget') || lowerResponse.includes('spending')) {
        responseType = 'budget';
      } else if (lowerResponse.includes('analysis') || lowerResponse.includes('trend')) {
        responseType = 'analysis';
      } else if (lowerResponse.includes('invest') || lowerResponse.includes('stock') || lowerResponse.includes('fund')) {
        responseType = 'investment';
      } else if (lowerResponse.includes('debt') || lowerResponse.includes('loan') || lowerResponse.includes('credit')) {
        responseType = 'debt';
      } else if (lowerResponse.includes('retire') || lowerResponse.includes('pension')) {
        responseType = 'retirement';
      } else if (lowerResponse.includes('tax') || lowerResponse.includes('deduction')) {
        responseType = 'tax';
      } else if (lowerResponse.includes('recommend') || lowerResponse.includes('suggest')) {
        responseType = 'recommendation';
      } else if (lowerResponse.includes('insurance') || lowerResponse.includes('coverage')) {
        responseType = 'insurance';
      } else if (lowerResponse.includes('emergency') || lowerResponse.includes('fund') || lowerResponse.includes('savings')) {
        responseType = 'savings';
      }
    } catch (geminiError) {
      console.error('Gemini API error:', geminiError);

      // Fall back to our smart response system if Gemini fails
      console.log('Falling back to smart response system');

      // Analyze the message to customize the response
      const lowerMessage = message.toLowerCase();
      modelUsed = 'fallback';

      responseText = "As your financial assistant, I recommend creating a budget that tracks your income and expenses. This will help you identify areas where you can save money and work toward your financial goals. Start by categorizing your expenses, setting realistic spending limits, and regularly reviewing your progress.";

      // Generate a more specific response based on keywords in the message
      if (lowerMessage.includes('budget') || lowerMessage.includes('spending') || lowerMessage.includes('save')) {
        responseText = `Based on your question about ${lowerMessage.includes('budget') ? 'budgeting' : 'spending'}, I recommend tracking your expenses carefully and creating a monthly budget that allocates your income to different categories. A common approach is the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings and debt repayment.

To get started:
1. Track all expenses for a month to understand your spending patterns
2. Categorize expenses as needs, wants, and savings/debt
3. Set realistic spending limits for each category
4. Use budgeting apps or spreadsheets to monitor your progress
5. Review and adjust your budget regularly`;
        responseType = 'budget';
      } else if (lowerMessage.includes('invest') || lowerMessage.includes('stock') || lowerMessage.includes('fund') || lowerMessage.includes('market')) {
        responseText = `Regarding your investment question, it's important to diversify your portfolio across different asset classes. Consider a mix of stocks, bonds, and possibly real estate or other alternative investments based on your risk tolerance and time horizon.

Key investment principles to follow:
1. Start investing early to benefit from compound growth
2. Diversify across different asset classes and sectors
3. Consider low-cost index funds for broad market exposure
4. Align your investment strategy with your time horizon and risk tolerance
5. Regularly rebalance your portfolio to maintain your target asset allocation`;
        responseType = 'investment';
      } else if (lowerMessage.includes('debt') || lowerMessage.includes('loan') || lowerMessage.includes('credit') || lowerMessage.includes('mortgage')) {
        responseText = `For managing debt effectively, focus on paying off high-interest debt first while making minimum payments on other debts. Consider the debt avalanche method (paying highest interest first) or the debt snowball method (paying smallest balances first for psychological wins).

Effective debt management strategies:
1. List all debts with their interest rates and minimum payments
2. Create a debt repayment plan (avalanche or snowball method)
3. Consider consolidating high-interest debts if you qualify for lower rates
4. Avoid taking on new debt while paying off existing obligations
5. Build an emergency fund to prevent future debt from unexpected expenses`;
        responseType = 'debt';
      } else if (lowerMessage.includes('retire') || lowerMessage.includes('pension') || lowerMessage.includes('401k') || lowerMessage.includes('ira')) {
        responseText = `For retirement planning, start saving early and take advantage of compound interest. Contribute to tax-advantaged accounts like 401(k)s or IRAs, and aim to save at least 15% of your income for retirement.

Retirement planning essentials:
1. Start saving as early as possible to benefit from compound growth
2. Maximize employer matches in retirement accounts (free money!)
3. Consider a mix of pre-tax (traditional) and after-tax (Roth) contributions
4. Increase your savings rate gradually, especially after pay raises
5. Adjust your investment mix to become more conservative as you approach retirement`;
        responseType = 'retirement';
      } else if (lowerMessage.includes('tax') || lowerMessage.includes('deduction') || lowerMessage.includes('write-off')) {
        responseText = `Regarding tax optimization, make sure you're taking advantage of all available deductions and credits. Consider tax-advantaged investment accounts, and keep good records of all potential deductions throughout the year.

Tax optimization strategies:
1. Maximize contributions to tax-advantaged accounts (401(k), IRA, HSA)
2. Keep detailed records of deductible expenses throughout the year
3. Consider tax-loss harvesting for investment accounts
4. Time income and deductions strategically when possible
5. Consult with a tax professional for personalized advice`;
        responseType = 'tax';
      } else if (lowerMessage.includes('insurance') || lowerMessage.includes('coverage') || lowerMessage.includes('policy')) {
        responseText = `Insurance is a crucial part of financial planning. Make sure you have adequate coverage for health, life, disability, auto, and home/renters insurance based on your specific needs.

Insurance planning tips:
1. Review your coverage annually to ensure it still meets your needs
2. Consider higher deductibles to lower premium costs if you have adequate savings
3. Look for bundling discounts when purchasing multiple policies
4. Ensure you have enough liability coverage to protect your assets
5. Consider term life insurance if you have dependents relying on your income`;
        responseType = 'insurance';
      } else if (lowerMessage.includes('emergency') || lowerMessage.includes('fund') || lowerMessage.includes('savings')) {
        responseText = `An emergency fund is essential for financial security. Aim to save 3-6 months of essential expenses in a readily accessible account.

Emergency fund guidelines:
1. Start with a small goal (like $1,000) before building to 3-6 months of expenses
2. Keep your emergency fund in a high-yield savings account for easy access
3. Use the fund only for true emergencies (job loss, medical issues, urgent repairs)
4. Replenish the fund as soon as possible after using it
5. Consider increasing your emergency savings if you have variable income or dependents`;
        responseType = 'savings';
      }
    }

    // Prepare the response object
    const responseObj = {
      response: responseText,
      type: responseType,
      model: modelUsed
    };

    console.log('Sending response:', responseObj);
    return NextResponse.json(responseObj);
  } catch (error) {
    console.error('Error processing request:', error);

    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // Return a generic error response
    return NextResponse.json({
      response: "I apologize, but I'm having trouble processing your request right now. Could you please try again? As your financial assistant, I'm here to help with any questions about budgeting, investments, or other financial matters.",
      type: 'general',
      model: 'error-fallback'
    });
  }
}