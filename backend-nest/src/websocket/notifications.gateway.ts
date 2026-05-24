import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, WebSocket as WsClient } from 'ws';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ path: '/ws' })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationsGateway');

  handleConnection(client: WsClient) {
    this.logger.log(`Client connected via WebSockets`);
  }

  handleDisconnect(client: WsClient) {
    this.logger.log(`Client disconnected via WebSockets`);
  }

  @SubscribeMessage('ping')
  handlePing(
    @MessageBody() data: any,
    @ConnectedSocket() client: WsClient,
  ) {
    client.send(
      JSON.stringify({
        type: 'system',
        payload: { action: 'pong' },
        timestamp: new Date().toISOString(),
      }),
    );
  }

  /**
   * Broadcast an alert or notification to all connected frontend clients
   */
  broadcastAlert(alert: {
    id: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    source: string;
  }) {
    const payload = {
      type: 'alert',
      payload: { ...alert, timestamp: new Date().toISOString(), acknowledged: false },
      timestamp: new Date().toISOString(),
    };
    
    this.broadcast(payload);
  }

  broadcastNotification(notification: any) {
    const payload = {
      type: 'notification',
      payload: notification,
      timestamp: new Date().toISOString(),
    };
    this.broadcast(payload);
  }

  private broadcast(data: any) {
    const message = JSON.stringify(data);
    this.server?.clients?.forEach((client) => {
      if (client.readyState === 1) { // 1 = OPEN
        client.send(message);
      }
    });
  }
}
