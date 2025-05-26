
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import PatientMonitor from '@/components/PatientMonitor';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Shield, Zap, Database, Upload, Wallet } from 'lucide-react';
import { useStarknet } from '@/hooks/useStarknet';
import { useAppStore } from '@/stores/appStore';
import { loadPatientData } from '@/utils/localStorage';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const { isConnected, address, connect } = useStarknet();
  const { wallet, setWallet, activePatient } = useAppStore();
  const [stats, setStats] = useState({
    zkProtected: 0,
    mintedNFTs: 0,
    activeScans: 0,
    totalPatients: 0
  });

  useEffect(() => {
    const patients = loadPatientData();
    setStats({
      zkProtected: patients.filter(p => p.zkIdentityHash).length,
      mintedNFTs: patients.reduce((acc, p) => acc + (p.scansAndImages?.filter(s => s.nftTokenId)?.length || 0), 0),
      activeScans: patients.flatMap(p => p.telemetryData || []).length,
      totalPatients: patients.length
    });
  }, []);

  const handleWalletConnect = async () => {
    try {
      await connect();
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Starknet wallet"
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Please install ArgentX or Braavos wallet",
        variant: "destructive"
      });
    }
  };

  return (
    <Layout>
      <PageHeader
        title="Medical Telemetry Hub"
        description="ZK-protected real-time monitoring with NFT-backed scan records on Starknet"
        status={{
          label: isConnected ? 'Connected' : 'Disconnected',
          variant: isConnected ? 'default' : 'secondary'
        }}
        actions={
          <div className="flex items-center gap-4">
            {!isConnected && (
              <Button onClick={handleWalletConnect} className="gap-2">
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </Button>
            )}
            <div className="flex items-center gap-2">
              <Badge variant="default" className="gap-1 bg-green-600">
                <Shield className="h-3 w-3" />
                ZK Privacy Active
              </Badge>
            </div>
          </div>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">ZK Protected Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-1">{stats.zkProtected}</div>
            <p className="text-sm text-muted-foreground">Secure patient records</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Minted NFTs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-1">{stats.mintedNFTs}</div>
            <p className="text-sm text-muted-foreground">Scan NFTs on Starknet</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 mb-1">{stats.activeScans}</div>
            <p className="text-sm text-muted-foreground">Real-time data points</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-1">{stats.totalPatients}</div>
            <p className="text-sm text-muted-foreground">Managed records</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <PatientMonitor />
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Starknet Network</span>
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? `Connected (${wallet.network})` : 'Disconnected'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">ZK Privacy</span>
                <Badge variant="default" className="bg-green-600">
                  <Shield className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">IPFS Storage</span>
                <Badge variant="default" className="bg-blue-600">
                  <Database className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              </div>

              {activePatient && (
                <div className="pt-4 border-t">
                  <div className="text-sm font-medium mb-2">Active Patient</div>
                  <div className="text-sm text-muted-foreground">
                    {activePatient.name} - {activePatient.condition}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
