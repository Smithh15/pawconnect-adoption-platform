export interface LlmGenerateOptions {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LlmProvider {
  generateText(options: LlmGenerateOptions): Promise<string>;
}

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
