
import CryptoJS from 'crypto-js';
import { starknetService } from './starknetService';

export interface ZKIdentityData {
  patientId: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  walletAddress: string;
  timestamp: number;
}

export interface ZKProof {
  commitment: string;
  proof: string;
  publicInputs: string[];
  zkHash: string;
}

export interface ZKVerificationResult {
  isValid: boolean;
  zkHash: string;
  timestamp: number;
  onChainVerified?: boolean;
  txHash?: string;
}

class ZKIdentityService {
  private encryptionKey = 'medical-zk-identity-key';

  // Generate ZK Identity Hash from patient data
  generateZKIdentityHash(data: ZKIdentityData): string {
    const concatenatedData = `${data.patientId}${data.fullName}${data.dateOfBirth}${data.gender}${data.walletAddress}${data.timestamp}`;
    return CryptoJS.SHA256(concatenatedData).toString();
  }

  // Create ZK proof for patient identity
  async createZKProof(data: ZKIdentityData): Promise<ZKProof> {
    try {
      // Generate commitment (hash of private data)
      const commitment = this.generateZKIdentityHash(data);
      
      // Simulate ZK proof generation
      const proof = CryptoJS.SHA256(`proof_${commitment}_${Date.now()}`).toString();
      
      // Public inputs (non-sensitive data that can be verified)
      const publicInputs = [
        data.patientId,
        data.walletAddress,
        data.timestamp.toString()
      ];
      
      // Final ZK hash combining commitment and proof
      const zkHash = CryptoJS.SHA256(`${commitment}${proof}`).toString();
      
      console.log('ZK Proof generated:', { commitment, proof: proof.substring(0, 16) + '...', zkHash: zkHash.substring(0, 16) + '...' });
      
      return {
        commitment,
        proof,
        publicInputs,
        zkHash
      };
    } catch (error) {
      console.error('Error creating ZK proof:', error);
      throw new Error('Failed to create ZK proof');
    }
  }

  // Verify ZK proof locally
  async verifyZKProof(zkProof: ZKProof, originalData: ZKIdentityData): Promise<ZKVerificationResult> {
    try {
      // Recreate the commitment from original data
      const expectedCommitment = this.generateZKIdentityHash(originalData);
      
      // Verify commitment matches
      const commitmentValid = zkProof.commitment === expectedCommitment;
      
      // Verify ZK hash integrity
      const expectedZKHash = CryptoJS.SHA256(`${zkProof.commitment}${zkProof.proof}`).toString();
      const zkHashValid = zkProof.zkHash === expectedZKHash;
      
      const isValid = commitmentValid && zkHashValid;
      
      console.log('ZK Proof verification:', { commitmentValid, zkHashValid, isValid });
      
      return {
        isValid,
        zkHash: zkProof.zkHash,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error verifying ZK proof:', error);
      return {
        isValid: false,
        zkHash: '',
        timestamp: Date.now()
      };
    }
  }

  // Verify ZK proof on-chain using Starknet
  async verifyZKProofOnChain(zkProof: ZKProof): Promise<ZKVerificationResult> {
    try {
      // Use Starknet service to verify on-chain
      const isValid = await starknetService.verifyZKProof(zkProof.zkHash, zkProof.proof);
      
      if (isValid) {
        // Simulate transaction for on-chain verification
        const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
        
        console.log('On-chain ZK verification successful:', txHash);
        
        return {
          isValid: true,
          zkHash: zkProof.zkHash,
          timestamp: Date.now(),
          onChainVerified: true,
          txHash
        };
      } else {
        return {
          isValid: false,
          zkHash: zkProof.zkHash,
          timestamp: Date.now(),
          onChainVerified: false
        };
      }
    } catch (error) {
      console.error('Error verifying ZK proof on-chain:', error);
      return {
        isValid: false,
        zkHash: zkProof.zkHash,
        timestamp: Date.now(),
        onChainVerified: false
      };
    }
  }

  // Encrypt sensitive patient data for ZK storage
  encryptPatientData(data: any): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), this.encryptionKey).toString();
      return encrypted;
    } catch (error) {
      console.error('Error encrypting patient data:', error);
      throw new Error('Encryption failed');
    }
  }

  // Decrypt patient data
  decryptPatientData(encryptedData: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Error decrypting patient data:', error);
      throw new Error('Decryption failed');
    }
  }

  // Generate patient ZK identity from form data
  async generatePatientZKIdentity(formData: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    walletAddress: string;
  }): Promise<{ zkProof: ZKProof; zkIdentityHash: string }> {
    const patientId = `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const zkData: ZKIdentityData = {
      patientId,
      fullName: formData.fullName,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      walletAddress: formData.walletAddress,
      timestamp: Date.now()
    };

    const zkProof = await this.createZKProof(zkData);
    
    return {
      zkProof,
      zkIdentityHash: zkProof.zkHash
    };
  }
}

export const zkIdentityService = new ZKIdentityService();
