import { io, Socket } from 'socket.io-client';

// Use same host as base API URL
const socketUrl = 'http://localhost:5000';

class ClientSocketService {
  private socket: Socket | null = null;

  public connect(userId: string, departmentId?: string, semester?: number): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log(`[Socket.io] Connected to server. Client ID: ${this.socket?.id}`);

      // Join direct messaging room for alerts
      if (userId) {
        this.socket?.emit('join-user-room', { userId });
      }

      // Join class room for announcements
      if (departmentId && semester) {
        this.socket?.emit('join-class-room', {
          departmentId,
          semester,
        });
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket.io] Connection Error:', error.message);
    });

    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('[Socket.io] Disconnected from server');
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }
}

export const clientSocket = new ClientSocketService();
export default clientSocket;
