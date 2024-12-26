import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useCallback, useMemo } from 'react';

export interface WalletHook {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  error: Error | null;
}

export const useWallet = (): WalletHook => {
  const {
    publicKey,
    connected,
    connecting,
    disconnect: solanaDisconnect,
    connect: solanaConnect,
    wallet,
  } = useSolanaWallet();

  const connect = useCallback(async () => {
    try {
      if (wallet) {
        await solanaConnect();
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }, [wallet, solanaConnect]);

  const disconnect = useCallback(async () => {
    try {
      await solanaDisconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    }
  }, [solanaDisconnect]);

  return useMemo(
    () => ({
      address: publicKey?.toBase58() || null,
      isConnected: connected,
      isConnecting: connecting,
      connect,
      disconnect,
      error: null,
    }),
    [publicKey, connected, connecting, connect, disconnect],
  );
};
