import { useCallback, useEffect, useState } from 'react';

export interface WalletHook {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  publicKey: string | null;
}

export const useWallet = (): WalletHook => {
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      if (window.solana?.isConnected) {
        setIsConnected(true);
        setPublicKey(window.solana.publicKey?.toString() || null);
      }
    };

    checkConnection();
    window.solana?.on('connect', () => {
      setIsConnected(true);
      setPublicKey(window.solana?.publicKey?.toString() || null);
    });
    window.solana?.on('disconnect', () => {
      setIsConnected(false);
      setPublicKey(null);
    });
  }, []);

  const connect = useCallback(async () => {
    try {
      if (!window.solana) {
        throw new Error('Solana wallet not found');
      }
      await window.solana.connect();
      setIsConnected(true);
      setPublicKey(window.solana.publicKey?.toString() || null);
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (window.solana?.disconnect) {
      window.solana.disconnect();
    }
    setIsConnected(false);
    setPublicKey(null);
  }, []);

  return {
    isConnected,
    connect,
    disconnect,
    publicKey,
  };
};
