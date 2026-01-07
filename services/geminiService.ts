
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

// Always use the named parameter and obtain API key exclusively from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzePortfolio = async (transactions: Transaction[], portfolioName: string): Promise<string> => {
  if (!transactions || transactions.length === 0) {
    return "No hay transacciones suficientes en este portafolio para realizar un análisis.";
  }

  // Format data for the AI to understand clearly
  const historyString = JSON.stringify(transactions.map(t => ({
    fecha: t.date,
    tipo: t.type,
    pesos: t.amountPesos,
    precio_usdt_mxn: t.pricePerUsdt,
    usdt: t.amountUsdt,
    ganancia: t.realizedPnl ? `${t.realizedPnl} MXN` : 'N/A'
  })));

  const prompt = `
    Actúa como un asesor financiero experto en criptomonedas en el mercado Mexicano.
    Estás analizando el portafolio: "${portfolioName}".
    Toda la moneda local está expresada en Pesos Mexicanos (MXN).
    
    Contexto:
    - Si el portafolio es "Inversión Principal", enfócate en la acumulación a largo plazo, el precio promedio de entrada y la solidez de la posición.
    - Si el portafolio es "Trading / Scalping", enfócate en la rentabilidad de las operaciones cerradas, la frecuencia y la gestión de corto plazo.

    Datos del historial:
    ${historyString}
    
    Por favor provee:
    1. Un resumen breve del rendimiento específico para este tipo de portafolio considerando el tipo de cambio MXN/USDT.
    2. Identifica si la estrategia actual ha sido rentable.
    3. Una recomendación corta y accionable para mejorar los resultados en el mercado mexicano.
    
    Mantén la respuesta concisa, profesional y en formato Markdown.
  `;

  try {
    // Calling generateContent with the model name and contents prompt as specified in the guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Access the .text property directly from the response object
    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Ocurrió un error al contactar al asistente inteligente. Verifica tu conexión o intenta más tarde.";
  }
};
