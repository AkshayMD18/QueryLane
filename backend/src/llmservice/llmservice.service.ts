import { Injectable } from '@nestjs/common';
import { ChatOpenRouter } from "@langchain/openrouter";

@Injectable()
export class LlmserviceService {
    private model: ChatOpenRouter;

    constructor() {
        this.model = new ChatOpenRouter(
            "openai/gpt-oss-20b",
            {
                apiKey: process.env.OPENROUTER_API_KEY,
                temperature: 0.8,
            }
        );
    }
    async callOpenRouter(prompt: string) {
        const response = await this.model.invoke([
            { role: 'user', content: prompt }
        ]);
        console.log("OPENROUTER RESPONSE:", response.content);
        return response.content as string;
    }
}

