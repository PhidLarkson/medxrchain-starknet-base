
import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { loadPatientData, savePatientData, Patient, TelemetryEntry } from '@/utils/localStorage';

// Export types with correct syntax for isolated modules
export type { Patient };
export type { TelemetryEntry };

export interface PatientRecord extends Patient {
  vitalSigns?: VitalReading;
  diagnosis: string; // Make diagnosis required to match Patient interface
}

export interface VitalReading {
  heartRate: number;
  bloodPressure: number;
  oxygenLevel: number;
  temperature: number;
  respirationRate: number;
  timestamp: string;
}

export const usePatientRecords = () => {
  const [patientRecords, setPatientRecords] = useState<PatientRecord[]>([]);
  
  // Load patient records on mount
  useEffect(() => {
    const records = loadPatientData();
    
    // Convert any string timestamps to proper format
    const formattedRecords = records.map(patient => {
      return {
        ...patient,
        // Add any additional conversions needed between localStorage and component
      } as PatientRecord;
    });
    
    setPatientRecords(formattedRecords);
  }, []);
  
  // Get a patient by ID
  const getPatientById = useCallback((id: string) => {
    return patientRecords.find(patient => patient.id === id) || null;
  }, [patientRecords]);
  
  // Add a new patient
  const addPatient = (patient: Omit<PatientRecord, 'blockchainStatus'> & { blockchainStatus?: 'pending' | 'verified' | 'error' }) => {
    try {
      const newPatient: PatientRecord = {
        ...patient,
        diagnosis: patient.diagnosis || '',
        blockchainStatus: patient.blockchainStatus || 'pending'
      };
      
      setPatientRecords(prev => {
        const updated = [...prev, newPatient];
        
        // Convert any complex types before saving to localStorage
        const recordsForStorage = updated.map(record => ({
          ...record,
          // Convert any non-serializable data
        }));
        
        savePatientData(recordsForStorage as Patient[]);
        return updated;
      });
      
      toast({
        title: "Patient Added",
        description: `${patient.name} has been added to records`,
      });
      
      return true;
    } catch (error) {
      console.error("Error adding patient:", error);
      
      toast({
        title: "Error",
        description: "Failed to add patient record",
        variant: "destructive"
      });
      
      return false;
    }
  };
  
  // Update a patient's vital signs
  const updateVitalSigns = (patientId: string, vitalSigns: VitalReading) => {
    try {
      setPatientRecords(prev => {
        const updated = prev.map(patient => 
          patient.id === patientId 
            ? { ...patient, vitalSigns } 
            : patient
        );
        
        // Convert data for localStorage
        const recordsForStorage = updated.map(record => ({
          ...record,
          // Handle non-serializable data
        }));
        
        savePatientData(recordsForStorage as Patient[]);
        return updated;
      });
      
      return true;
    } catch (error) {
      console.error("Error updating vital signs:", error);
      return false;
    }
  };
  
  // Update a patient record
  const updatePatient = (patientId: string, updates: Partial<PatientRecord>) => {
    try {
      setPatientRecords(prev => {
        const updated = prev.map(patient => 
          patient.id === patientId 
            ? { ...patient, ...updates } 
            : patient
        );
        
        // Convert data for localStorage
        const recordsForStorage = updated.map(record => ({
          ...record,
          // Handle non-serializable data
        }));
        
        savePatientData(recordsForStorage as Patient[]);
        return updated;
      });
      
      toast({
        title: "Patient Updated",
        description: "Patient record has been updated",
      });
      
      return true;
    } catch (error) {
      console.error("Error updating patient:", error);
      
      toast({
        title: "Error",
        description: "Failed to update patient record",
        variant: "destructive"
      });
      
      return false;
    }
  };
  
  // Delete a patient
  const deletePatient = (patientId: string) => {
    try {
      setPatientRecords(prev => {
        const updated = prev.filter(patient => patient.id !== patientId);
        savePatientData(updated as Patient[]);
        return updated;
      });
      
      toast({
        title: "Patient Removed",
        description: "Patient has been removed from records",
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting patient:", error);
      
      toast({
        title: "Error",
        description: "Failed to delete patient record",
        variant: "destructive"
      });
      
      return false;
    }
  };
  
  return {
    patientRecords,
    getPatientById,
    addPatient,
    updatePatient,
    updateVitalSigns,
    deletePatient
  };
};
