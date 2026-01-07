import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types.ts";

// Función de inicialización segura para evitar errores de 'undefined' en el despliegue
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("Nexus: API_KEY no detectada. Las funciones de IA estarán limitadas.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzePortfolio = async (transactions: Transaction[], portfolioName: string): Promise<string> => {
  if (!transactions || transactions.length === 0) {
    return "No hay transacciones suficientes para el análisis.";
  }

  const ai = getAiClient();
  if (!ai) {
    return "Error: No se pudo conectar con el servicio de IA (Falta API Key). Configura las variables de entorno en tu servidor.";
  }

  const historyString = JSON.stringify(transactions.slice(0, 20).map(t => ({
    f: t.date,
    t: t.type,
    p: t.amountPesos,
    u: t.amountUsdt,
    pr: t.pricePerUsdt
  })));

  const prompt = `Analiza este portafolio P2P llamado "${portfolioName}" en México (MXN). 
    Historial resumido: ${historyString}. 
    Provee un análisis de rentabilidad corto y una recomendación estratégica en Markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Análisis no disponible actualmente.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "El motor de inteligencia está saturado o la clave de API es inválida.";
  }
};