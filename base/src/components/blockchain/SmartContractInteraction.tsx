
import { useState } from 'react';
import { ethers } from 'ethers';
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Database, Shield, Upload, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Patient } from '@/utils/localStorage';

interface SmartContractInteractionProps {
  provider: ethers.providers.Web3Provider | null;
  account: string | null;
  contractAddress: string;
  patient: Patient | null;
  className?: string;
}

// ABI for the medical records smart contract
const medicalRecordABI = [
  "function addRecord(string _patientId, string _name, uint256 _age, string _gender, string _diagnosis, string _vitals, string _summary) external",
  "function getRecordCount(string _patientId) external view returns (uint256)",
  "function getRecord(string _patientId, uint256 index) external view returns (string, string, uint256, string, string, string, string, uint256)"
];

const SmartContractInteraction = ({ 
  provider, 
  account, 
  contractAddress, 
  patient,
  className 
}: SmartContractInteractionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recordCount, setRecordCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check record count for the current patient
  const checkRecords = async () => {
    if (!provider || !contractAddress || !patient) {
      toast({
        title: "Cannot Check Records",
        description: "Missing provider, contract address, or patient data",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const contract = new ethers.Contract(
        contractAddress,
        medicalRecordABI,
        provider
      );
      
      const count = await contract.getRecordCount(patient.id);
      setRecordCount(count.toNumber());
      
      toast({
        title: "Records Found",
        description: `Found ${count.toNumber()} records for patient ${patient.name}`,
      });
    } catch (error) {
      console.error("Error checking records:", error);
      toast({
        title: "Record Check Failed",
        description: "Failed to check blockchain records",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add the current patient record to the blockchain
  const addRecordToBlockchain = async () => {
    if (!provider || !contractAddress || !patient) {
      toast({
        title: "Cannot Add Record",
        description: "Missing provider, contract address, or patient data",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get the signer
      const signer = provider.getSigner(account || undefined);
      
      // Create contract instance
      const contract = new ethers.Contract(
        contractAddress,
        medicalRecordABI,
        signer
      );
      
      // Prepare vital signs data
      const vitalSigns = patient.telemetryData ? 
        patient.telemetryData[patient.telemetryData.length - 1] : 
        { heartRate: 0, bloodPressure: 0, oxygenSaturation: 0, temperature: 0 };
      
      const vitalsJson = JSON.stringify(vitalSigns);
      
      // Add record to blockchain
      const tx = await contract.addRecord(
        patient.id,
        patient.name,
        patient.age,
        patient.gender,
        patient.diagnosis || "No diagnosis",
        vitalsJson,
        "Medical record verified by MedXRchain"
      );
      
      // Wait for transaction
      await tx.wait();
      
      toast({
        title: "Record Added to Blockchain",
        description: `Medical record for ${patient.name} added successfully`,
        variant: "default",
      });
      
      // Update record count
      checkRecords();
    } catch (error) {
      console.error("Error adding record to blockchain:", error);
      toast({
        title: "Record Addition Failed",
        description: "Failed to add record to blockchain",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span>Blockchain Integration</span>
        </CardTitle>
        <CardDescription>
          Securely store patient records on the blockchain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!provider || !account ? (
          <div className="p-4 rounded-lg bg-muted flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Connect your MetaMask wallet to interact with the blockchain
            </p>
          </div>
        ) : !patient ? (
          <div className="p-4 rounded-lg bg-muted flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Select a patient to manage their blockchain records
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Patient ID:</span>
                <span className="text-sm">{patient.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Name:</span>
                <span className="text-sm">{patient.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Contract:</span>
                <span className="text-sm text-xs">{`${contractAddress.substring(0, 6)}...${contractAddress.substring(contractAddress.length - 4)}`}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Records on Chain:</span>
                <span className="text-sm">
                  {recordCount !== null ? recordCount : "Unknown"}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={checkRecords}
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
                <span>Check Blockchain Records</span>
              </Button>
              
              <Button
                variant="default"
                className="w-full flex items-center justify-center gap-2"
                onClick={addRecordToBlockchain}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>
                  {isSubmitting 
                    ? "Adding to Blockchain..." 
                    : "Add Record to Blockchain"}
                </span>
              </Button>
            </div>
            
            {patient.blockchainStatus === 'verified' && (
              <div className="flex items-center gap-2 p-2 bg-green-50 text-green-800 rounded-md text-sm">
                <Check className="h-4 w-4" />
                <span>Record verified on blockchain</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartContractInteraction;
