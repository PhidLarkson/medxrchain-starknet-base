
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Wallet, 
  Shield, 
  Database, 
  Brain, 
  Activity, 
  ExternalLink, 
  Download,
  Upload,
  Settings as SettingsIcon,
  Zap,
  Eye,
  Lock
} from 'lucide-react';
import StarknetWalletConnector from '@/components/blockchain/StarknetWalletConnector';
import { useStarknet } from '@/hooks/useStarknet';
import { starknetService } from '@/services/starknetService';
import { loadSettings, saveSettings, AppSettings } from '@/utils/localStorage';
import { toast } from '@/hooks/use-toast';

const Settings = () => {
  const { isConnected, address, network } = useStarknet();
  const [settings, setSettings] = useState<AppSettings>({});
  const [zkSettings, setZkSettings] = useState({
    zkRequired: true,
    autoEncrypt: true,
    trustedDoctors: [] as string[],
    recoveryEnabled: false
  });
  const [storageSettings, setStorageSettings] = useState({
    defaultStorage: 'ipfs',
    autoMint: true,
    nftPrivacy: 'zk-protected'
  });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedSettings = loadSettings();
    setSettings(savedSettings);
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      const logs = await starknetService.getTransactionHistory();
      setAuditLogs(logs);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  };

  const handleSaveSettings = () => {
    setIsLoading(true);
    
    const updatedSettings = {
      ...settings,
      zkRequired: zkSettings.zkRequired,
      autoEncrypt: zkSettings.autoEncrypt,
      defaultStorage: storageSettings.defaultStorage,
      autoMint: storageSettings.autoMint,
      nftPrivacy: storageSettings.nftPrivacy
    };

    saveSettings(updatedSettings);
    
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Settings Saved",
        description: "Your blockchain settings have been updated"
      });
    }, 1000);
  };

  const exportAuditLogs = () => {
    const dataStr = JSON.stringify(auditLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'medical-audit-logs.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Audit Logs Exported",
      description: "Downloaded blockchain audit trail"
    });
  };

  const generateZKProof = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Connect your Starknet wallet to generate ZK proofs",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const zkIdentity = await starknetService.generateZKIdentity({
        id: 'patient_001',
        name: 'ZK Protected Patient',
        address: address
      });
      
      toast({
        title: "ZK Proof Generated",
        description: `ZK ID: ${zkIdentity.zkId.substring(0, 10)}...`
      });
    } catch (error) {
      toast({
        title: "ZK Generation Failed",
        description: "Could not generate zero-knowledge proof",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Web3 Medical Control Center</h1>
        <p className="text-muted-foreground">
          Complete blockchain operations dashboard for medical imaging and patient records
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Tabs defaultValue="wallet" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="wallet" className="gap-2">
                <Wallet className="h-4 w-4" />
                Wallet
              </TabsTrigger>
              <TabsTrigger value="zk" className="gap-2">
                <Shield className="h-4 w-4" />
                ZK Privacy
              </TabsTrigger>
              <TabsTrigger value="storage" className="gap-2">
                <Database className="h-4 w-4" />
                Storage
              </TabsTrigger>
              <TabsTrigger value="assistant" className="gap-2">
                <Brain className="h-4 w-4" />
                Assistant
              </TabsTrigger>
              <TabsTrigger value="audit" className="gap-2">
                <Activity className="h-4 w-4" />
                Audit
              </TabsTrigger>
            </TabsList>

            <TabsContent value="wallet" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Starknet Wallet & Network</CardTitle>
                  <CardDescription>
                    Manage your Starknet connection and network preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <StarknetWalletConnector />
                  
                  {isConnected && (
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <Card className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium">Gas Strategy</span>
                        </div>
                        <Select defaultValue="standard">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low (Slow)</SelectItem>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="high">High (Fast)</SelectItem>
                          </SelectContent>
                        </Select>
                      </Card>
                      
                      <Card className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ExternalLink className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Explorer</span>
                        </div>
                        <Select defaultValue="starkscan">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="starkscan">Starkscan</SelectItem>
                            <SelectItem value="voyager">Voyager</SelectItem>
                          </SelectContent>
                        </Select>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="zk" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Zero-Knowledge Privacy Controls</CardTitle>
                  <CardDescription>
                    Configure ZK proofs and patient data protection
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Require ZK Proofs for Access</Label>
                      <p className="text-sm text-muted-foreground">
                        Enforce zero-knowledge verification for all patient records
                      </p>
                    </div>
                    <Switch
                      checked={zkSettings.zkRequired}
                      onCheckedChange={(checked) => 
                        setZkSettings(prev => ({...prev, zkRequired: checked}))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Auto-Encrypt Medical Data</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically encrypt sensitive medical information
                      </p>
                    </div>
                    <Switch
                      checked={zkSettings.autoEncrypt}
                      onCheckedChange={(checked) => 
                        setZkSettings(prev => ({...prev, autoEncrypt: checked}))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Trusted Medical Professionals</Label>
                    <Input
                      placeholder="Add Starknet address (0x...)"
                      className="mb-2"
                    />
                    <Button variant="outline" size="sm">
                      Add Trusted Doctor
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      {zkSettings.trustedDoctors.length} trusted addresses configured
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Button 
                      onClick={generateZKProof}
                      disabled={!isConnected || isLoading}
                      className="w-full"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      {isLoading ? 'Generating...' : 'Generate Patient ZK Identity'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="storage" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Storage & NFT Configuration</CardTitle>
                  <CardDescription>
                    Configure file storage and NFT minting preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Default File Storage</Label>
                    <Select 
                      value={storageSettings.defaultStorage}
                      onValueChange={(value) => 
                        setStorageSettings(prev => ({...prev, defaultStorage: value}))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ipfs">IPFS</SelectItem>
                        <SelectItem value="arweave">Arweave</SelectItem>
                        <SelectItem value="starknet">Starknet Native</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Auto-Mint Uploads</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically mint NFT for every medical scan upload
                      </p>
                    </div>
                    <Switch
                      checked={storageSettings.autoMint}
                      onCheckedChange={(checked) => 
                        setStorageSettings(prev => ({...prev, autoMint: checked}))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>NFT Privacy Level</Label>
                    <Select 
                      value={storageSettings.nftPrivacy}
                      onValueChange={(value) => 
                        setStorageSettings(prev => ({...prev, nftPrivacy: value}))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="zk-protected">ZK Protected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-4 w-4" />
                      <span className="font-medium">Storage Stats</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Total Files</div>
                        <div className="font-medium">247</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Storage Used</div>
                        <div className="font-medium">15.7 GB</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assistant" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Assistant Configuration</CardTitle>
                  <CardDescription>
                    Configure language preferences and AI model settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Language Preference</Label>
                    <Select defaultValue="en">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="tw">Twi</SelectItem>
                        <SelectItem value="ee">Ewe</SelectItem>
                        <SelectItem value="ga">Ga</SelectItem>
                        <SelectItem value="dag">Dagbani</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>AI Model Version</Label>
                    <Select defaultValue="llama-3.2-90b">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="llama-3.2-90b">Llama 3.2 90B Vision</SelectItem>
                        <SelectItem value="llama-3.2-11b">Llama 3.2 11B Vision</SelectItem>
                        <SelectItem value="mixtral">Mixtral 8x7B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">AI Auto-Tagging</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically tag medical scans with AI analysis
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit" className="space-y-6 mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Blockchain Audit Trail</CardTitle>
                    <CardDescription>
                      View all blockchain transactions and activities
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportAuditLogs}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Logs
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {auditLogs.map((log, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            log.type === 'mint' ? 'bg-green-100 text-green-600' :
                            log.type === 'zkproof' ? 'bg-blue-100 text-blue-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {log.type === 'mint' ? <Upload className="h-4 w-4" /> :
                             log.type === 'zkproof' ? <Shield className="h-4 w-4" /> :
                             <Activity className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="font-medium">{log.description}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(log.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {log.hash.substring(0, 10)}...
                          </Badge>
                          <Button variant="ghost" size="sm" asChild>
                            <a 
                              href={`https://testnet.starkscan.co/tx/${log.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={handleSaveSettings}
                disabled={isLoading}
              >
                <SettingsIcon className="h-4 w-4" />
                {isLoading ? 'Saving...' : 'Save All Settings'}
              </Button>
              
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <a href="/records">
                  <Eye className="h-4 w-4" />
                  View Records
                </a>
              </Button>
              
              <Button variant="outline" className="w-full justify-start gap-2" asChild>
                <a href="/models">
                  <Upload className="h-4 w-4" />
                  Upload Scans
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Starknet Connection</span>
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">ZK Privacy</span>
                <Badge variant="default" className="bg-green-600">
                  Enabled
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">IPFS Storage</span>
                <Badge variant="default" className="bg-blue-600">
                  Online
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
