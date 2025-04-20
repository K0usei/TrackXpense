interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
}

interface BudgetLimit {
  name: string;
  budgetLimit: number;
}

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  type?: 'budget' | 'analysis' | 'recommendation' | 'error';
}

interface FinanceGPTResponse {
  response: string;
  type: 'budget' | 'analysis' | 'recommendation' | 'error';
  analysis: any;
  recommendations: any;
}

interface FinanceGPTContext {
  userProfile: {
    monthlyIncome: number;
    monthlyBudget: number;
    financialGoals: string[];
  };
  expenses: {
    categoryBreakdown: CategoryBreakdown[];
    recentTransactions: Transaction[];
  };
  budgetLimits: BudgetLimit[];
  messageHistory?: Array<{
    content: string;
    role: 'user' | 'assistant';
  }>;
}

export class FinanceGPT {
  private static API_URL = process.env.NEXT_PUBLIC_FINANCE_GPT_API_URL
  private static API_KEY = process.env.FINANCE_GPT_API_KEY

  static async getResponse(
    message: string,
    context: FinanceGPTContext
  ): Promise<FinanceGPTResponse> {
    try {
      // Add financial context to the request
      const enrichedContext = {
        ...context,
        userProfile: {
          monthlyIncome: context.userProfile?.monthlyIncome,
          monthlyBudget: context.userProfile?.monthlyBudget,
          financialGoals: context.userProfile?.financialGoals,
        },
        expenses: {
          recentTransactions: context.expenses?.recentTransactions,
          categoryBreakdown: context.expenses?.categoryBreakdown,
        },
        messageHistory: context.messageHistory?.slice(-5) // Last 5 messages for context
      }

      const response = await fetch(this.API_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`
        },
        body: JSON.stringify({
          message,
          context: enrichedContext
        })
      });

      if (!response.ok) {
        throw new Error(`FinanceGPT service error: ${response.status}`);
      }

      const data = await response.json();
      return {
        response: data.response,
        type: data.type,
        analysis: data.analysis,
        recommendations: data.recommendations
      };
    } catch (error) {
      console.error('FinanceGPT service error:', error);
      return {
        response: "I'm having trouble processing your request. Please try again later.",
        type: 'error',
        analysis: null,
        recommendations: []
      };
    }
  }
}



