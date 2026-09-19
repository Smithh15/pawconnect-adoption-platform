import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiController } from './ai.controller';
import { PetDescriptionService } from './pet-description.service';
import { GeminiProvider } from './providers/gemini.provider';
import { LLM_PROVIDER } from './providers/llm-provider.interface';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [
    {
      provide: LLM_PROVIDER,
      useFactory: (config: ConfigService) => {
        const provider = config.get<string>('LLM_PROVIDER') ?? 'gemini';
        switch (provider) {
          case 'gemini':
            return new GeminiProvider(config);
          default:
            throw new Error(`Proveedor de LLM no soportado: ${provider}`);
        }
      },
      inject: [ConfigService],
    },
    PetDescriptionService,
  ],
  exports: [PetDescriptionService],
})
export class AiModule {}
