
import { ethers } from 'ethers';
import { toast } from '../hooks/use-toast';
import { encryptData, decryptData } from '../utils/encryption';

const contractABI = [
  "function addRecord(string _patientId, string _name, uint256 _age, string _gender, string _diagnosis, string _vitals, string _audioSummaryHash) external",
  "function getRecordCount(string _patientId) external view returns (uint256)",
  "function getRecord(string _patientId, uint256 index) external view returns (string, string, uint256, string, string, string, string, uint256)"
];

export interface MedicalRecord {
  patientId: string;
  name: string;
  age: number;
  gender: string;
  diagnosis: string;
  vitals: string;
  audioSummaryHash: string;
  timestamp: number;
}

class BlockchainService {
  private provider: ethers.providers.JsonRpcProvider | null = null;
  private contract: ethers.Contract | null = null;
  private contractAddress: string | null = null;
  private networkUrl: string = 'http://localhost:7545';

  constructor() {
    const savedAddress = localStorage.getItem('contract_address');
    const savedNetworkUrl = localStorage.getItem('network_url');
    
    if (savedAddress) {
      this.contractAddress = savedAddress;
    }
    
    if (savedNetworkUrl) {
      this.networkUrl = savedNetworkUrl;
    }
    
    if (this.contractAddress && this.networkUrl) {
      this.initialize(this.networkUrl, this.contractAddress);
    }
  }
  
  setContractAddress(address: string) {
    this.contractAddress = address;
    localStorage.setItem('contract_address', address);
    return this;
  }
  
  setNetworkUrl(url: string) {
    this.networkUrl = url;
    localStorage.setItem('network_url', url);
    return this;
  }
  
  getContractAddress(): string | null {
    return this.contractAddress;
  }

  async initialize(networkUrl: string, contractAddress: string): Promise<boolean> {
    try {
      this.networkUrl = networkUrl;
      this.contractAddress = contractAddress;
      
      // Create provider
      this.provider = new ethers.providers.JsonRpcProvider(networkUrl);
      
      // Create contract interface
      this.contract = new ethers.Contract(
        contractAddress,
        contractABI,
        this.provider.getSigner(0) // Use the first account as default
      );
      
      // Test the connection
      const network = await this.provider.getNetwork();
      
      toast({
        title: "Blockchain Connected",
        description: `Connected to network ${network.name} (${network.chainId})`,
      });
      
      return true;
    } catch (error) {
      console.error("Blockchain initialization error:", error);
      this.provider = null;
      this.contract = null;
      
      toast({
        title: "Blockchain Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to blockchain",
        variant: "destructive"
      });
      
      return false;
    }
  }

  async addRecord(record: Omit<MedicalRecord, 'timestamp'>, encrypt: boolean = true): Promise<boolean> {
    if (!this.contract || !this.provider) {
      toast({
        title: "Blockchain Not Connected",
        description: "Please connect to the blockchain first",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      // Encrypt sensitive data if required
      const vitals = encrypt ? encryptData(record.vitals) : record.vitals;
      
      // Get the signer
      const signer = this.provider.getSigner(0);
      const contractWithSigner = this.contract.connect(signer);
      
      // Send the transaction
      const tx = await contractWithSigner.addRecord(
        record.patientId,
        record.name,
        record.age,
        record.gender,
        record.diagnosis,
        vitals,
        record.audioSummaryHash
      );
      
      // Wait for transaction
      await tx.wait();
      
      toast({
        title: "Record Added",
        description: `Medical record for patient ${record.name} added to blockchain`,
      });
      
      return true;
    } catch (error) {
      console.error("Add record error:", error);
      
      toast({
        title: "Record Addition Failed",
        description: error instanceof Error ? error.message : "Failed to add record to blockchain",
        variant: "destructive"
      });
      
      return false;
    }
  }

  async getRecords(patientId: string, decrypt: boolean = true): Promise<MedicalRecord[]> {
    if (!this.contract || !this.provider) {
      console.error("Blockchain not connected");
      return [];
    }
    
    try {
      // Get record count
      const count = await this.contract.getRecordCount(patientId);
      const records: MedicalRecord[] = [];
      
      // Fetch each record
      for (let i = 0; i < count.toNumber(); i++) {
        const result = await this.contract.getRecord(patientId, i);
        
        // Process vitals (decrypt if necessary)
        let vitals = result[5];
        if (decrypt) {
          try {
            vitals = decryptData(vitals);
          } catch (error) {
            console.warn("Could not decrypt vitals, using raw data");
          }
        }
        
        records.push({
          patientId: result[0],
          name: result[1],
          age: result[2].toNumber(),
          gender: result[3],
          diagnosis: result[4],
          vitals: vitals,
          audioSummaryHash: result[6],
          timestamp: result[7].toNumber(),
        });
      }
      
      return records;
    } catch (error) {
      console.error("Get records error:", error);
      return [];
    }
  }
  
  async testConnection(): Promise<boolean> {
    if (!this.provider) {
      return false;
    }
    
    try {
      const network = await this.provider.getNetwork();
      console.log("Connected to network:", network);
      return true;
    } catch (error) {
      console.error("Test connection error:", error);
      return false;
    }
  }
}

export const blockchainService = new BlockchainService();
