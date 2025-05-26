
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cpu, Brain, Bot, VolumeIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AppSettings, loadSettings } from '@/utils/localStorage';

interface AISettingsProps {
  settings: AppSettings;
  onChange: (key: keyof AppSettings, value: any) => void;
  className?: string;
}

const AISettings = ({ settings, onChange, className }: AISettingsProps) => {
  const [showApiKey, setShowApiKey] = useState(false);
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <span>AI Configuration</span>
          <Badge variant="default" className="ml-2">
            Powered by Groq
          </Badge>
        </CardTitle>
        <CardDescription>
          Configure AI models and analysis for patient monitoring
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vision Model Selection */}
        <div className="space-y-2">
          <Label htmlFor="aiModel">Vision Model</Label>
          <Select 
            value={settings.aiModel || "llama-3.2-90b-vision-preview"} 
            onValueChange={(value) => onChange('aiModel', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select AI Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="llama-3.2-90b-vision-preview">Llama 3.2 90B Vision (Preview)</SelectItem>
              <SelectItem value="llama-3.2-11b-vision-preview">Llama 3.2 11B Vision (Preview)</SelectItem>
              <SelectItem value="qwen-2.5-32b">Qwen 2.5 32B</SelectItem>
              <SelectItem value="mistral-saba-24b">Mistral Saba 24B</SelectItem>
              <SelectItem value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Models with "Vision" support image analysis
          </p>
        </div>

        {/* Groq API Key */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="groqApiKey">Groq API Key</Label>
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="text-xs text-primary hover:underline"
            >
              {showApiKey ? "Hide" : "Show"}
            </button>
          </div>
          <Input
            id="groqApiKey"
            type={showApiKey ? "text" : "password"}
            value={settings.groqApiKey || ""}
            onChange={(e) => onChange('groqApiKey', e.target.value)}
            placeholder="Enter your Groq API key"
          />
          <p className="text-xs text-muted-foreground">
            Get your API key from the <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">Groq Console</a>
          </p>
        </div>

        {/* AI Analysis Interval */}
        <div className="space-y-2">
          <Label htmlFor="aiAnalysisInterval">
            AI Analysis Interval (minutes)
          </Label>
          <div className="flex items-center space-x-4">
            <Slider
              id="aiAnalysisInterval"
              min={1}
              max={30}
              step={1}
              value={[settings.aiAnalysisInterval || 5]}
              onValueChange={(values) => onChange('aiAnalysisInterval', values[0])}
              className="flex-1"
            />
            <span className="w-12 text-center font-medium">
              {settings.aiAnalysisInterval || 5}m
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            How often AI should analyze patient data
          </p>
        </div>

        {/* Enable AI */}
        <div className="flex items-center justify-between space-y-0 pt-2">
          <div className="space-y-0.5">
            <Label htmlFor="aiEnabled">Enable AI Analysis</Label>
            <p className="text-xs text-muted-foreground">
              Automatically analyze patient data with AI
            </p>
          </div>
          <Switch
            id="aiEnabled"
            checked={settings.aiEnabled !== false}
            onCheckedChange={(checked) => onChange('aiEnabled', checked)}
          />
        </div>

        {/* AI Models Info */}
        <div className="bg-muted p-3 rounded-lg text-sm">
          <h4 className="font-medium flex items-center gap-2 mb-2">
            <Cpu className="h-4 w-4" /> Available AI Features
          </h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <Bot className="h-3 w-3 text-primary" />
              <span>Vital signs anomaly detection</span>
            </li>
            <li className="flex items-center gap-2">
              <Bot className="h-3 w-3 text-primary" />
              <span>Medical image analysis (X-rays, CT scans)</span>
            </li>
            <li className="flex items-center gap-2">
              <Bot className="h-3 w-3 text-primary" />
              <span>Patient condition trend analysis</span>
            </li>
            <li className="flex items-center gap-2">
              <Bot className="h-3 w-3 text-primary" />
              <span>Treatment recommendation assistance</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AISettings;
