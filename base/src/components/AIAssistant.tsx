
import { useState, useRef, useEffect } from 'react';
import { User, Bot, Send, Image, Trash, UploadCloud, Loader2, VolumeIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import ThreeDViewer, { OrganType } from './ThreeDViewer';
import { groqService, GROQ_MODELS, GroqMessage } from '@/services/groqService';
import { ghanaNlpService, LanguageCodes } from '@/services/ghanaNlpService';
import { toast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loadSettings } from '@/utils/localStorage';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  images?: string[];
}

interface AIAssistantProps {
  className?: string;
}

const AIAssistant = ({ className }: AIAssistantProps) => {
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello doctor, I'm your AI medical assistant. How can I help you with your research or patient care today?",
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showViewer, setShowViewer] = useState<boolean>(false);
  const [currentOrgan, setCurrentOrgan] = useState<OrganType>('heart');
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCodes>(LanguageCodes.Twi);
  const [selectedModel, setSelectedModel] = useState<string>(GROQ_MODELS.CHAT);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load settings on component mount
  useEffect(() => {
    const settings = loadSettings();
    setSelectedModel(settings.aiModel || GROQ_MODELS.CHAT);
    
    // Set default language from settings if available
    if (settings.defaultLanguage) {
      setSelectedLanguage(settings.defaultLanguage as LanguageCodes);
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => {
        setAudioPlaying(null);
      };
    }
  }, [audioRef.current]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Create conversation history for the AI with proper typing
      const conversationHistory: GroqMessage[] = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Add the new user message
      conversationHistory.push({
        role: 'user',
        content: input
      });

      // Add system message at the beginning
      conversationHistory.unshift({
        role: 'system',
        content: "You are a medical AI assistant helping doctors with research and patient care. You are knowledgeable about medical terminology, procedures, and research. Always be precise and cite medical references when possible. Focus on providing actionable insights. If asked about scans or images, discuss how they might be viewed in 3D or AR for better diagnosis."
      });

      // Get response from Groq API
      const response = await groqService.chat(conversationHistory, {
        model: selectedModel
      });

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast({
        title: "AI Response Error",
        description: "Failed to get a response from the AI. Please check your API key in settings.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check file size (max 4MB for base64 encoding per Groq docs)
    if (file.size > 4 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image must be less than 4MB for vision analysis",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create a URL for the image preview
      const imageUrl = URL.createObjectURL(file);
      
      // Read the file as base64
      const base64Image = await fileToBase64(file);
      
      // Send the image to the user's chat
      const userMessage: Message = {
        id: Date.now().toString(),
        content: "I've uploaded an image for analysis.",
        sender: 'user',
        timestamp: new Date(),
        images: [imageUrl]
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Show the 3D viewer
      setShowViewer(true);
      
      // Analyze the image with Groq Vision API using base64
      const analysis = await groqService.chatWithVisionBase64(
        "Analyze this medical image in detail. What does it show? What medical conditions might it indicate? How would this appear in 3D?",
        base64Image,
        { model: selectedModel.includes('vision') ? selectedModel : GROQ_MODELS.VISION }
      );
      
      // Add the AI response
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: analysis,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Image Processing Error",
        description: "Failed to process the image. Please check your API key in settings.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      // Clear the input so the same file can be selected again
      e.target.value = '';
    }
  };

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // The result includes the data URI prefix (e.g., "data:image/jpeg;base64,")
          // which is what we want for the Groq API
          resolve(reader.result);
        } else {
          reject(new Error("Could not convert file to base64"));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        content: "Hello doctor, I'm your AI medical assistant. How can I help you with your research or patient care today?",
        sender: 'ai',
        timestamp: new Date(),
      }
    ]);
    setShowViewer(false);
  };
  
  const generateAudioSummary = async (messageId: string) => {
    // Find the message content
    const message = messages.find(msg => msg.id === messageId);
    if (!message) return;
    
    try {
      setAudioPlaying(messageId);
      
      // First translate the message to the selected language
      const translation = await ghanaNlpService.translate({
        in: message.content,
        fromLanguage: LanguageCodes.English,
        toLanguage: selectedLanguage
      });
      
      // Then convert the translated text to speech
      const audioBuffer = await ghanaNlpService.textToSpeech({
        text: translation.translatedText,
        language: selectedLanguage
      });
      
      // Create a blob URL for the audio
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      
      // Play the audio
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }
      
      toast({
        title: "Audio Summary",
        description: `Playing summary in ${selectedLanguage}`,
      });
    } catch (error) {
      console.error("Error generating audio summary:", error);
      setAudioPlaying(null);
      toast({
        title: "Audio Generation Error",
        description: "Failed to generate audio. Please check your API key in settings.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className={cn("flex flex-col h-[calc(100vh-12rem)] animate-fade-in", className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">MedXRchain AI Assistant</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Using model:</span>
            <Select 
              value={selectedModel} 
              onValueChange={setSelectedModel}
            >
              <SelectTrigger className="h-7 text-xs w-[260px]">
                <SelectValue placeholder="Select AI Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={GROQ_MODELS.CHAT}>Llama 3.3 70B (Chat)</SelectItem>
                <SelectItem value={GROQ_MODELS.VISION}>Llama 3.2 90B (Vision)</SelectItem>
                <SelectItem value="llama-3.2-11b-vision-preview">Llama 3.2 11B (Vision)</SelectItem>
                <SelectItem value="qwen-2.5-32b">Qwen 2.5 32B</SelectItem>
                <SelectItem value="mistral-saba-24b">Mistral Saba 24B</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Select 
          value={selectedLanguage} 
          onValueChange={(value) => setSelectedLanguage(value as LanguageCodes)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Audio Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={LanguageCodes.Twi}>Twi</SelectItem>
            <SelectItem value={LanguageCodes.Ga}>Ga</SelectItem>
            <SelectItem value={LanguageCodes.Ewe}>Ewe</SelectItem>
            <SelectItem value={LanguageCodes.English}>English</SelectItem>
            <SelectItem value={LanguageCodes.Dagbani}>Dagbani</SelectItem>
            <SelectItem value={LanguageCodes.Hausa}>Hausa</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex-1 overflow-y-auto px-2 py-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex w-full max-w-3xl mx-auto",
                message.sender === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "flex items-start gap-3 rounded-xl px-4 py-3 max-w-[80%]",
                  message.sender === 'user'
                    ? "bg-pink-600 text-primary-foreground"
                    : "glassmorphism"
                )}
              >
                <div className="flex-shrink-0 mt-1">
                  {message.sender === 'user' ? (
                    <User className="h-5 w-5" />
                  ) : (
                    <Bot className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.images && message.images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt="Uploaded"
                          className="max-w-full h-auto max-h-64 object-contain rounded-md"
                        />
                      ))}
                    </div>
                  )}
                  <div className="mt-1 text-xs opacity-70 flex items-center justify-between">
                    <span>{message.timestamp.toLocaleTimeString()}</span>
                    {message.sender === 'ai' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => generateAudioSummary(message.id)}
                        disabled={audioPlaying !== null}
                      >
                        {audioPlaying === message.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <VolumeIcon className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex w-full max-w-3xl mx-auto justify-start">
              <div className="glassmorphism rounded-xl px-4 py-3 flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {showViewer && (
        <div className="mb-4 animate-slide-up">
          <ThreeDViewer initialOrgan={currentOrgan} enableXR={true} />
          <div className="flex justify-between items-center mt-2 text-sm">
            <p className="text-muted-foreground">3D Medical Scan Rendering</p>
            <Button 
              variant="link"
              size="sm"
              onClick={() => setShowViewer(false)}
              className="text-pink-600"
            >
              Hide Viewer
            </Button>
          </div>
        </div>
      )}
      
      <div className="glassmorphism rounded-xl p-2 mt-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-pink-600 hover:bg-muted"
            onClick={handleImageUpload}
            title="Upload image"
          >
            <Image className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-pink-600 hover:bg-muted"
            onClick={() => setShowViewer(!showViewer)}
            title="Toggle 3D Viewer"
          >
            <UploadCloud className="h-5 w-5" />
          </Button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
            placeholder="Ask the AI assistant..."
            className="flex-1 bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground"
            disabled={isLoading}
          />
          
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive hover:bg-muted"
            onClick={clearChat}
            title="Clear chat"
            disabled={isLoading}
          >
            <Trash className="h-5 w-5" />
          </Button>
          
          <Button
            variant="default"
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              "text-white bg-pink-600 hover:bg-pink-700",
              (!input.trim() || isLoading) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default AIAssistant;
