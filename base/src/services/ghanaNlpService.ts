
import { loadSettings, getAPIKey } from '@/utils/localStorage';

export enum LanguageCodes {
  English = 'en',
  Twi = 'twi',
  Ga = 'ga',
  Ewe = 'ewe',
  Dagbani = 'dag',
  Hausa = 'hau'
}

export interface TranslationRequest {
  text?: string;
  in?: string;
  fromLanguage: LanguageCodes;
  toLanguage: LanguageCodes;
}

export interface TranslationResponse {
  translatedText: string;
  fromLanguage: string;
  toLanguage: string;
  original: string;
}

export interface TextToSpeechRequest {
  text: string;
  language: LanguageCodes;
  speaker?: string;
  speed?: number;
}

// GhanaNLP Service
export const ghanaNlpService = {
  // Get API key from settings
  getAPIKey: (): string => {
    const settings = loadSettings();
    return settings.ghanaNlpApiKey || getAPIKey('ghana_nlp') || '';
  },
  
  // Get supported languages
  getSupportedLanguages: async (): Promise<{code: string, name: string}[]> => {
    try {
      const response = await fetch('https://translation-api.ghananlp.org/v1/languages', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      if (!response.ok) {
        throw new Error(`GhanaNLP API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching supported languages:', error);
      return [];
    }
  },
  
  // Translate text
  translate: async (request: TranslationRequest): Promise<TranslationResponse> => {
    try {
      const apiKey = ghanaNlpService.getAPIKey();
      if (!apiKey) {
        throw new Error('GhanaNLP API key is missing. Please check your settings.');
      }
      
      const payload = {
        in: request.in || request.text,
        fromLanguage: request.fromLanguage,
        toLanguage: request.toLanguage
      };
      
      const response = await fetch('https://translation-api.ghananlp.org/v1/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`GhanaNLP API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error translating text:', error);
      throw error;
    }
  },
  
  // Get available speakers for text-to-speech
  getAvailableSpeakers: async (): Promise<{id: string, language: string, name: string}[]> => {
    try {
      const response = await fetch('https://translation-api.ghananlp.org/tts/v1/speakers', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      if (!response.ok) {
        throw new Error(`GhanaNLP API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching available speakers:', error);
      return [];
    }
  },
  
  // Convert text to speech
  textToSpeech: async (request: TextToSpeechRequest): Promise<ArrayBuffer> => {
    try {
      const apiKey = ghanaNlpService.getAPIKey();
      if (!apiKey) {
        throw new Error('GhanaNLP API key is missing. Please check your settings.');
      }
      
      const payload = {
        text: request.text,
        language: request.language,
        speaker: request.speaker || 'default',
        speed: request.speed || 1.0
      };
      
      const response = await fetch('https://translation-api.ghananlp.org/tts/v1/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`GhanaNLP API error: ${response.statusText}`);
      }
      
      return await response.arrayBuffer();
    } catch (error) {
      console.error('Error converting text to speech:', error);
      throw error;
    }
  }
};
