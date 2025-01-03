import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

export interface CharacterReveal {
  position?: number;
  character?: string;
  revealedCharacters: string[];
  remainingHidden?: number;
  allRevealed?: boolean;
}

export interface WinnerReveal {
  position: number;
  wallet: string;
  reward: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['*'],
    credentials: false,
  },
  transports: ['websocket', 'polling'],
})
export class MarketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(MarketGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  broadcastMarketUpdate(data: any) {
    this.logger.debug('Broadcasting market update:', data);
    this.server.emit('marketUpdate', data);
  }

  broadcastCharacterReveal(data: CharacterReveal) {
    this.logger.debug('Broadcasting character reveal:', data);
    this.server.emit('characterReveal', data);
  }

  broadcastWinner(data: WinnerReveal) {
    this.logger.debug('Broadcasting new winner:', data);
    this.server.emit('newWinner', data);
  }
}
