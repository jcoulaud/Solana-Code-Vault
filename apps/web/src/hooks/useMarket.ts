import { useCallback, useEffect, useState } from 'react';
import { WebSocketService } from '../services/websocket.service';
import { MarketState, MarketUpdate, SubmissionResponse } from '../types/market';

const initialState: MarketState = {
  marketCap: 0,
  revealedCharacters: '',
  winners: [],
  lastUpdate: new Date().toISOString(),
};

const POLLING_INTERVAL = 10000; // 10 seconds

export const useMarket = () => {
  const [state, setState] = useState<MarketState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const fetchMarketState = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error('API URL is not configured');
      }

      const response = await fetch(`${apiUrl}/market/state`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data: MarketState = await response.json();
      setState(data);
      setError(null);
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch market state';
      console.error('Market state fetch error:', errorMessage);
      setError(errorMessage);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    let mounted = true;

    const wsService = WebSocketService.getInstance();
    wsService.onConnectionChange((connected) => {
      if (!mounted) return;
      setWsConnected(connected);
      // Start polling if WebSocket disconnects
      if (!connected && !pollInterval) {
        pollInterval = setInterval(fetchMarketState, POLLING_INTERVAL);
      } else if (connected && pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    });

    // Initial fetch
    fetchMarketState();

    // WebSocket subscription
    const unsubscribe = wsService.subscribe((update: MarketUpdate) => {
      if (!mounted) return;
      setState((prevState) => {
        if (update.type === 'WINNER_UPDATE' && update.data.winners) {
          // Fetch fresh state after winner update
          fetchMarketState();
          return prevState;
        }
        return {
          ...prevState,
          ...update.data,
          lastUpdate: new Date().toISOString(),
        };
      });
    });

    return () => {
      mounted = false;
      unsubscribe();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [fetchMarketState]);

  const submitCode = useCallback(
    async (code: string, captchaToken: string): Promise<SubmissionResponse> => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          throw new Error('API URL is not configured');
        }

        const response = await fetch(`${apiUrl}/market/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            captchaToken,
            walletAddress: window.solana?.publicKey?.toString(),
          }),
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || data.message || 'Failed to submit code');
        }

        return data;
      } catch (err) {
        if (err instanceof Error) {
          throw err;
        }
        throw new Error('Failed to submit code');
      }
    },
    [],
  );

  return {
    marketCap: state.marketCap,
    revealedCharacters: state.revealedCharacters,
    winners: state.winners,
    lastUpdate: state.lastUpdate,
    isLoading,
    error,
    submitCode,
    wsConnected,
  };
};
