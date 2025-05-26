
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Patient } from '@/utils/localStorage';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  network: 'mainnet' | 'testnet';
  balance: string;
}

interface AppState {
  // Wallet state
  wallet: WalletState;
  setWallet: (wallet: WalletState) => void;
  
  // Active patient for cross-page reference
  activePatient: Patient | null;
  setActivePatient: (patient: Patient | null) => void;
  
  // Global theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  
  // XR mode
  xrEnabled: boolean;
  toggleXR: () => void;
  
  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      wallet: {
        isConnected: false,
        address: null,
        network: 'testnet',
        balance: '0'
      },
      setWallet: (wallet) => set({ wallet }),
      
      activePatient: null,
      setActivePatient: (patient) => set({ activePatient: patient }),
      
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      
      xrEnabled: false,
      toggleXR: () => set((state) => ({ xrEnabled: !state.xrEnabled })),
      
      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading })
    }),
    {
      name: 'medxr-app-store',
      partialize: (state) => ({ 
        theme: state.theme, 
        xrEnabled: state.xrEnabled,
        activePatient: state.activePatient 
      })
    }
  )
);
