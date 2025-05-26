
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ethers } from 'ethers';
import { toast } from '@/hooks/use-toast';

// Add this declaration to handle window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: any) => Promise<any>;
      isMetaMask?: boolean;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

interface MetaMaskConnectorProps {
  onConnect?: (provider: ethers.providers.Web3Provider, account: string) => void;
}

const MetaMaskConnector = ({ onConnect }: MetaMaskConnectorProps) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [account, setAccount] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState<boolean>(false);

  useEffect(() => {
    const checkMetaMask = () => {
      setIsMetaMaskInstalled(
        typeof window !== 'undefined' && 
        window.ethereum !== undefined && 
        !!window.ethereum.isMetaMask
      );
    };
    
    checkMetaMask();
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to connect your wallet",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Get the first account
      const userAccount = accounts[0];
      setAccount(userAccount);
      setIsConnected(true);
      
      // Create ethers provider
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Call the onConnect callback if provided
      if (onConnect) {
        onConnect(provider, userAccount);
      }
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${userAccount.substring(0, 6)}...${userAccount.substring(userAccount.length - 4)}`
      });
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to MetaMask wallet",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {isConnected && account ? (
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center bg-muted h-12 w-12 rounded-full mx-auto">
              <svg viewBox="0 0 40 40" width="24" height="24" fill="currentColor">
                <path d="M20 2C10.059 2 2 10.059 2 20s8.059 18 18 18 18-8.059 18-18S29.941 2 20 2zm-7.28 24.28a.75.75 0 01-1.06-1.06l8-8a.75.75 0 011.06 0l8 8a.75.75 0 01-1.06 1.06L20 18.56l-7.28 7.72z" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Connected</p>
              <p className="text-xs text-muted-foreground">
                {account.substring(0, 6)}...{account.substring(account.length - 4)}
              </p>
            </div>
          </div>
        ) : (
          <Button
            className="w-full"
            onClick={connectWallet}
            disabled={isLoading || !isMetaMaskInstalled}
          >
            {isLoading ? "Connecting..." : 
             !isMetaMaskInstalled ? "Install MetaMask" : 
             "Connect MetaMask"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default MetaMaskConnector;
