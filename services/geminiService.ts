
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const GeminiService = {
  // Gera um logo exclusivo para o app baseado nas especificações do usuário
  generateAppLogo: async () => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: "Logo profissional e minimalista para o aplicativo 'Driver's Friend Pro'. O design deve ser um vetor limpo que incorpora elementos de direção e finanças. Cores: azul elétrico vibrante e cinza escuro (slate). Fundo branco, design plano (flat), linhas precisas, alta tecnologia e confiança."
            }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error) {
      console.error("Erro ao gerar logo:", error);
      return null;
    }
  },

  // Busca capacidade do tanque e consumo sugerido - Prompt mais rigoroso
  getCarSpecs: async (brand: string, model: string, year: string) => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Como um especialista automotivo, forneça a capacidade oficial do tanque de combustível (litros) e o consumo médio urbano (km/l) para um ${brand} ${model} ${year}. Se o veículo for fictício, forneça médias realistas para um carro de porte similar. Responda estritamente em JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tankLiters: { type: Type.NUMBER, description: "Capacidade do tanque em litros" },
              avgKml: { type: Type.NUMBER, description: "Consumo médio em KM/L" }
            },
            required: ["tankLiters", "avgKml"]
          }
        }
      });
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Gemini Error:", error);
      return null;
    }
  },

  // Analisa a saúde financeira do motorista
  analyzeFinance: async (stats: any) => {
    try {
      const prompt = `Analise estes dados reais de um motorista: 
      Bruto: R$ ${stats.gross}, 
      Combustível: R$ ${stats.fuel}, 
      Manutenção: R$ ${stats.maint}, 
      Líquido: R$ ${stats.net}. 
      Dê uma dica curta e estratégica (máximo 140 caracteres) para otimizar a rentabilidade hoje.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      return response.text;
    } catch (error) {
      return "Foque na redução de KM morto para aumentar sua margem líquida hoje!";
    }
  }
};
