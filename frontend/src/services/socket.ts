import { io, Socket } from 'socket.io-client';
import { Attack } from './api';

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  // Event listeners
  private attackListeners: ((attack: Attack) => void)[] = [];
  private metricsListeners: ((metrics: any) => void)[] = [];
  private connectionListeners: ((connected: boolean) => void)[] = [];

  connect() {
    if (this.socket?.connected) {
      console.log('✅ Socket already connected');
      return;
    }

    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8080';
    console.log(`🔌 Connecting to socket server at ${socketUrl}`);
    
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
      timeout: 10000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.notifyConnectionListeners(false);
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to security monitoring system');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionListeners(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from security monitoring system:', reason);
      this.isConnected = false;
      this.notifyConnectionListeners(false);
      
      // Auto-reconnect logic
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect automatically
        return;
      }
      
      this.attemptReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔄 Connection error:', error);
      this.attemptReconnect();
    });

    // Security event listeners
    this.socket.on('new-attack', (attackData: Attack) => {
      console.log('🚨 New attack detected:', attackData);
      this.notifyAttackListeners(attackData);
    });

    this.socket.on('metrics-update', (metricsData: any) => {
      console.log('📊 Metrics updated:', metricsData);
      this.notifyMetricsListeners(metricsData);
    });

    this.socket.on('system-alert', (alertData: any) => {
      console.log('⚠️ System alert:', alertData);
      // Handle system alerts (could show toast notifications)
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Event listener management
  onNewAttack(callback: (attack: Attack) => void) {
    this.attackListeners.push(callback);
    return () => {
      const index = this.attackListeners.indexOf(callback);
      if (index > -1) {
        this.attackListeners.splice(index, 1);
      }
    };
  }

  onMetricsUpdate(callback: (metrics: any) => void) {
    this.metricsListeners.push(callback);
    return () => {
      const index = this.metricsListeners.indexOf(callback);
      if (index > -1) {
        this.metricsListeners.splice(index, 1);
      }
    };
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionListeners.push(callback);
    return () => {
      const index = this.connectionListeners.indexOf(callback);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  private notifyAttackListeners(attack: Attack) {
    this.attackListeners.forEach(callback => {
      try {
        callback(attack);
      } catch (error) {
        console.error('Error in attack listener:', error);
      }
    });
  }

  private notifyMetricsListeners(metrics: any) {
    this.metricsListeners.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.error('Error in metrics listener:', error);
      }
    });
  }

  private notifyConnectionListeners(connected: boolean) {
    this.connectionListeners.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  // Getters
  get connected(): boolean {
    // Check both our internal state and the actual socket connection
    return this.isConnected && (this.socket?.connected ?? false);
  }

  get socketId(): string | undefined {
    return this.socket?.id;
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
