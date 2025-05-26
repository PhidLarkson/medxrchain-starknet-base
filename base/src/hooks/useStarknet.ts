
import { useState, useEffect, useCallback } from 'react';
import { starknetService, StarknetState } from '@/services/starknetService';
import { toast } from '@/hooks/use-toast';

const initialState: StarknetState = {
  isConnected: false,
  account: null,
  address: null,
  network: 'testnet',
  balance: '0'
};

export const useStarknet = () => {
  const [state, setState] = useState<StarknetState>(initialState);
  const [isLoading, setIsLoading] = useState(false);

  const connect = useCallback(async () => {
    setIsLoading(true);
    try {
      const newState = await starknetService.connectWallet();
      setState(newState);
      toast({
        title: "Wallet Connected",
        description: `Connected to ${newState.address?.substring(0, 6)}...${newState.address?.substring(newState.address.length - 4)}`
      });
    } catch (error) {
      console.error('Connection failed:', error);
      toast({
        title: "Connection Failed",
        description: "Please install ArgentX or Braavos wallet",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await starknetService.disconnectWallet();
      setState(initialState);
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from wallet"
      });
    } catch (error) {
      console.error('Disconnection failed:', error);
    }
  }, []);

  const switchNetwork = useCallback(async (network: 'mainnet' | 'testnet') => {
    setState(prev => ({ ...prev, network }));
    toast({
      title: "Network Switched",
      description: `Switched to ${network}`
    });
  }, []);

  return {
    ...state,
    isLoading,
    connect,
    disconnect,
    switchNetwork
  };
};
