import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from './api';

export class WebSocketClient {
  private socket: Socket | null = null;
  private readonly baseUrl: string;

  constructor() {
    // Same base URL (and same dev-fallback / production-fail-fast rules) as
    // every REST call — see getApiBaseUrl in ./api.
    this.baseUrl = getApiBaseUrl();
  }

  connect() {
    this.socket = io(this.baseUrl, {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('pong', () => {
      console.log('Received pong from server');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data?: unknown) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, callback: (data: unknown) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }
}

export const webSocketClient = new WebSocketClient();