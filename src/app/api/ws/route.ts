import { NextRequest } from 'next/server';
import { supabaseClient } from '@/lib/supabase/client';

interface WebSocketClient {
  id: string;
  socket: WebSocket;
  lastPing: number;
}

class WebSocketManager {
  private clients: Map<string, WebSocketClient> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startPingInterval();
    this.startDataBroadcast();
  }

  addClient(id: string, socket: WebSocket): void {
    this.clients.set(id, {
      id,
      socket,
      lastPing: Date.now()
    });

    socket.addEventListener('message', (event) => {
      this.handleMessage(id, event.data);
    });

    socket.addEventListener('close', () => {
      this.clients.delete(id);
    });

    console.log(`WebSocket client ${id} connected. Total clients: ${this.clients.size}`);
  }

  private handleMessage(clientId: string, data: string): void {
    try {
      const message = JSON.parse(data);
      
      if (message.type === 'heartbeat') {
        const client = this.clients.get(clientId);
        if (client) {
          client.lastPing = Date.now();
          // Send pong back
          client.socket.send(JSON.stringify({
            type: 'pong',
            data: { timestamp: Date.now() },
            timestamp: new Date().toISOString()
          }));
        }
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  broadcast(message: any): void {
    const messageStr = JSON.stringify(message);
    
    this.clients.forEach((client, id) => {
      if (client.socket.readyState === WebSocket.OPEN) {
        try {
          client.socket.send(messageStr);
        } catch (error) {
          console.error(`Error sending to client ${id}:`, error);
          this.clients.delete(id);
        }
      } else {
        this.clients.delete(id);
      }
    });
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      const now = Date.now();
      
      this.clients.forEach((client, id) => {
        // Remove clients that haven't pinged in 2 minutes
        if (now - client.lastPing > 120000) {
          console.log(`Removing inactive client ${id}`);
          client.socket.close();
          this.clients.delete(id);
        }
      });
    }, 30000);
  }

  private startDataBroadcast(): void {
    // Broadcast system data every 10 seconds
    setInterval(async () => {
      if (this.clients.size === 0) return;

      try {
        // Get real-time module status
        const moduleStatus = await this.getModuleStatus();
        
        // Get recent user activity
        const userActivity = await this.getUserActivity();
        
        // Get prediction metrics
        const predictionMetrics = await this.getPredictionMetrics();

        // Broadcast updates
        this.broadcast({
          type: 'system_update',
          data: {
            moduleStatus,
            userActivity,
            predictionMetrics,
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error broadcasting system data:', error);
      }
    }, 10000);
  }

  private async getModuleStatus(): Promise<any> {
    try {
      const { data: modules } = await supabaseClient
        .from('module_status')
        .select('*')
        .order('last_updated', { ascending: false });

      return modules || [];
    } catch (error) {
      console.error('Error fetching module status:', error);
      return [];
    }
  }

  private async getUserActivity(): Promise<any> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: activity } = await supabaseClient
        .from('user_analytics')
        .select('*')
        .gte('timestamp', `${today}T00:00:00Z`)
        .order('timestamp', { ascending: false })
        .limit(50);

      return activity || [];
    } catch (error) {
      console.error('Error fetching user activity:', error);
      return [];
    }
  }

  private async getPredictionMetrics(): Promise<any> {
    try {
      const { data: validations } = await supabaseClient
        .from('prediction_validation')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      return validations || [];
    } catch (error) {
      console.error('Error fetching prediction metrics:', error);
      return [];
    }
  }
}

const wsManager = new WebSocketManager();

export async function GET(request: NextRequest) {
  // Check if this is a WebSocket upgrade request
  const upgrade = request.headers.get('upgrade');
  if (upgrade !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 });
  }

  try {
    // In a real implementation, you'd use a WebSocket library like 'ws'
    // For now, return a basic response
    return new Response('WebSocket endpoint - use WebSocket client to connect', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      }
    });
  } catch (error) {
    console.error('WebSocket setup error:', error);
    return new Response('WebSocket setup failed', { status: 500 });
  }
}

// Export WebSocket manager for use in other parts of the application
export { wsManager };