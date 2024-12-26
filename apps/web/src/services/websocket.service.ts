import { io, Socket } from 'socket.io-client';
import { MarketUpdate } from '../types/market';

export class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private subscribers: ((data: MarketUpdate) => void)[] = [];
  private connectionListeners: ((connected: boolean) => void)[] = [];
  private isConnecting = false;

  private constructor() {
    this.connect();
  }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private connect() {
    if (this.isConnecting || this.socket?.connected) {
      return;
    }

    this.isConnecting = true;
    this.notifyConnectionChange(false);

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

      this.socket = io(wsUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
        timeout: 20000,
        randomizationFactor: 0.5,
      });

      this.socket.on('connect', () => {
        this.isConnecting = false;
        this.notifyConnectionChange(true);
      });

      this.socket.on('disconnect', () => {
        this.notifyConnectionChange(false);
      });

      // Handle market updates (price, market cap)
      this.socket.on('marketUpdate', (data: any) => {
        this.notifySubscribers({
          type: 'MARKET_UPDATE',
          data: {
            marketCap: data.marketCap,
            revealedCharacters: data.revealedCharacters,
            lastUpdate: new Date().toISOString(),
          },
        });
      });

      // Handle character reveals
      this.socket.on('characterReveal', (data: any) => {
        console.log('Received character reveal:', data);
        this.notifySubscribers({
          type: 'CHARACTER_REVEAL',
          data: {
            revealedCharacters: Array.isArray(data.revealedCharacters)
              ? data.revealedCharacters.join('')
              : data.revealedCharacters,
          },
        });
      });

      // Handle new winners
      this.socket.on('newWinner', (data: any) => {
        console.log('Received new winner:', data);
        this.notifySubscribers({
          type: 'WINNER_UPDATE',
          data: {
            winners: data,
          },
        });
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO Connection Error:', error);
        this.notifyConnectionChange(false);
      });
    } catch (error) {
      console.error('Error creating Socket.IO connection:', error);
      this.isConnecting = false;
      this.notifyConnectionChange(false);
    }
  }

  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.push(callback);
    callback(this.socket?.connected || false);
    return () => {
      this.connectionListeners = this.connectionListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyConnectionChange(connected: boolean) {
    this.connectionListeners.forEach((callback) => callback(connected));
  }

  subscribe(callback: (data: MarketUpdate) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  private notifySubscribers(data: MarketUpdate) {
    this.subscribers.forEach((callback) => callback(data));
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.notifyConnectionChange(false);
  }
}
