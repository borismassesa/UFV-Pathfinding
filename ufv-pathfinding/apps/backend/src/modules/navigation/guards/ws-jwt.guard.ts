import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      const client: AuthenticatedSocket = context.switchToWs().getClient();
      
      if (client.userId && client.user) {
        // Already authenticated during connection
        return true;
      }

      const token = this.extractTokenFromClient(client);
      
      if (!token) {
        throw new WsException('Access token not found');
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.user = payload;

      return true;
    } catch (error) {
      this.logger.error('WebSocket JWT authentication failed:', error.message);
      throw new WsException('Invalid access token');
    }
  }

  private extractTokenFromClient(client: AuthenticatedSocket): string | null {
    // Try to get token from auth object (sent during connection)
    if (client.handshake.auth?.token) {
      return client.handshake.auth.token;
    }

    // Try to get token from authorization header
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.replace('Bearer ', '');
    }

    // Try to get token from query parameters
    if (client.handshake.query?.token) {
      return client.handshake.query.token as string;
    }

    return null;
  }
}