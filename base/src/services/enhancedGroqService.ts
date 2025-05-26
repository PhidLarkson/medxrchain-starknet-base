
import { toast } from '@/hooks/use-toast';
import { groqService } from './groqService';

interface PatientData {
  id: string;
  name: string;
  age: number;
  gender: string;
  condition: string;
  [key: string]: any;
}

interface VitalSign {
  heartRate: number;
  bloodPressure: number;
  oxygenLevel: number;
  temperature: number;
  timestamp: string;
  [key: string]: any;
}

interface MedicalDataAnalysisRequest {
  patientData: PatientData;
  vitalSigns: VitalSign[];
  additionalContext?: string;
}

interface ImageAnalysisRequest {
  imageBase64: string;
  prompt: string;
  useVisionModel?: boolean;
}

// Enhanced Groq service with specialized medical prompts and vision capabilities
export const enhancedGroqService = {
  // Analyze medical data using a specialized prompt
  async analyzeMedicalData({ patientData, vitalSigns, additionalContext }: MedicalDataAnalysisRequest) {
    try {
      const latestVitals = vitalSigns[vitalSigns.length - 1];
      
      // Create a detailed prompt for medical analysis
      const prompt = `
You are an AI medical assistant analyzing patient telemetry data. Please provide a concise assessment of the following patient's vital signs and recommend any actions if needed.

Patient Information:
- Name: ${patientData.name}
- Age: ${patientData.age}
- Gender: ${patientData.gender}
- Condition: ${patientData.condition}

Current Vital Signs:
- Heart Rate: ${latestVitals.heartRate} bpm (normal range: 60-100 bpm)
- Blood Pressure: ${latestVitals.bloodPressure} mmHg (normal range: 90-140 mmHg)
- Oxygen Saturation: ${latestVitals.oxygenLevel}% (normal range: 95-100%)
- Temperature: ${latestVitals.temperature}°C (normal range: 36.1-37.2°C)

Vital Signs History (last ${vitalSigns.length} readings):
${vitalSigns.map((v, i) => `Reading ${i+1}: HR=${v.heartRate}bpm, BP=${v.bloodPressure}mmHg, O2=${v.oxygenLevel}%, Temp=${v.temperature}°C`).join('\n')}

${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Please provide:
1. A brief assessment of the patient's current state
2. The severity level (normal, warning, or critical)
3. Any recommended actions for healthcare providers
      `;
      
      const response = await groqService.chat([
        { role: 'system', content: 'You are a medical AI assistant with expertise in analyzing patient telemetry data. Provide concise, accurate assessments based on vital signs.' },
        { role: 'user', content: prompt }
      ]);
      
      // Parse the response to extract structured data
      // This is a simple implementation - could be improved with better parsing logic
      const severity = 
        response.toLowerCase().includes('critical') ? 'critical' :
        response.toLowerCase().includes('warning') || 
        response.toLowerCase().includes('concerning') ? 'warning' : 'normal';
      
      // Extract recommendations if they exist
      const recommendationsMatch = response.match(/recommendations?:[\s\S]*?((?=\n\n)|$)/i);
      const recommendationsText = recommendationsMatch ? recommendationsMatch[0] : '';
      const recommendations = recommendationsText
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
        .map(line => line.replace(/^[-\d.• ]+/, '').trim());
      
      return {
        analysis: response,
        severity,
        recommendations: recommendations.length > 0 ? recommendations : undefined,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error in medical data analysis:", error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze medical data. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  },
  
  // Analyze an image using the vision model
  async analyzeImage({ imageBase64, prompt, useVisionModel = true }: ImageAnalysisRequest) {
    try {
      // Ensure we use vision-capable model
      const model = useVisionModel ? "meta-llama/llama-4-scout-17b-16e-instruct" : "llama-3.3-70b-versatile";
      
      let messages;
      // Format messages differently depending on whether we're using a vision model
      if (useVisionModel) {
        // For vision models
        messages = [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt || "What do you see in this medical image? Provide a detailed analysis."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ];
      } else {
        // For non-vision models, we can't send the image
        messages = [
          { 
            role: "user", 
            content: "I'd like to analyze a medical image but I notice you don't support vision. What information would you need to help interpret medical images?"
          }
        ];
      }
      
      // Call the Groq service with the appropriate message format
      const response = await groqService.customChat({
        model,
        messages,
        temperature: 0.5,
        max_tokens: 1024,
        stream: false
      });
      
      // Extract the content from the response
      const content = response.choices?.[0]?.message?.content || "No analysis available";
      
      return {
        analysis: content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error in image analysis:", error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the image. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  }
};
