
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Zap, Shield, ExternalLink } from 'lucide-react';
import { useStarknet } from '@/hooks/useStarknet';
import { cn } from '@/lib/utils';

interface StarknetWalletConnectorProps {
  className?: string;
}

const StarknetWalletConnector = ({ className }: StarknetWalletConnectorProps) => {
  const { isConnected, address, network, balance, isLoading, connect, disconnect, switchNetwork } = useStarknet();

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const formatBalance = (bal: string) => {
    const eth = parseFloat(bal) / Math.pow(10, 18);
    return eth.toFixed(4);
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Starknet Wallet
        </CardTitle>
        <CardDescription>
          Connect your Starknet wallet to access medical records and mint NFTs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="text-center space-y-4">
            <div className="text-muted-foreground text-sm">
              Connect ArgentX or Braavos wallet to get started
            </div>
            <Button 
              onClick={connect} 
              disabled={isLoading}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-pulse" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{formatAddress(address!)}</div>
                <div className="text-sm text-muted-foreground">
                  {formatBalance(balance)} ETH
                </div>
              </div>
              <Badge 
                variant={network === 'mainnet' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {network}
              </Badge>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => switchNetwork(network === 'mainnet' ? 'testnet' : 'mainnet')}
              >
                Switch to {network === 'mainnet' ? 'Testnet' : 'Mainnet'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                asChild
              >
                <a 
                  href={`https://${network === 'mainnet' ? '' : 'testnet.'}starkscan.co/contract/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View on Explorer
                </a>
              </Button>
            </div>
            
            <div className="pt-2 border-t">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={disconnect}
                className="w-full"
              >
                Disconnect
              </Button>
            </div>
          </div>
        )}
        
        <div className="bg-muted/30 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="font-medium">ZK Privacy Enabled</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Your medical data is protected with zero-knowledge proofs
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StarknetWalletConnector;
