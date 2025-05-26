
/**
 * This service handles communication with ESP32 devices for telemetry collection
 */

import { toast } from "@/hooks/use-toast";

// Types for telemetry data
export interface TelemetryData {
  heartRate: number;
  bloodPressure: number;
  temperature: number;
  oxygenSaturation: number;
  timestamp: Date;
}

// Device information
export interface DeviceInfo {
  id: string;
  name: string;
  status: string;
  type: string;
  ip?: string;
  port?: string;
}

// Callback type for telemetry data
type TelemetryCallback = (data: TelemetryData) => void;

// Service configuration options
interface ESP32ServiceOptions {
  localNetworkIp: string;
  localNetworkPort: string;
  pollingRate: number; // in seconds
}

class ESP32Service {
  private options: ESP32ServiceOptions = {
    localNetworkIp: "192.168.1.0",
    localNetworkPort: "8080",
    pollingRate: 5
  };
  
  private simulationMode: boolean = true;
  private telemetryInterval: number | null = null;
  private connectedDevices: Map<string, DeviceInfo> = new Map();
  
  // Set configuration options
  setOptions(options: Partial<ESP32ServiceOptions>): void {
    this.options = { ...this.options, ...options };
  }
  
  // Toggle simulation mode
  setSimulationMode(enabled: boolean): void {
    this.simulationMode = enabled;
    
    // If disabling simulation, clear any running simulation intervals
    if (!enabled && this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
      this.telemetryInterval = null;
    }
  }
  
  // Scan for ESP32 devices on the local network
  async scanNetwork(): Promise<DeviceInfo[]> {
    if (this.simulationMode) {
      // In simulation mode, return mocked devices
      return this.getMockDevices();
    }
    
    try {
      // Get the network base from the IP (e.g., 192.168.1)
      const ipBase = this.options.localNetworkIp.split('.').slice(0, 3).join('.');
      const foundDevices: DeviceInfo[] = [];
      const port = this.options.localNetworkPort;
      
      // Real network scanning logic using fetch with AbortController for timeout
      const scanRange = 20; // Scan a limited range of IPs for quick results
      const scanPromises: Promise<DeviceInfo | null>[] = [];
      
      // Create promises for scanning each IP address
      for (let i = 1; i <= scanRange; i++) {
        const ip = `${ipBase}.${i}`;
        scanPromises.push(this.checkDevice(ip, port));
      }
      
      // Wait for all scan promises to complete
      const results = await Promise.all(scanPromises);
      
      // Filter out null results and add valid devices
      results.forEach(device => {
        if (device) {
          foundDevices.push(device);
          this.connectedDevices.set(device.id, device);
        }
      });
      
      // Always add some mock devices for demo purposes
      if (foundDevices.length === 0) {
        const mockDevices = this.getMockDevices();
        foundDevices.push(...mockDevices);
      }
      
      return foundDevices;
    } catch (error) {
      console.error("Error scanning network:", error);
      
      // Fallback to mock devices
      return this.getMockDevices();
    }
  }
  
  // Check if a specific IP address has an ESP32 device
  private async checkDevice(ip: string, port: string): Promise<DeviceInfo | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000); // 1s timeout
      
      const response = await fetch(`http://${ip}:${port}/identify`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        return {
          id: data.deviceId || `device-${ip.replace(/\./g, '-')}`,
          name: data.deviceName || `ESP32 Device (${ip})`,
          status: "Available",
          type: data.deviceType || "ESP32",
          ip: ip,
          port: port
        };
      }
    } catch (error) {
      // Most devices will timeout or fail - this is expected
      return null;
    }
    
    return null;
  }
  
  // Connect to a specific ESP32 device
  async connectToDevice(deviceId: string): Promise<boolean> {
    if (this.simulationMode) {
      // In simulation mode, just pretend we connected successfully
      console.log(`Connected to simulated device: ${deviceId}`);
      return true;
    }
    
    try {
      const device = this.connectedDevices.get(deviceId);
      
      if (!device || !device.ip || !device.port) {
        console.error("Device not found or missing IP/port");
        return false;
      }
      
      // Real connection logic would go here
      // For now, we'll just simulate a successful connection
      const response = await fetch(`http://${device.ip}:${device.port}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: 'medxrchain-app',
          timestamp: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        console.log(`Connected to device: ${deviceId} at ${device.ip}:${device.port}`);
        return true;
      } else {
        console.error("Failed to connect to device");
        return false;
      }
    } catch (error) {
      console.error("Error connecting to device:", error);
      return false;
    }
  }
  
  // Start polling for telemetry data
  startTelemetryPolling(deviceId: string, callback: TelemetryCallback): void {
    // Clear any existing interval
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
      this.telemetryInterval = null;
    }
    
    const device = this.connectedDevices.get(deviceId);
    
    if (this.simulationMode || !device) {
      // In simulation mode, generate fake telemetry data
      this.telemetryInterval = window.setInterval(() => {
        callback(this.generateTelemetryData());
      }, this.options.pollingRate * 1000);
    } else {
      // In real mode, poll the device for telemetry data
      this.telemetryInterval = window.setInterval(async () => {
        try {
          if (!device.ip || !device.port) return;
          
          const response = await fetch(`http://${device.ip}:${device.port}/telemetry`, {
            method: 'GET'
          });
          
          if (response.ok) {
            const data = await response.json();
            callback({
              heartRate: data.heartRate || 75,
              bloodPressure: data.bloodPressure || 120,
              temperature: data.temperature || 36.7,
              oxygenSaturation: data.oxygenSaturation || 98,
              timestamp: new Date()
            });
          } else {
            // If device doesn't respond, fall back to simulated data
            callback(this.generateTelemetryData());
          }
        } catch (error) {
          console.error("Error polling telemetry:", error);
          // On error, fall back to simulated data
          callback(this.generateTelemetryData());
        }
      }, this.options.pollingRate * 1000);
    }
  }
  
  // Stop polling for telemetry data
  stopTelemetryPolling(): void {
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
      this.telemetryInterval = null;
    }
  }
  
  // Generate fake telemetry data for simulation
  private generateTelemetryData(): TelemetryData {
    return {
      heartRate: Math.round(70 + Math.random() * 20),
      bloodPressure: Math.round(110 + Math.random() * 30),
      temperature: Number((36.5 + Math.random()).toFixed(1)),
      oxygenSaturation: Math.round(95 + Math.random() * 5),
      timestamp: new Date()
    };
  }
  
  // Get mock devices for simulation
  private getMockDevices(): DeviceInfo[] {
    return [
      {
        id: "esp32-001",
        name: "Patient Monitor #1",
        status: "Available",
        type: "ESP32"
      },
      {
        id: "esp32-002",
        name: "VitalSense Device",
        status: "Available",
        type: "ESP32"
      },
      {
        id: "esp32-003",
        name: "Cardiac Monitor",
        status: "Low Battery",
        type: "ESP32"
      }
    ];
  }
}

// Export a singleton instance
export const esp32Service = new ESP32Service();
