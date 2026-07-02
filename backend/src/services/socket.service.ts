import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';

class SocketService {
  private io: SocketIOServer | null = null;

  public init(server: HTTPServer): SocketIOServer {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      },
    });

    console.log('[Socket.io] Real-Time Notification Server initialized');

    this.io.on('connection', (socket: Socket) => {
      console.log(`[Socket.io] Client connected: ${socket.id}`);

      // Student joins room for their specific department and semester
      socket.on('join-class-room', (data: { departmentId: string; semester: number }) => {
        if (data.departmentId && data.semester) {
          const roomName = `class-${data.departmentId}-${data.semester}`;
          socket.join(roomName);
          console.log(`[Socket.io] Client ${socket.id} joined class room: ${roomName}`);
        }
      });

      // User joins personal user room for direct alerts
      socket.on('join-user-room', (data: { userId: string }) => {
        if (data.userId) {
          const roomName = `user-${data.userId}`;
          socket.join(roomName);
          console.log(`[Socket.io] Client ${socket.id} joined personal room: ${roomName}`);
        }
      });

      // Faculty / Students join a subject-specific session room for live counters
      socket.on('join-subject-room', (data: { subjectId: string }) => {
        if (data.subjectId) {
          const roomName = `subject-${data.subjectId}`;
          socket.join(roomName);
          console.log(`[Socket.io] Client ${socket.id} joined subject room: ${roomName}`);
        }
      });

      socket.on('disconnect', () => {
        console.log(`[Socket.io] Client disconnected: ${socket.id}`);
      });
    });

    return this.io;
  }

  // Send a private alert to a specific user
  public emitToUser(userId: string, event: string, data: any): void {
    if (this.io) {
      const roomName = `user-${userId}`;
      this.io.to(roomName).emit(event, data);
      console.log(`[Socket.io] Emitted '${event}' to user room: ${roomName}`);
    }
  }

  // Send a broadcast to all students in a department and semester
  public emitToClass(departmentId: string, semester: number, event: string, data: any): void {
    if (this.io) {
      const roomName = `class-${departmentId}-${semester}`;
      this.io.to(roomName).emit(event, data);
      console.log(`[Socket.io] Emitted '${event}' to class room: ${roomName}`);
    }
  }

  // Send a broadcast to all users listening to a subject (e.g. live QR counters)
  public emitToSubject(subjectId: string, event: string, data: any): void {
    if (this.io) {
      const roomName = `subject-${subjectId}`;
      this.io.to(roomName).emit(event, data);
      console.log(`[Socket.io] Emitted '${event}' to subject room: ${roomName}`);
    }
  }

  // Global broadcast
  public emitGlobal(event: string, data: any): void {
    if (this.io) {
      this.io.emit(event, data);
      console.log(`[Socket.io] Emitted global '${event}'`);
    }
  }
}

export const socketService = new SocketService();
export default socketService;
