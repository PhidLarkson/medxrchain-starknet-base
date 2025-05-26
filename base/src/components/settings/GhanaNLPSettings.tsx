
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, VolumeIcon, MessageCircle, Languages } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AppSettings } from '@/utils/localStorage';
import { LanguageCodes } from '@/services/ghanaNlpService';

interface GhanaNLPSettingsProps {
  settings: AppSettings;
  onChange: (key: keyof AppSettings, value: any) => void;
  className?: string;
}

const GhanaNLPSettings = ({ settings, onChange, className }: GhanaNLPSettingsProps) => {
  const [showApiKey, setShowApiKey] = useState(false);
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <span>Ghana NLP Configuration</span>
          <Badge variant="secondary" className="ml-2">
            Local Languages
          </Badge>
        </CardTitle>
        <CardDescription>
          Configure text-to-speech and translation in Ghanaian languages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API Key */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="ghanaNlpApiKey">Ghana NLP API Key</Label>
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="text-xs text-primary hover:underline"
            >
              {showApiKey ? "Hide" : "Show"}
            </button>
          </div>
          <Input
            id="ghanaNlpApiKey"
            type={showApiKey ? "text" : "password"}
            value={settings.ghanaNlpApiKey || ""}
            onChange={(e) => onChange('ghanaNlpApiKey', e.target.value)}
            placeholder="Enter your Ghana NLP API key"
          />
          <p className="text-xs text-muted-foreground">
            Required for translation and text-to-speech in Ghanaian languages
          </p>
        </div>

        {/* Default Language */}
        <div className="space-y-2">
          <Label htmlFor="defaultLanguage">Default Language</Label>
          <Select 
            value={settings.defaultLanguage || LanguageCodes.Twi} 
            onValueChange={(value) => onChange('defaultLanguage', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Default Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={LanguageCodes.Twi}>Twi</SelectItem>
              <SelectItem value={LanguageCodes.Ga}>Ga</SelectItem>
              <SelectItem value={LanguageCodes.Ewe}>Ewe</SelectItem>
              <SelectItem value={LanguageCodes.Dagbani}>Dagbani</SelectItem>
              <SelectItem value={LanguageCodes.Hausa}>Hausa</SelectItem>
              <SelectItem value={LanguageCodes.English}>English</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Default language for translations and voice synthesis
          </p>
        </div>

        {/* Text-to-Speech */}
        <div className="flex items-center justify-between space-y-0 pt-2">
          <div className="space-y-0.5">
            <Label htmlFor="enableTTS">Enable Text-to-Speech</Label>
            <p className="text-xs text-muted-foreground">
              Generate audio for AI responses in local languages
            </p>
          </div>
          <Switch
            id="enableTTS"
            checked={settings.enableTTS !== false}
            onCheckedChange={(checked) => onChange('enableTTS', checked)}
          />
        </div>

        {/* Auto Translation */}
        <div className="flex items-center justify-between space-y-0 pt-2">
          <div className="space-y-0.5">
            <Label htmlFor="enableAutoTranslation">Enable Auto Translation</Label>
            <p className="text-xs text-muted-foreground">
              Automatically translate medical terms to local languages
            </p>
          </div>
          <Switch
            id="enableAutoTranslation"
            checked={settings.enableAutoTranslation !== false}
            onCheckedChange={(checked) => onChange('enableAutoTranslation', checked)}
          />
        </div>

        {/* Languages Info */}
        <div className="bg-muted p-3 rounded-lg text-sm">
          <h4 className="font-medium flex items-center gap-2 mb-2">
            <Languages className="h-4 w-4" /> Supported Languages
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-xs">Twi (Akan)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-xs">Ga</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-xs">Ewe</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-xs">Dagbani</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-xs">Hausa</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-xs">English</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GhanaNLPSettings;
