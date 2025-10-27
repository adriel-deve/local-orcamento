/**
 * Serviço de IA para processamento de documentos e cotações
 * Usa Google Gemini API REST (gratuito até 1 milhão de tokens/mês)
 * Implementação usando fetch direto para evitar problemas de ES modules
 */
class AIService {
  constructor() {
    // Verificar se está em produção
    const isProduction = process.env.NODE_ENV === 'production';

    if (!isProduction) {
      console.log('ℹ️  IA desabilitada em ambiente local. Funciona apenas em produção.');
      this.enabled = false;
      return;
    }

    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      console.warn('⚠️  GEMINI_API_KEY não configurada. Funcionalidades de IA desabilitadas.');
      this.enabled = false;
    } else {
      this.enabled = true;
      this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
      console.log('✅ IA habilitada em produção com Google Gemini API');
    }
  }

  async _callGeminiAPI(requestBody) {
    const url = `${this.apiUrl}?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
1  }

  /**
   * Verifica se o serviço de IA está habilitado
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Extrai dados de uma cotação a partir de um arquivo (PDF, imagem, texto)
   * @param {Buffer} fileBuffer - Buffer do arquivo
   * @param {string} mimeType - Tipo MIME do arquivo (image/jpeg, application/pdf, etc)
   * @returns {Promise<Object>} Dados extraídos da cotação
   */
  async extractQuoteFromDocument(fileBuffer, mimeType) {
    if (!this.enabled) {
      throw new Error('Serviço de IA não está configurado. Configure GEMINI_API_KEY no .env');
    }

    try {
      const prompt = `
Você é um assistente especializado em extrair informações de cotações/orçamentos comerciais.
Analise o documento fornecido e extraia as seguintes informações em formato JSON:

{
  "client_name": "Nome do cliente",
  "client_address": "Endereço completo",
  "client_cnpj": "CNPJ se disponível",
  "client_contact": "Pessoa de contato",
  "quote_date": "Data da cotação no formato YYYY-MM-DD",
  "delivery_time": "Prazo de entrega",
  "notes": "Observações ou notas importantes",
  "items": [
    {
      "name": "Descrição do item/equipamento",
      "qty": número quantidade,
      "unit": preço unitário (apenas número),
      "currency": "BRL ou USD",
      "days": dias (se for serviço)
    }
  ],
  "tech_specs": [
    {
      "parameter": "Nome do parâmetro técnico",
      "value": "Valor da especificação"
    }
  ],
  "equipment_description": "Descrição geral do equipamento",
  "principle": "Princípio de funcionamento se disponível"
}

IMPORTANTE:
- Se um campo não estiver disponível no documento, use null
- Para preços, extraia apenas o número (sem R$ ou símbolos)
- Para datas, tente converter para formato YYYY-MM-DD
- Para especificações técnicas, extraia todos os pares parâmetro:valor que encontrar
- Seja preciso e extraia todas as informações relevantes

Retorne APENAS o JSON, sem texto adicional.
`;

      let requestBody;

      // Se for imagem ou PDF, enviar como parte multimodal
      if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
        const base64Data = fileBuffer.toString('base64');
        requestBody = {
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }]
        };
      } else {
        // Se for texto puro
        const textContent = fileBuffer.toString('utf-8');
        requestBody = {
          contents: [{
            parts: [
              { text: `${prompt}\n\nDocumento:\n${textContent}` }
            ]
          }]
        };
      }

      const text = await this._callGeminiAPI(requestBody);

      // Extrair JSON da resposta (remover markdown se houver)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('IA não conseguiu extrair dados estruturados do documento');
      }

      const extractedData = JSON.parse(jsonMatch[0]);
      return extractedData;

    } catch (error) {
      console.error('Erro ao processar documento com IA:', error);
      throw new Error(`Falha ao processar documento: ${error.message}`);
    }
  }

  /**
   * Traduz uma cotação completa para outro idioma
   * @param {Object} quoteData - Dados da cotação
   * @param {string} targetLanguage - Idioma alvo ('en', 'es', etc)
   * @returns {Promise<Object>} Cotação traduzida
   */
  async translateQuote(quoteData, targetLanguage = 'en') {
    if (!this.enabled) {
      throw new Error('Serviço de IA não está configurado. Configure GEMINI_API_KEY no .env');
    }

    try {
      const languageNames = {
        'en': 'inglês',
        'es': 'espanhol',
        'pt': 'português'
      };

      const targetLangName = languageNames[targetLanguage] || targetLanguage;

      const prompt = `
Traduza a seguinte cotação para ${targetLangName}, mantendo a estrutura JSON exata.
Traduza APENAS os valores de texto, mantenha números, datas e códigos inalterados.
Preserve termos técnicos importantes quando apropriado.

Cotação original:
${JSON.stringify(quoteData, null, 2)}

Retorne APENAS o JSON traduzido, sem texto adicional.
`;

      const requestBody = {
        contents: [{
          parts: [{ text: prompt }]
        }]
      };

      const text = await this._callGeminiAPI(requestBody);

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('IA não conseguiu traduzir a cotação');
      }

      const translatedData = JSON.parse(jsonMatch[0]);
      return translatedData;

    } catch (error) {
      console.error('Erro ao traduzir cotação:', error);
      throw new Error(`Falha ao traduzir: ${error.message}`);
    }
  }

  /**
   * Melhora descrições de produtos/serviços usando IA
   * @param {string} description - Descrição original
   * @returns {Promise<string>} Descrição melhorada
   */
  async improveDescription(description) {
    if (!this.enabled) {
      throw new Error('Serviço de IA não está configurado. Configure GEMINI_API_KEY no .env');
    }

    try {
      const prompt = `
Você é um especialista em redação técnica comercial.
Melhore a seguinte descrição de produto/serviço, tornando-a mais profissional e clara:

"${description}"

IMPORTANTE:
- Mantenha todas as informações técnicas originais
- Torne o texto mais profissional e persuasivo
- Use linguagem técnica apropriada
- Seja conciso (máximo 3-4 linhas)
- Retorne APENAS a descrição melhorada, sem comentários adicionais
`;

      const requestBody = {
        contents: [{
          parts: [{ text: prompt }]
        }]
      };

      const text = await this._callGeminiAPI(requestBody);
      return text.trim();

    } catch (error) {
      console.error('Erro ao melhorar descrição:', error);
      throw new Error(`Falha ao melhorar descrição: ${error.message}`);
    }
  }
}

// Exportar instância única (singleton)
const aiService = new AIService();
export default aiService;
