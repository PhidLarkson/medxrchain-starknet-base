
import { useState } from 'react';
import { Save, RefreshCw, Server, Shield, BellRing, Cpu, Globe, Tablet, Glasses } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsProps {
  className?: string;
}

const Settings = ({ className }: SettingsProps) => {
  const [aiModel, setAiModel] = useState<string>("llama-3.2-90b-vision-preview");
  const [blockchainNetwork, setBlockchainNetwork] = useState<string>("ethereum");
  const [telemetryInterval, setTelemetryInterval] = useState<number>(5);
  const [alertThreshold, setAlertThreshold] = useState<number>(75);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  const handleSave = () => {
    setIsSaving(true);
    
    // Simulate saving
    setTimeout(() => {
      setIsSaving(false);
    }, 1500);
  };
  
  const SettingSection = ({ 
    title, 
    description, 
    icon, 
    children 
  }: { 
    title: string; 
    description: string; 
    icon: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div className="glassmorphism rounded-xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          {icon}
        </div>
        <div>
          <h3 className="font-medium text-lg">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-4">
        {children}
      </div>
    </div>
  );

  return (
    <div className={cn("w-full animate-fade-in", className)}>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <SettingSection 
            title="AI Configuration" 
            description="Configure the AI assistant and vision model settings"
            icon={<Cpu className="h-5 w-5" />}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Vision Model</label>
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full bg-background border rounded-lg px-3 py-2"
                >
                  <option value="llama-3.2-90b-vision-preview">Llama 3.2 90B Vision (Preview)</option>
                  <option value="llama-3.2-11b-vision-preview">Llama 3.2 11B Vision (Preview)</option>
                  <option value="gpt-4o">GPT-4o</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">API Key</label>
                <input
                  type="password"
                  placeholder="Enter your Groq API key"
                  value="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"
                  className="w-full bg-background border rounded-lg px-3 py-2"
                />
                <p className="mt-1 text-xs text-muted-foreground">Used to securely connect to the AI model API</p>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="aiEnabled"
                  defaultChecked={true}
                  className="mr-2"
                />
                <label htmlFor="aiEnabled" className="text-sm">Enable AI assistance for telemetry monitoring</label>
              </div>
            </div>
          </SettingSection>
          
          <SettingSection
            title="Blockchain Configuration"
            description="Configure blockchain network settings for patient data"
            icon={<Shield className="h-5 w-5" />}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Network</label>
                <select
                  value={blockchainNetwork}
                  onChange={(e) => setBlockchainNetwork(e.target.value)}
                  className="w-full bg-background border rounded-lg px-3 py-2"
                >
                  <option value="ethereum">Ethereum (Production)</option>
                  <option value="polygon">Polygon (Recommended)</option>
                  <option value="goerli">Goerli (Testing)</option>
                  <option value="local">Local Network</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Network Endpoint</label>
                <input
                  type="text"
                  placeholder="https://mainnet.infura.io/v3/your-key"
                  defaultValue="https://polygon-mainnet.infura.io/v3/"
                  className="w-full bg-background border rounded-lg px-3 py-2"
                />
                <p className="mt-1 text-xs text-muted-foreground">Optional, leave empty to use default endpoints</p>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="encryptData"
                  defaultChecked={true}
                  className="mr-2"
                />
                <label htmlFor="encryptData" className="text-sm">Encrypt patient data before storing on blockchain</label>
              </div>
            </div>
          </SettingSection>
        </div>
        
        <div className="flex-1">
          <SettingSection
            title="Telemetry Settings"
            description="Configure patient monitoring and telemetry settings"
            icon={<BellRing className="h-5 w-5" />}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Update Interval (seconds)</label>
                <input
                  type="number"
                  value={telemetryInterval}
                  onChange={(e) => setTelemetryInterval(Number(e.target.value))}
                  min="1"
                  max="60"
                  className="w-full bg-background border rounded-lg px-3 py-2"
                />
                <p className="mt-1 text-xs text-muted-foreground">Frequency of telemetry updates (1-60 seconds)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Alert Threshold (%)</label>
                <input
                  type="range"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(Number(e.target.value))}
                  min="50"
                  max="100"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>50% (Sensitive)</span>
                  <span>Current: {alertThreshold}%</span>
                  <span>100% (Less Sensitive)</span>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="recordTelemetry"
                  defaultChecked={true}
                  className="mr-2"
                />
                <label htmlFor="recordTelemetry" className="text-sm">Record telemetry data on blockchain</label>
              </div>
            </div>
          </SettingSection>
          
          <SettingSection
            title="Network Settings"
            description="Configure local network and device connectivity"
            icon={<Server className="h-5 w-5" />}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Local Network</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="192.168.1.0"
                    defaultValue="192.168.1.0"
                    className="flex-1 bg-background border rounded-lg px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Port"
                    defaultValue="8080"
                    className="w-24 bg-background border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              
              <div>
                <button className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors">
                  <RefreshCw className="h-4 w-4" />
                  <span>Scan for Devices</span>
                </button>
                
                <div className="mt-3 border rounded-lg divide-y">
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <Tablet className="h-4 w-4 text-medical-blue" />
                      <span>Patient Monitor #1</span>
                    </div>
                    <span className="text-health-normal text-sm">Connected</span>
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <Tablet className="h-4 w-4 text-medical-green" />
                      <span>VitalSense Device</span>
                    </div>
                    <span className="text-health-normal text-sm">Connected</span>
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <Tablet className="h-4 w-4 text-medical-gray" />
                      <span>Cardiac Monitor</span>
                    </div>
                    <span className="text-health-warning text-sm">Not Connected</span>
                  </div>
                </div>
              </div>
            </div>
          </SettingSection>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-6">
        <button className="glassmorphism px-4 py-2 rounded-xl hover:shadow-md transition-all">
          Reset to Defaults
        </button>
        <button 
          className={cn(
            "bg-primary text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-colors",
            isSaving && "opacity-80"
          )}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{isSaving ? "Saving..." : "Save Changes"}</span>
        </button>
      </div>
    </div>
  );
};

export default Settings;
