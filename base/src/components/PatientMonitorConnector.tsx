
import React, { useState, useEffect } from 'react';
import { esp32Service } from '@/services/esp32Service';
import { toast } from '@/hooks/use-toast';
import { loadSettings } from '@/utils/localStorage';

interface TelemetryData {
  heartRate: number;
  bloodPressure: number;
  temperature: number;
  oxygenSaturation: number;
  timestamp: Date;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  diagnosis: string;
  admissionDate: string;
  blockchainStatus: 'verified' | 'pending' | 'error';
  doctor: string;
}

interface PatientMonitorConnectorProps {
  patients: Patient[];
  onTelemetryData: (patientId: string, data: TelemetryData) => void;
}

const PatientMonitorConnector: React.FC<PatientMonitorConnectorProps> = ({ 
  patients,
  onTelemetryData
}) => {
  const [isSimulating, setIsSimulating] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [devices, setDevices] = useState<{id: string, name: string, status: string, type: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  // Load settings and set simulation mode
  useEffect(() => {
    const settings = loadSettings();
    const simulationMode = settings.telemetryMode === 'test';
    setIsSimulating(simulationMode);
    esp32Service.setSimulationMode(simulationMode);
    
    // Set ESP32 service options
    esp32Service.setOptions({
      localNetworkIp: settings.localNetworkIp,
      localNetworkPort: settings.localNetworkPort,
      pollingRate: settings.telemetryInterval
    });
    
    // Initial device scan
    scanDevices();
    
    return () => {
      // Clean up by stopping telemetry
      esp32Service.stopTelemetryPolling();
    };
  }, []);
  
  // Handle telemetry data updates
  const handleTelemetryData = (data: TelemetryData) => {
    if (selectedPatient) {
      onTelemetryData(selectedPatient, data);
    }
  };
  
  // Toggle simulation mode
  const toggleSimulation = () => {
    const newMode = !isSimulating;
    setIsSimulating(newMode);
    esp32Service.setSimulationMode(newMode);
    
    // Update settings
    const settings = loadSettings();
    settings.telemetryMode = newMode ? 'test' : 'real';
    
    if (newMode) {
      toast({
        title: "Simulation Mode Enabled",
        description: "Using simulated telemetry data for testing",
      });
    } else {
      toast({
        title: "Real Mode Enabled",
        description: "Connecting to physical ESP32 devices for telemetry",
      });
      
      // Scan for real devices when switching to real mode
      scanDevices();
    }
  };
  
  // Scan for available devices
  const scanDevices = async () => {
    setIsScanning(true);
    
    try {
      const foundDevices = await esp32Service.scanNetwork();
      setDevices(foundDevices);
      
      if (foundDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(foundDevices[0].id);
      }
    } catch (error) {
      console.error("Error scanning for devices:", error);
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description: "Failed to scan for devices. Please check network settings.",
      });
    } finally {
      setIsScanning(false);
    }
  };
  
  // Connect to a selected device
  const connectDevice = async () => {
    if (!selectedDevice || !selectedPatient) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Please select both a device and a patient",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await esp32Service.connectToDevice(selectedDevice);
      
      if (success) {
        // Start polling telemetry data
        esp32Service.startTelemetryPolling(selectedDevice, handleTelemetryData);
        
        toast({
          title: "Connection Successful",
          description: "Now receiving telemetry data for the selected patient",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: "Could not connect to the selected device",
        });
      }
    } catch (error) {
      console.error("Error connecting to device:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "An error occurred while connecting to the device",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Disconnect from the current device
  const disconnectDevice = () => {
    esp32Service.stopTelemetryPolling();
    
    toast({
      title: "Disconnected",
      description: "Telemetry monitoring has been stopped",
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${isSimulating ? 'bg-amber-500' : 'bg-green-500'}`}></div>
          <span className="text-sm font-medium">
            {isSimulating ? 'Simulation Mode' : 'Real Device Mode'}
          </span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={toggleSimulation}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            {isSimulating ? 'Switch to Real Mode' : 'Switch to Simulation'}
          </button>
          
          <button
            onClick={scanDevices}
            disabled={isScanning}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isScanning ? 'Scanning...' : 'Scan Devices'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Device selection */}
        <div>
          <label className="block text-sm font-medium mb-1">Select Device</label>
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="w-full px-3 py-2 bg-background border rounded-md"
            disabled={isLoading}
          >
            <option value="">-- Select a Device --</option>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name} ({device.status})
              </option>
            ))}
          </select>
        </div>
        
        {/* Patient selection */}
        <div>
          <label className="block text-sm font-medium mb-1">Select Patient</label>
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="w-full px-3 py-2 bg-background border rounded-md"
            disabled={isLoading}
          >
            <option value="">-- Select a Patient --</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name} ({patient.id})
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={disconnectDevice}
          className="px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
          disabled={isLoading}
        >
          Disconnect
        </button>
        
        <button
          onClick={connectDevice}
          className="px-4 py-2 text-sm font-medium rounded-md bg-pink-600 text-white hover:bg-pink-700"
          disabled={isLoading || !selectedDevice || !selectedPatient}
        >
          {isLoading ? 'Connecting...' : 'Connect'}
        </button>
      </div>
    </div>
  );
};

export default PatientMonitorConnector;
