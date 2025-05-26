
import { loadSettings, getAPIKey } from '@/utils/localStorage';

// Define message types
export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}

export interface GroqOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  streamResponse?: boolean;
}

export interface GroqChatOptions {
  model?: string;
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

export const GROQ_MODELS = {
  CHAT: 'llama-3.3-70b-versatile',
  VISION: 'meta-llama/llama-4-scout-17b-16e-instruct'
};

// Groq service
export const groqService = {
  // Get API key from settings
  getAPIKey: (): string => {
    const settings = loadSettings();
    return settings.groqApiKey || getAPIKey('groq') || '';
  },
  
  // Chat with Groq API
  chat: async (
    messages: GroqMessage[],
    options: GroqOptions = {}
  ): Promise<string> => {
    try {
      const apiKey = groqService.getAPIKey();
      if (!apiKey) {
        throw new Error('Groq API key is missing. Please check your settings.');
      }
      
      const model = options.model || GROQ_MODELS.CHAT;
      const temperature = options.temperature || 0.7;
      const maxTokens = options.maxTokens || 4096;
      const topP = options.topP || 1;
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          top_p: topP,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Groq API error: ${error.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error in Groq chat API:', error);
      return `Sorry, I encountered an error while processing your request: ${(error as Error).message}`;
    }
  },

  // Custom chat method for advanced options
  customChat: async (options: GroqChatOptions): Promise<any> => {
    try {
      const apiKey = groqService.getAPIKey();
      if (!apiKey) {
        throw new Error('Groq API key is missing. Please check your settings.');
      }
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Groq API error: ${error.error?.message || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in Groq custom chat API:', error);
      throw error;
    }
  },
  
  // Chat with vision capabilities - URL version
  chatWithVision: async (
    prompt: string,
    imageUrl: string,
    options: GroqOptions = {}
  ): Promise<string> => {
    try {
      const apiKey = groqService.getAPIKey();
      if (!apiKey) {
        throw new Error('Groq API key is missing. Please check your settings.');
      }
      
      const model = options.model || GROQ_MODELS.VISION;
      const temperature = options.temperature || 0.7;
      const maxTokens = options.maxTokens || 4096;
      
      const messages = [
        {
          role: 'user' as const,
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ];
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Groq API error: ${error.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error in Groq vision API:', error);
      return `Sorry, I encountered an error while analyzing the image: ${(error as Error).message}`;
    }
  },
  
  // Chat with vision capabilities - Base64 version
  chatWithVisionBase64: async (
    prompt: string,
    base64Image: string, // Must be in format: data:image/jpeg;base64,/9j/4AAQSkZJRgABA...
    options: GroqOptions = {}
  ): Promise<string> => {
    try {
      const apiKey = groqService.getAPIKey();
      if (!apiKey) {
        throw new Error('Groq API key is missing. Please check your settings.');
      }
      
      const model = options.model || GROQ_MODELS.VISION;
      const temperature = options.temperature || 0.7;
      const maxTokens = options.maxTokens || 4096;
      
      console.log(`Using model: ${model} for vision analysis`);
      
      const messages = [
        {
          role: 'user' as const,
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: base64Image // Already in the format data:image/jpeg;base64,...
              }
            }
          ]
        }
      ];
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Groq API error: ${error.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error in Groq vision API (base64):', error);
      return `Sorry, I encountered an error while analyzing the image: ${(error as Error).message}`;
    }
  }
};
