import { Injectable } from '@nestjs/common';
import { ChatOpenRouter } from '@langchain/openrouter';

@Injectable()
export class LlmserviceService {
  private model: ChatOpenRouter;

  constructor() {
    this.model = new ChatOpenRouter('poolside/laguna-s-2.1:free', {
      apiKey: process.env.OPENROUTER_API_KEY,
      temperature: 0.8,
    });
  }

  async callOpenRouter(prompt: string) {
    const response = await this.model.invoke([
      { role: 'user', content: prompt },
    ]);
    return response.content as string;
  }

  getModel() {
    return this.model;
  }
}
