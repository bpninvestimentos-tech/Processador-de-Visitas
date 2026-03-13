import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = "gemini-3-flash-preview";

export const generateDataInsights = async (csvData: string) => {
  try {
    const prompt = `
      Você é um analista de dados do sistema prisional.
      Analise o seguinte CSV de agendamentos de visitas (sem cabeçalhos).
      
      Os dados representam agendamentos de visitas.
      
      Gere um resumo curto e profissional em texto corrido (Markdown) contendo:
      1. Total de visitas agendadas.
      2. Qual galeria tem o maior volume de visitas.
      3. Qual horário de pico.
      4. Alerta se houver nomes de internos duplicados (indício de erro de agendamento).

      Dados CSV:
      ${csvData.substring(0, 10000)} // Limit to avoid token limits
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Não foi possível gerar a análise inteligente no momento.";
  }
};

export const smartRepairCSV = async (malformedText: string): Promise<string> => {
  try {
     const prompt = `
      Você é um especialista em recuperação de dados. 
      O usuário forneceu um texto que deveria ser um CSV de agendamento, mas pode estar mal formatado (copiado de email, PDF, etc).
      
      Sua tarefa:
      1. Identificar padrões de: Nome do Interno, Galeria, Nome do Visitante, Documento/ID, Telefone, Horário.
      2. Transformar esse texto em um CSV limpo com os seguintes cabeçalhos EXATOS na primeira linha:
      "Carimbo de data/hora","Resposta do formulário 0","Resposta do formulário 1","Resposta do formulário 2","Nome","Sobrenome","Tel.","Horário de início do agendamento"
      
      Regras de Mapeamento para os cabeçalhos de saída:
      - Interno -> Resposta do formulário 0
      - Galeria -> Resposta do formulário 1
      - Visitante Principal -> Resposta do formulário 2 (ou Sobrenome, dependendo do contexto, preencha ambos se incerto)
      - Documento/Matrícula -> Nome
      - Telefone -> Tel.
      - Horário -> Horário de início do agendamento

      Retorne APENAS o bloco CSV raw, sem markdown, sem explicações.
      
      Texto Bruto:
      ${malformedText.substring(0, 5000)}
     `;

     const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
     });

     const text = response.text || "";
     // Strip markdown if Gemini adds it
     return text.replace(/```csv|```/g, "").trim();

  } catch (error) {
    console.error("Smart Repair Error:", error);
    throw new Error("Falha na reparação inteligente.");
  }
}
