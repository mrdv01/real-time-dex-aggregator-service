import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Token } from '../types';

export class WebSocketService {
  private io!: SocketIOServer;
  private connectedClients = 0;

  init(server: HttpServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket: Socket) => {
      this.connectedClients++;
      socket.on('disconnect', () => {
        this.connectedClients--;
      });
    });

    console.log('WebSocket service initialized');
  }

  broadcastSnapshot(tokens: Token[]): void {
    if (!this.io) return;
    this.io.emit('tokens:snapshot', {
      tokens,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastDelta(event: string, payload: any): void {
    if (!this.io) return;
    this.io.emit(event, payload);
  }

  getConnectedClients(): number {
    return this.connectedClients;
  }

  stop(): void {
    if (this.io) {
      this.io.close();
    }
  }
}

export default new WebSocketService();
