export interface AppSettings {
  theme?: 'light' | 'dark' | 'system';
  anatomyModelDetail?: 'low' | 'medium' | 'high';
  notificationVolume?: number;
  autoSync?: boolean;
  telemetryInterval?: number;
  useMetricSystem?: boolean;
  aiAnalysisInterval?: number;
  aiModel?: string;
  groqApiKey?: string;
  ghanaNlpApiKey?: string;
  aiEnabled?: boolean;
  blockchainNetwork?: string;
  blockchainEndpoint?: string;
  contractAddress?: string;
  encryptData?: boolean;
  telemetryMode?: 'test' | 'real';
  alertThreshold?: number;
  localNetworkIp?: string;
  localNetworkPort?: string;
  enableXR?: boolean;
  xrMode?: 'ar' | 'vr';
  handTracking?: boolean;
  spatialAudio?: boolean;
  anchorTracking?: boolean;
  roomScale?: boolean;
  highQualityModels?: boolean;
  defaultLanguage?: string;
  enableTTS?: boolean;
  enableAutoTranslation?: boolean;
  storePatientInfo?: boolean;
  storeDiagnosis?: boolean;
  storeVitals?: boolean;
  storeMedicalImages?: boolean;
  storageMode?: 'full' | 'hybrid' | 'ipfs';
  verifyContract?: boolean;
}

export function loadSettings(): AppSettings {
  try {
    const settings = localStorage.getItem('medxr_settings');
    return settings ? JSON.parse(settings) : getDefaultSettings();
  } catch (error) {
    console.error('Error loading settings:', error);
    return getDefaultSettings();
  }
}

export function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem('medxr_settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

function getDefaultSettings(): AppSettings {
  return {
    theme: 'light',
    anatomyModelDetail: 'medium',
    notificationVolume: 50,
    autoSync: true,
    telemetryInterval: 1000,
    useMetricSystem: true,
    aiAnalysisInterval: 30000,
    aiModel: 'llama-3.2-90b',
    aiEnabled: true,
    blockchainNetwork: 'testnet',
    encryptData: true,
    telemetryMode: 'real',
    alertThreshold: 80,
    enableXR: false,
    xrMode: 'ar',
    handTracking: true,
    spatialAudio: true,
    defaultLanguage: 'en',
    enableTTS: false,
    enableAutoTranslation: false,
    storePatientInfo: true,
    storeDiagnosis: true,
    storeVitals: true,
    storeMedicalImages: true,
    storageMode: 'hybrid',
    verifyContract: true
  };
}

export interface VitalSigns {
  heartRate: number;
  bloodPressure: number;
  oxygenLevel: number;
  temperature: number;
  respirationRate: number;
  timestamp: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  condition: string;
  admissionDate: string;
  doctor?: string;
  telemetryData?: TelemetryEntry[];
  blockchainStatus: 'pending' | 'verified' | 'error';
  diagnosis: string;
  dateOfBirth?: string;
  zkIdentityHash?: string;
  starknetWalletAddress?: string;
  medicalRecords?: MedicalRecord[];
  scansAndImages?: MedicalScan[];
  consentEnabled?: boolean;
  activityFeed?: ActivityEntry[];
  vitalSigns?: VitalSigns;
}

export interface MedicalRecord {
  id: string;
  timestamp: string;
  diagnosis: string;
  doctor: string;
  notes: string;
  tags: string[];
}

export interface MedicalScan {
  id: string;
  filename: string;
  type: 'jpg' | 'png' | 'dicom' | 'dcm';
  scanType: string;
  organ: string;
  uploadDate: string;
  doctor: string;
  metadata: ScanMetadata;
  thumbnailUrl?: string;
  ipfsHash?: string;
  nftTokenId?: string;
  txHash?: string;
}

export interface ScanMetadata {
  diagnosisSummary: string;
  notes: string;
  medicalTags: string[];
  timestamp: string;
  scanDate: string;
}

export interface ActivityEntry {
  id: string;
  type: 'nft_minted' | 'scan_uploaded' | 'zk_verified' | 'xr_viewed' | 'consent_toggled';
  timestamp: string;
  description: string;
  txHash?: string;
  details?: any;
}

export interface TelemetryEntry {
  timestamp: string;
  heartRate: number;
  bloodPressure: number;
  oxygenSaturation: number;
  temperature: number;
}

export function loadPatientData(): Patient[] {
  try {
    const data = localStorage.getItem('patient_data');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading patient data:', error);
    return [];
  }
}

export function savePatientData(data: Patient[]) {
  try {
    localStorage.setItem('patient_data', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving patient data:', error);
  }
}

export function getAPIKey(service: string): string | null {
  try {
    const keyMap: Record<string, string> = {
      'groq': 'medxr_groq_key',
      'ghana_nlp': 'medxr_ghana_nlp_key'
    };
    
    const storageKey = keyMap[service];
    return storageKey ? localStorage.getItem(storageKey) : null;
  } catch (error) {
    console.error(`Error getting ${service} API key:`, error);
    return null;
  }
}

export function saveAPIKey(service: string, apiKey: string): boolean {
  try {
    const keyMap: Record<string, string> = {
      'groq': 'medxr_groq_key',
      'ghananlp': 'medxr_ghana_nlp_key'
    };
    
    const storageKey = keyMap[service];
    if (storageKey) {
      localStorage.setItem(storageKey, apiKey);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error saving ${service} API key:`, error);
    return false;
  }
}

export function saveAIAnalysis(patientId: string, analysis: any): boolean {
  try {
    const analysisKey = `ai_analysis_${patientId}`;
    localStorage.setItem(analysisKey, JSON.stringify(analysis));
    return true;
  } catch (error) {
    console.error('Error saving AI analysis:', error);
    return false;
  }
}

export function getAIAnalysis(patientId: string): any {
  try {
    const analysisKey = `ai_analysis_${patientId}`;
    const analysis = localStorage.getItem(analysisKey);
    return analysis ? JSON.parse(analysis) : null;
  } catch (error) {
    console.error('Error getting AI analysis:', error);
    return null;
  }
}
