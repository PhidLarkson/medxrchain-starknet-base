
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AppSettings } from "@/utils/localStorage";
import { Blocks, LockKeyhole, Shield } from "lucide-react";

interface BlockchainSettingsProps {
  settings: AppSettings;
  onChange: (key: keyof AppSettings, value: any) => void;
  className?: string;
}

const BlockchainSettings = ({ settings, onChange, className }: BlockchainSettingsProps) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Blocks className="h-5 w-5 text-primary" />
          <span>Blockchain Settings</span>
        </CardTitle>
        <CardDescription>
          Configure blockchain integration and data storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Blockchain Network */}
        <div className="space-y-2">
          <Label>Blockchain Network</Label>
          <Select 
            value={settings.blockchainNetwork || 'polygon'} 
            onValueChange={(value) => onChange('blockchainNetwork', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select blockchain network" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ethereum">Ethereum Mainnet</SelectItem>
              <SelectItem value="goerli">Ethereum Goerli (Testnet)</SelectItem>
              <SelectItem value="polygon">Polygon</SelectItem>
              <SelectItem value="mumbai">Polygon Mumbai (Testnet)</SelectItem>
              <SelectItem value="optimism">Optimism</SelectItem>
              <SelectItem value="arbitrum">Arbitrum</SelectItem>
              <SelectItem value="local">Local (Development)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Select the blockchain network for storing patient data
          </p>
        </div>
        
        {/* Blockchain Endpoint */}
        <div className="space-y-2">
          <Label htmlFor="blockchainEndpoint">RPC Endpoint</Label>
          <Input
            id="blockchainEndpoint"
            value={settings.blockchainEndpoint || 'https://polygon-mainnet.infura.io/v3/'}
            onChange={(e) => onChange('blockchainEndpoint', e.target.value)}
            placeholder="https://polygon-mainnet.infura.io/v3/"
          />
          <p className="text-xs text-muted-foreground">
            RPC endpoint URL for connecting to the blockchain
          </p>
        </div>
        
        {/* Smart Contract Address */}
        <div className="space-y-2">
          <Label htmlFor="contractAddress">Smart Contract Address</Label>
          <Input
            id="contractAddress"
            value={settings.contractAddress || ''}
            onChange={(e) => onChange('contractAddress', e.target.value)}
            placeholder="0x..."
          />
          <p className="text-xs text-muted-foreground">
            Address of the deployed smart contract for patient data
          </p>
        </div>
        
        {/* Data Encryption */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <Label>Encrypt Blockchain Data</Label>
              <p className="text-xs text-muted-foreground">
                Encrypt sensitive patient data before storing on blockchain
              </p>
            </div>
            <Switch
              checked={settings.encryptData !== false}
              onCheckedChange={(checked) => onChange('encryptData', checked)}
            />
          </div>
        </div>
        
        {/* Data to Store on Blockchain */}
        <div className="space-y-2">
          <Label>Data to Store on Blockchain</Label>
          <div className="space-y-2 border p-4 rounded-md">
            <div className="flex items-center justify-between">
              <Label htmlFor="storePatientInfo" className="text-sm font-normal">Patient Information</Label>
              <Switch
                id="storePatientInfo"
                checked={settings.storePatientInfo !== false}
                onCheckedChange={(checked) => onChange('storePatientInfo', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="storeDiagnosis" className="text-sm font-normal">Diagnosis & Treatment</Label>
              <Switch
                id="storeDiagnosis"
                checked={settings.storeDiagnosis !== false}
                onCheckedChange={(checked) => onChange('storeDiagnosis', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="storeVitals" className="text-sm font-normal">Vital Signs</Label>
              <Switch
                id="storeVitals"
                checked={settings.storeVitals !== false}
                onCheckedChange={(checked) => onChange('storeVitals', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="storeMedicalImages" className="text-sm font-normal">Medical Images</Label>
              <Switch
                id="storeMedicalImages"
                checked={settings.storeMedicalImages === true}
                onCheckedChange={(checked) => onChange('storeMedicalImages', checked)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Select which data types will be securely stored on the blockchain
          </p>
        </div>
        
        {/* Storage Mode */}
        <div className="space-y-2">
          <Label>Storage Mode</Label>
          <RadioGroup
            value={settings.storageMode || 'hybrid'}
            onValueChange={(value) => onChange('storageMode', value)}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="full" id="storage-full" />
              <Label htmlFor="storage-full" className="text-sm font-normal">Full On-Chain Storage</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hybrid" id="storage-hybrid" />
              <Label htmlFor="storage-hybrid" className="text-sm font-normal">Hybrid Storage (Hash On-Chain, Data Off-Chain)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ipfs" id="storage-ipfs" />
              <Label htmlFor="storage-ipfs" className="text-sm font-normal">IPFS + Blockchain</Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-muted-foreground">
            Determine how data is stored on the blockchain
          </p>
        </div>
        
        {/* Security Information */}
        <div className="bg-muted p-3 rounded-lg flex items-start gap-3">
          <Shield className="h-4 w-4 text-primary mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <span className="font-medium">Security Note:</span> All blockchain interactions are secured and encrypted.
              Patient data is protected according to healthcare regulations.
            </p>
            <p>
              The system uses zero-knowledge proofs for verification without exposing sensitive information.
            </p>
          </div>
        </div>

        {/* Contract Verification */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <LockKeyhole className="h-4 w-4 text-primary" />
            <div>
              <span className="text-sm font-medium">Contract Verification</span>
              <p className="text-xs text-muted-foreground">
                Verify smart contract on Etherscan
              </p>
            </div>
          </div>
          <Switch 
            checked={settings.verifyContract === true}
            onCheckedChange={(checked) => onChange('verifyContract', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default BlockchainSettings;
