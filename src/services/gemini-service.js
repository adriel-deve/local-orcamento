/**
 * Serviço de IA usando Google Gemini API REST
 * Implementação totalmente compatível com ES modules
 */
class GeminiService {
  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';

    if (!isProduction) {
      console.log('ℹ️  IA desabilitada em ambiente local.');
      this.enabled = false;
      return;
    }

    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      console.warn('⚠️  GEMINI_API_KEY não configurada.');
      this.enabled = false;
    } else {
      this.enabled = true;
      this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
      console.log('✅ IA habilitada em produção');
    }
  }

  isEnabled() {
    return this.enabled;
  }

  async callAPI(requestBody) {
    const url = `${this.apiUrl}?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  async extractQuoteFromDocument(fileBuffer, mimeType) {
    if (!this.enabled) {
      throw new Error('IA não configurada');
    }

    const prompt = `Extraia informações desta cotação em JSON:
{
  "client_name": "",
  "client_cnpj": "",
  "delivery_time": "",
  "notes": "",
  "items": [{"name": "", "qty": 1, "unit": 0, "currency": "BRL"}],
  "tech_specs": [{"parameter": "", "value": ""}],
  "equipment_description": "",
  "principle": ""
}
Retorne APENAS o JSON.`;

    let requestBody;
    if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
      const base64Data = fileBuffer.toString('base64');
      requestBody = {
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64Data } }
          ]
        }]
      };
    } else {
      const textContent = fileBuffer.toString('utf-8');
      requestBody = {
        contents: [{ parts: [{ text: `${prompt}\n\n${textContent}` }] }]
      };
    }

    const text = await this.callAPI(requestBody);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('IA não conseguiu extrair dados');
    }

    return JSON.parse(jsonMatch[0]);
  }
}

export default new GeminiService();
