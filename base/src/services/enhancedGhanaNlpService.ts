
import { getAPIKey } from '@/utils/localStorage';

interface TranslationRequest {
  text: string;
  fromLanguage: string;
  toLanguage: string;
}

interface TranslationResponse {
  translatedText: string;
  originalText: string;
  fromLanguage: string;
  toLanguage: string;
}

interface TextToSpeechRequest {
  text: string;
  language: string;
  speaker?: string;
}

export class EnhancedGhanaNlpService {
  private apiKey: string | null = null;
  
  constructor() {
    this.apiKey = getAPIKey('ghananlp');
  }
  
  setApiKey(key: string) {
    this.apiKey = key;
    // Save to localStorage
    if (key) {
      localStorage.setItem('ghananlp_api_key', key);
    }
  }
  
  async getAvailableLanguages(): Promise<string[]> {
    try {
      const response = await fetch('https://translation-api.ghananlp.org/v1/languages', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.languages || [];
    } catch (error) {
      console.error("Error getting available languages:", error);
      return [];
    }
  }
  
  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    if (!this.apiKey) {
      throw new Error("API key not set. Please configure your GhanaNLP API key in settings.");
    }
    
    try {
      const response = await fetch('https://translation-api.ghananlp.org/v1/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          text: request.text,
          from_lang: request.fromLanguage,
          to_lang: request.toLanguage
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        translatedText: data.translated_text,
        originalText: request.text,
        fromLanguage: request.fromLanguage,
        toLanguage: request.toLanguage
      };
    } catch (error) {
      console.error("Error translating text:", error);
      throw error;
    }
  }
  
  async getAvailableSpeakers(): Promise<string[]> {
    try {
      const response = await fetch('https://translation-api.ghananlp.org/tts/v1/speakers', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.speakers || [];
    } catch (error) {
      console.error("Error getting available speakers:", error);
      return [];
    }
  }
  
  async textToSpeech(request: TextToSpeechRequest): Promise<ArrayBuffer> {
    if (!this.apiKey) {
      throw new Error("API key not set. Please configure your GhanaNLP API key in settings.");
    }
    
    try {
      const response = await fetch('https://translation-api.ghananlp.org/tts/v1/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          text: request.text,
          language: request.language,
          speaker: request.speaker || 'default'
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.arrayBuffer();
    } catch (error) {
      console.error("Error converting text to speech:", error);
      throw error;
    }
  }
}

// Language codes
export enum LanguageCodes {
  English = 'en',
  Twi = 'tw',
  Ga = 'ga',
  Ewe = 'ee',
  Dagbani = 'dag',
  Hausa = 'hau'
}

export const enhancedGhanaNlpService = new EnhancedGhanaNlpService();
