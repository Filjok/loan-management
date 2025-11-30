import { GoogleGenAI } from "@google/genai";
import { Loan, LoanAnalysis } from "../types";

const processLoanAnalysis = async (loan: Loan): Promise<LoanAnalysis> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare data context
  const historySummary = loan.payments.map(p => 
    `Date: ${p.date}, Paid: ₹${p.amountPaid}, Principal Reduced: ₹${p.principalComponent}, Remaining: ₹${p.remainingBalance}`
  ).join('\n');

  const prompt = `
    Analyze this loan data. The loan uses a diminishing balance method. Values are in Indian Rupees (₹).
    
    Loan Details:
    - Principal: ₹${loan.principalAmount}
    - Monthly Interest Rate: ${loan.interestRate}%
    - Start Date: ${loan.startDate}
    - Current Balance: ₹${loan.currentBalance}
    - Status: ${loan.status}
    
    Payment History:
    ${historySummary}
    
    Provide a JSON response with the following fields:
    1. summary (string): A brief textual summary of the repayment progress.
    2. projectedFinishDate (string): An estimated date they will finish paying if they keep the current average pace. If completed, say "Completed".
    3. financialHealth (string): "Good", "Fair", or "Critical" based on consistency and balance reduction.
    4. advice (array of strings): 3 bullet points of advice for the lender or borrower.

    Return ONLY raw JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as LoanAnalysis;
  } catch (error) {
    console.error("Error analyzing loan:", error);
    return {
        summary: "Could not generate analysis at this time.",
        financialHealth: "Fair",
        advice: ["Check internet connection", "Ensure API key is valid"],
        projectedFinishDate: "Unknown"
    };
  }
};

export { processLoanAnalysis };