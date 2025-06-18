import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class TransGuardFakeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private clientIntervals: Map<string, NodeJS.Timeout> = new Map();

  handleConnection(client: Socket): void {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket): void {
    console.log('Client disconnected:', client.id);
    this.clearClientInterval(client.id);
  }

  @SubscribeMessage('start-stream')
  handleStartStream(
    @MessageBody()
    data: {
      xMin: number;
      xMax: number;
      yMin: number;
      yMax: number;
      fps: number;
      outlierRate: number; // 튐 발생 확률 (기본값: 5%)
      outlierMultiplier: number; // 튐 발생 시 값의 배수 (기본
    },
    @ConnectedSocket() client: Socket,
  ) {
    const { xMin, xMax, yMin, yMax, fps, outlierRate, outlierMultiplier } =
      data;
    const intervalMs = 1000 / fps;

    this.clearClientInterval(client.id);

    const interval = setInterval(() => {
      const isOutlier = Math.random() < outlierRate * 0.01; // 5% 확률로 튐
      let x, y;

      if (isOutlier) {
        // outlier: 정상 범위를 크게 벗어난 값
        x = (Math.random() * (xMax - xMin) + xMin) * outlierMultiplier;
        y = (Math.random() * (yMax - yMin) + yMin) * outlierMultiplier;
      } else {
        // 정상값
        x = Math.random() * (xMax - xMin) + xMin;
        y = Math.random() * (yMax - yMin) + yMin;
      }

      client.emit('position', { x, y, outlier: isOutlier });
    }, intervalMs);

    this.clientIntervals.set(client.id, interval);
  }

  @SubscribeMessage('stop-stream')
  handleStopStream(@ConnectedSocket() client: Socket) {
    console.log('Stopping stream for client:', client.id);
    this.clearClientInterval(client.id);
    client.emit('stopped');
  }

  private clearClientInterval(clientId: string): void {
    const interval = this.clientIntervals.get(clientId);
    if (interval) {
      clearInterval(interval);
      this.clientIntervals.delete(clientId);
      console.log(`Cleared interval for client ${clientId}`);
    }
  }
}
