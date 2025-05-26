
import { useState, useEffect } from 'react';
import { usePatientRecords, PatientRecord } from './usePatientRecords';
import { toast } from '@/hooks/use-toast';

export interface VitalReading {
  heartRate: number;
  bloodPressure: number;
  oxygenLevel: number;
  temperature: number;
  respirationRate: number;
  timestamp: string;
}

export const useTelemetryPatient = (patientId: string | null) => {
  const { patientRecords, updateVitalSigns, getPatientById } = usePatientRecords();
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [vitalHistory, setVitalHistory] = useState<VitalReading[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [telemetryInterval, setTelemetryInterval] = useState<number | null>(null);
  
  // Update selected patient when patientId changes
  useEffect(() => {
    if (!patientId) {
      setSelectedPatient(null);
      return;
    }
    
    const patient = getPatientById(patientId);
    setSelectedPatient(patient);
    
    // Initialize vital history if patient has vital signs
    if (patient?.vitalSigns) {
      setVitalHistory([patient.vitalSigns as VitalReading]);
    } else {
      setVitalHistory([]);
    }
  }, [patientId, patientRecords, getPatientById]);

  // Cleanup telemetry interval on unmount
  useEffect(() => {
    return () => {
      if (telemetryInterval) {
        clearInterval(telemetryInterval);
      }
    };
  }, [telemetryInterval]);

  // Record a new vital signs reading
  const recordVitalSigns = (reading: VitalReading) => {
    if (!selectedPatient || !patientId) {
      toast({
        title: "No Patient Selected",
        description: "Please select a patient before recording vital signs",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      // Add timestamp if not provided
      const readingWithTimestamp = {
        ...reading,
        timestamp: reading.timestamp || new Date().toISOString()
      };
      
      // Update patient record
      updateVitalSigns(patientId, readingWithTimestamp);
      
      // Update local history
      setVitalHistory(prev => [...prev, readingWithTimestamp]);
      
      return true;
    } catch (error) {
      console.error("Error recording vital signs:", error);
      toast({
        title: "Recording Error",
        description: "Failed to record vital signs",
        variant: "destructive"
      });
      return false;
    }
  };

  // Connect to telemetry device for this patient
  const connectTelemetry = (deviceId: string) => {
    if (!selectedPatient) {
      toast({
        title: "No Patient Selected",
        description: "Please select a patient before connecting a device",
        variant: "destructive"
      });
      return false;
    }
    
    // In a real implementation, this would connect to the actual device
    setIsConnected(true);
    
    // Start regular telemetry updates at 1 second intervals
    const intervalId = window.setInterval(() => {
      const newReading: VitalReading = {
        heartRate: Math.floor(Math.random() * 20) + 60, // 60-80
        bloodPressure: Math.floor(Math.random() * 30) + 110, // 110-140
        oxygenLevel: Math.floor(Math.random() * 5) + 95, // 95-100
        temperature: Math.floor((36.5 + Math.random()) * 10) / 10, // 36.5-37.5
        respirationRate: Math.floor(Math.random() * 10) + 12, // 12-22
        timestamp: new Date().toISOString()
      };
      
      recordVitalSigns(newReading);
    }, 1000); // Update every 1 second
    
    setTelemetryInterval(intervalId);
    
    toast({
      title: "Device Connected",
      description: `Connected to device for ${selectedPatient.name}`,
    });
    
    return true;
  };

  // Disconnect from telemetry device
  const disconnectTelemetry = () => {
    setIsConnected(false);
    
    if (telemetryInterval) {
      clearInterval(telemetryInterval);
      setTelemetryInterval(null);
    }
    
    toast({
      title: "Device Disconnected",
      description: "Disconnected from telemetry device",
    });
  };

  return {
    selectedPatient,
    vitalHistory,
    isConnected,
    recordVitalSigns,
    connectTelemetry,
    disconnectTelemetry
  };
};
