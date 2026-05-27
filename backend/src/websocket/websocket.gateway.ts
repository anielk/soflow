import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway as WSGateway } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WSGateway({
  cors: {
    origin: '*',
  },
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  handleConnection(client: any) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: any) {
    console.log('Client disconnected:', client.id);
  }
}
