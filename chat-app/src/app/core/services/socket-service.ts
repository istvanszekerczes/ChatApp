import { Service } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

type Handler = (data: unknown) => void;

@Service()
export class SocketService {
  private socket: Socket | null = null;
  private handlers = new Map<string, Set<Handler>>();

  /**
   * Connects to the socket server and sets up event listeners for connection, disconnection, and errors.
   * If the socket is already connected, it does nothing.
   *  
   * @returns 
   */
  connect() {
    if (this.socket) return;

    this.socket = io(environment.socketUrl, { withCredentials: true });

    this.socket.on('connect', () => {
      console.log('[socket] connected', this.socket?.id);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[socket] connect_error:', err.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[socket] disconnected:', reason);
    });

    // Attach anything registered before the socket existed
    for (const [event, set] of this.handlers) {
      for (const handler of set) {
        this.socket.on(event, handler);
      }
    }
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  /**
   * Subscribes to a socket event and returns an Observable that emits when the event is received.
   *
   * @param event The event name to listen for.
   * @returns An Observable that emits when the event is received.
   */
  on<T>(event: string): Observable<T> {
    return new Observable<T>(subscriber => {
      const handler: Handler = (data) => subscriber.next(data as T);

      if (!this.handlers.has(event)) {
        this.handlers.set(event, new Set());
      }
      this.handlers.get(event)!.add(handler);

      this.socket?.on(event, handler);

      return () => {
        this.handlers.get(event)?.delete(handler);
        this.socket?.off(event, handler);
      };
    });
  }

  emit(event: string, data: unknown) {
    this.socket?.emit(event, data);
  }
}