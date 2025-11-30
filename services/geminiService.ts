import { GoogleGenAI } from "@google/genai";
import { SaleRecord, Product } from "../types";

// Helper to check for API key availability - simulates the requested global check
const getApiKey = async (): Promise<string | null> => {
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
       // Fixed: openSelectKey returns void, so we await it and assume success to handle race condition
       await window.aistudio.openSelectKey();
    }
  }
  return process.env.API_KEY || null;
};

export const analyzeSalesData = async (sales: SaleRecord[], products: Product[]): Promise<string> => {
  const apiKey = await getApiKey();
  if (!apiKey) return "Error: API Key not available. Please select a key.";

  const ai = new GoogleGenAI({ apiKey });
  
  // Format data for the prompt
  const salesSummary = sales.map(s => ({
    date: s.date,
    total: s.total,
    items: s.items.map(i => `${i.name} (x${i.quantity})`).join(', ')
  }));

  const inventorySummary = products.map(p => ({
    name: p.name,
    stock: p.stock,
    price: p.price
  }));

  const prompt = `
    You are an expert data analyst inside an Excel spreadsheet for a General Store & Cosmetics shop in Pakistan. 
    Analyze the following Point of Sale data (Currency: PKR / Rupees).
    
    Sales History:
    ${JSON.stringify(salesSummary, null, 2)}

    Current Inventory:
    ${JSON.stringify(inventorySummary, null, 2)}

    Please provide a brief, professional executive summary formatted as if it were a text box note in Excel.
    Include:
    1. Total revenue (in Rs.).
    2. Best selling item.
    3. Any low stock warnings.
    4. One actionable business tip relevant to the Pakistani retail market.
    
    Keep it concise (under 150 words).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No analysis generated.";
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    // Added: Check for invalid key error to prompt user again
    if (error.toString().includes("Requested entity was not found") || (error.message && error.message.includes("Requested entity was not found"))) {
        if (window.aistudio && window.aistudio.openSelectKey) {
             await window.aistudio.openSelectKey();
             return "API Key invalid. Please try again.";
        }
    }
    return "Failed to generate analysis. Please try again.";
  }
};