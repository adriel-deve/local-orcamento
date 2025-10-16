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
      this.apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';
      console.log('✅ IA habilitada em produção com Gemini 2.5 Flash');
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

    const prompt = `Você é um assistente especializado em analisar cotações e documentos técnicos de equipamentos.

Analise o documento fornecido e extraia as seguintes informações em formato JSON.

⚠️ IMPORTANTE - TRADUÇÃO AUTOMÁTICA:
- Se o documento estiver em INGLÊS ou qualquer outro idioma, TRADUZA TODO O CONTEÚDO para PORTUGUÊS BRASILEIRO
- Todos os campos devem estar em português brasileiro, exceto códigos e números
- Mantenha termos técnicos apropriados mas traduza descrições

Formato JSON a retornar:

{
  "detected_language": "Idioma detectado (en, pt, es, etc)",
  "client_name": "Nome do cliente/empresa",
  "client_cnpj": "CNPJ se disponível",
  "delivery_time": "Prazo de entrega",
  "notes": "Observações importantes",
  "items": [
    {
      "name": "Descrição completa do item/equipamento EM PORTUGUÊS",
      "qty": 1,
      "unit": 0,
      "currency": "BRL",
      "days": null
    }
  ],
  "tech_specs": [
    {
      "parameter": "Nome do parâmetro técnico EM PORTUGUÊS",
      "value": "Valor da especificação (mantém unidades originais)"
    }
  ],
  "equipment_description": "Descrição geral do equipamento EM PORTUGUÊS",
  "principle": "Princípio de funcionamento EM PORTUGUÊS - explique DETALHADAMENTE como o equipamento funciona, seu processo operacional, fundamentos técnicos e aplicação. Se não houver informação explícita, CRIE uma explicação técnica baseada no tipo de equipamento mencionado."
}

INSTRUÇÕES IMPORTANTES:
1. SEMPRE detecte o idioma e traduza para português brasileiro se necessário
2. Se um campo não estiver disponível, use null ou string vazia
3. Para preços, extraia apenas números (sem R$, US$ ou símbolos)
4. Para especificações técnicas, extraia TODOS os pares parâmetro:valor encontrados
5. Para o "principle" (princípio de funcionamento):
   - Procure por seções como "Funcionamento", "Operação", "Descrição Técnica" ou "Operating Principle"
   - Se encontrar, extraia TODO o conteúdo e traduza para português
   - Se NÃO encontrar mas souber o tipo de equipamento, CRIE uma explicação técnica completa em português
   - Seja detalhado e técnico (mínimo 2-3 parágrafos)
6. Seja preciso e extraia todas as informações relevantes
7. TRADUZA descrições de equipamentos, especificações e textos para português

Retorne APENAS o JSON válido, sem texto adicional antes ou depois.`;

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

  async translateQuote(quoteData, targetLanguage = 'en') {
    if (!this.enabled) {
      throw new Error('IA não configurada');
    }

    const languageNames = {
      'en': 'inglês',
      'es': 'espanhol',
      'pt': 'português'
    };

    const targetLangName = languageNames[targetLanguage] || targetLanguage;

    const prompt = `Você é um tradutor especializado em documentos técnicos comerciais.

Traduza a seguinte cotação para ${targetLangName}, mantendo a estrutura JSON exata.

INSTRUÇÕES IMPORTANTES:
1. Traduza APENAS os valores de texto (strings)
2. Mantenha números, datas, preços e códigos INALTERADOS
3. Preserve termos técnicos importantes quando apropriado (ex: nomes de equipamentos específicos)
4. Para especificações técnicas, traduza os parâmetros mas mantenha unidades de medida
5. Mantenha formatação e estrutura do JSON
6. Seja preciso e profissional

Cotação original em português:
${JSON.stringify(quoteData, null, 2)}

Retorne APENAS o JSON traduzido, sem texto adicional antes ou depois.`;

    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };

    const text = await this.callAPI(requestBody);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('IA não conseguiu traduzir a cotação');
    }

    return JSON.parse(jsonMatch[0]);
  }
}

export default new GeminiService();
