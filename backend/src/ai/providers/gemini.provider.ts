import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider, LlmGenerateOptions } from './llm-provider.interface';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

@Injectable()
export class GeminiProvider implements LlmProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no está definida en las variables de entorno');
    }
    this.apiKey = apiKey;
    this.model = this.config.get<string>('GEMINI_MODEL') ?? 'gemini-3.6-flash';
  }

  async generateText(options: LlmGenerateOptions): Promise<string> {
    const { systemPrompt, userPrompt, maxTokens = 500, temperature = 0.7 } = options;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    try {
      const response = await fetch(
        `${GEMINI_BASE_URL}/${this.model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: {
              maxOutputTokens: maxTokens,
              temperature,
              thinkingConfig: { thinkingLevel: 'minimal' },
            },
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(`Gemini respondió ${response.status}: ${body}`);
        throw new ServiceUnavailableException(
          'El servicio de generación de texto no está disponible en este momento',
        );
      }

      const data = await response.json();
      const candidate = data?.candidates?.[0];
      const text = (candidate?.content?.parts ?? [])
        .filter((part) => !part.thought && typeof part.text === 'string')
        .map((part) => part.text)
        .join('');

      if (candidate?.finishReason === 'MAX_TOKENS') {
        this.logger.error('Respuesta de Gemini truncada por MAX_TOKENS');
        throw new ServiceUnavailableException('No se pudo generar la descripción completa, intenta de nuevo');
      }

      if (text.trim().length === 0) {
        this.logger.error(`Respuesta de Gemini sin texto: ${JSON.stringify(data)}`);
        throw new ServiceUnavailableException('No se pudo generar la descripción');
      }

      return text.trim();
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      if (error?.name === 'AbortError') {
        throw new ServiceUnavailableException('La generación tardó demasiado, intenta de nuevo');
      }
      this.logger.error('Error llamando a Gemini', error);
      throw new ServiceUnavailableException('Error al generar la descripción');
    } finally {
      clearTimeout(timeout);
    }
  }
}
