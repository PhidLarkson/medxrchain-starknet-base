
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActivityIcon, Server, Wifi, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AppSettings } from '@/utils/localStorage';

interface TelemetrySettingsProps {
  settings: AppSettings;
  onChange: (key: keyof AppSettings, value: any) => void;
  className?: string;
}

const TelemetrySettings = ({ settings, onChange, className }: TelemetrySettingsProps) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ActivityIcon className="h-5 w-5 text-primary" />
          <span>Telemetry Configuration</span>
        </CardTitle>
        <CardDescription>
          Configure patient monitoring and telemetry settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Telemetry Mode */}
        <div className="space-y-2">
          <Label>Telemetry Mode</Label>
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="telemetryModeTest"
                checked={settings.telemetryMode === 'test' || !settings.telemetryMode}
                onChange={() => onChange('telemetryMode', 'test')}
                className="h-4 w-4"
              />
              <Label htmlFor="telemetryModeTest" className="font-normal">
                Test Data
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="telemetryModeReal"
                checked={settings.telemetryMode === 'real'}
                onChange={() => onChange('telemetryMode', 'real')}
                className="h-4 w-4"
              />
              <Label htmlFor="telemetryModeReal" className="font-normal">
                Real Devices
              </Label>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Test mode uses simulated data, Real mode connects to actual devices
          </p>
        </div>
        
        {/* Telemetry Interval */}
        <div className="space-y-2">
          <Label htmlFor="telemetryInterval">Update Interval (seconds)</Label>
          <div className="flex items-center space-x-4">
            <Slider
              id="telemetryInterval"
              min={1}
              max={30}
              step={1}
              value={[settings.telemetryInterval || 1]}
              onValueChange={(values) => onChange('telemetryInterval', values[0])}
              className="flex-1"
            />
            <span className="w-12 text-center font-medium">
              {settings.telemetryInterval || 1}s
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            How often to update telemetry data (1 second recommended for real-time monitoring)
          </p>
        </div>
        
        {/* Alert Threshold */}
        <div className="space-y-2">
          <Label htmlFor="alertThreshold">Alert Threshold (%)</Label>
          <div className="flex items-center space-x-4">
            <Slider
              id="alertThreshold"
              min={50}
              max={100}
              value={[settings.alertThreshold || 75]}
              onValueChange={(values) => onChange('alertThreshold', values[0])}
              className="flex-1"
            />
            <span className="w-12 text-center font-medium">
              {settings.alertThreshold || 75}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Threshold for triggering alerts (higher = less sensitive)
          </p>
        </div>
        
        {/* Network Settings */}
        <div className="space-y-2">
          <Label>Network Settings</Label>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Input
                placeholder="Local Network IP"
                value={settings.localNetworkIp || "192.168.1.0"}
                onChange={(e) => onChange('localNetworkIp', e.target.value)}
              />
            </div>
            <div>
              <Input
                placeholder="Port"
                value={settings.localNetworkPort || "8080"}
                onChange={(e) => onChange('localNetworkPort', e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Local network settings for device discovery
          </p>
        </div>
        
        {/* Data Format Information */}
        <div className="bg-muted p-3 rounded-lg space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Server className="h-4 w-4" /> Telemetry Data Format
          </h4>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Device sends data in JSON format:</p>
            <pre className="bg-background p-2 rounded overflow-x-auto text-xs">
{`{
  "heartRate": 75,          // BPM (40-180)
  "bloodPressure": 120,     // Systolic (80-200)
  "temperature": 36.8,      // Celsius (35-42)
  "oxygenSaturation": 98,   // Percent (80-100)
  "timestamp": "ISO string" // UTC timestamp
}`}
            </pre>
          </div>
          
          <div className="text-xs flex items-center gap-2">
            <AlertCircle className="h-3 w-3 text-primary" />
            <span>Ensure devices are configured with the correct data format</span>
          </div>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center justify-between bg-background p-3 rounded-lg border">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Network Status</span>
          </div>
          <Badge 
            variant={settings.telemetryMode === 'real' ? "success" : "secondary"}
          >
            {settings.telemetryMode === 'real' ? "Connected" : "Simulation Mode"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default TelemetrySettings;
