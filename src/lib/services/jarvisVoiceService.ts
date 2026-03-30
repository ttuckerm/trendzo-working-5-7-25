"use client";
import { eventBus } from '@/lib/services/serverEventBus'

interface VoiceServiceConfig {
  apiKey: string;
  model: string;
  voice: string;
  language: string;
  enableMemory: boolean;
  contextRetention: number; // minutes
}

interface SystemMetrics {
  videosPredicted: number;
  accuracy: number;
  activeConnections: number;
  systemUptime: string;
  lastUpdate: Date;
}

interface MemoryEntry {
  id: string;
  timestamp: Date;
  context: string;
  interaction: string;
  response: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

interface AdminCommand {
  command: string;
  parameters: Record<string, any>;
  requiresConfirmation: boolean;
  estimatedImpact: 'low' | 'medium' | 'high' | 'critical';
}

export class JarvisVoiceService {
  private config: VoiceServiceConfig;
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private isProcessing = false;
  private wakeWindowUntil: number = 0;
  private memory: MemoryEntry[] = [];
  private systemMetrics: SystemMetrics;
  private subscribers: Map<string, (data: any) => void> = new Map();
  private _unsubSystem?: () => void;

  constructor(config: Partial<VoiceServiceConfig> = {}) {
    this.config = {
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
      model: 'gpt-4o',
      voice: 'nova',
      language: 'en-US',
      enableMemory: true,
      contextRetention: 30,
      ...config
    };

    this.systemMetrics = {
      videosPredicted: 26453,
      accuracy: 91.3,
      activeConnections: 7,
      systemUptime: '99.8%',
      lastUpdate: new Date()
    };

    this.initializeServices();
    this.loadMemoryFromStorage();
    this.startSystemMonitoring();
  }

  // Initialize core services
  private initializeServices() {
    if (typeof window !== 'undefined') {
      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.config.language;
        
        this.recognition.onresult = this.handleSpeechResult.bind(this);
        this.recognition.onerror = this.handleSpeechError.bind(this);
        this.recognition.onend = this.handleSpeechEnd.bind(this);
      }

      // Initialize speech synthesis
      this.synthesis = window.speechSynthesis;

      // Subscribe to server event bus for real-time system monitoring
      this._unsubSystem?.()
      this._unsubSystem = eventBus.subscribe('jarvis_system', this.handleSystemUpdate.bind(this))
    }
  }

  // Handle speech recognition results
  private handleSpeechResult(event: any) {
    const last = event.results.length - 1;
    const transcript = event.results[last][0].transcript;

    // Barge-in: stop any current speech when user speaks
    if (this.synthesis) this.synthesis.cancel();

    if (event.results[last].isFinal) {
      this.processVoiceCommand(transcript);
    }

    this.notifySubscribers('speech_result', {
      transcript,
      isFinal: event.results[last].isFinal,
      confidence: event.results[last][0].confidence
    });
  }

  // Handle speech recognition errors
  private handleSpeechError(event: any) {
    console.error('Speech recognition error:', event.error);
    this.notifySubscribers('speech_error', { error: event.error });
  }

  // Handle speech recognition end
  private handleSpeechEnd() {
    if (this.isListening) {
      // Restart recognition if we're supposed to be listening
      setTimeout(() => {
        if (this.recognition && this.isListening) {
          this.recognition.start();
        }
      }, 100);
    }
  }

  // Process voice commands with intelligent routing
  public async processVoiceCommand(command: string): Promise<void> {
    this.isProcessing = true;
    this.notifySubscribers('processing_start', { command });

    try {
      const lowerCommand = command.toLowerCase();

      // Wake phrase gating
      const now = Date.now();
      if (lowerCommand.includes('jarvis')) {
        this.wakeWindowUntil = now + 20000; // 20s window
        const clean = lowerCommand.replace('jarvis', '').trim();
        if (!clean) { await this.speak('Yes?'); return }
      } else if (now > this.wakeWindowUntil) {
        // Ignore if not woken
        return;
      }

      // Store interaction in memory
      if (this.config.enableMemory) {
        await this.storeMemory(command, 'voice_command');
      }

      // Check for system commands first
      if (await this.handleSystemCommand(lowerCommand)) {
        return;
      }

      // Check for admin commands
      if (await this.handleAdminCommand(lowerCommand)) {
        return;
      }

      // Bridge to orchestrator via API first
      try {
        const rq = await fetch('/api/jarvis/intent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ utterance: command, mode: 'voice', actor: { id: 'voice', role: 'super_admin', channel: 'voice' } }) })
        if (rq.ok) {
          const intentRes = await rq.json()
          if (intentRes?.actions && intentRes.actions.length) {
            await this.speak(intentRes.text)
            return
          }
        }
      } catch {}

      // Send to AI for processing if no direct skill matched
      await this.processWithAI(command);

    } catch (error) {
      console.error('Error processing voice command:', error);
      await this.speak('I encountered an error processing that command.');
    } finally {
      this.isProcessing = false;
      this.notifySubscribers('processing_end', { command });
    }
  }

  // Handle system-level commands
  private async handleSystemCommand(command: string): Promise<boolean> {
    if (command.includes('jarvis status') || command.includes('system status')) {
      const status = `System operating at ${this.systemMetrics.accuracy}% accuracy. ${this.systemMetrics.videosPredicted.toLocaleString()} videos processed. All systems optimal. Current time is ${new Date().toLocaleTimeString()}.`;
      await this.speak(status);
      return true;
    }

    if (command.includes('system metrics') || command.includes('show metrics')) {
      const metrics = `Current metrics: ${this.systemMetrics.videosPredicted.toLocaleString()} videos predicted with ${this.systemMetrics.accuracy}% accuracy. ${this.systemMetrics.activeConnections} active connections. System uptime: ${this.systemMetrics.systemUptime}.`;
      await this.speak(metrics);
      return true;
    }

    if (command.includes('memory status')) {
      const memoryCount = this.memory.length;
      const criticalCount = this.memory.filter(m => m.importance === 'critical').length;
      await this.speak(`I have ${memoryCount} memories stored, including ${criticalCount} critical entries.`);
      return true;
    }

    if (command.includes('clear memory')) {
      this.memory = [];
      this.saveMemoryToStorage();
      await this.speak('Memory cleared successfully.');
      return true;
    }

    return false;
  }

  // Handle admin-level commands
  private async handleAdminCommand(command: string): Promise<boolean> {
    const adminCommands: Record<string, AdminCommand> = {
      'restart system': {
        command: 'system_restart',
        parameters: {},
        requiresConfirmation: true,
        estimatedImpact: 'high'
      },
      'update algorithms': {
        command: 'algorithm_update',
        parameters: {},
        requiresConfirmation: true,
        estimatedImpact: 'medium'
      },
      'generate report': {
        command: 'generate_report',
        parameters: { type: 'comprehensive' },
        requiresConfirmation: false,
        estimatedImpact: 'low'
      },
      'export data': {
        command: 'export_data',
        parameters: {},
        requiresConfirmation: true,
        estimatedImpact: 'medium'
      }
    };

    for (const [trigger, adminCommand] of Object.entries(adminCommands)) {
      if (command.includes(trigger)) {
        if (adminCommand.requiresConfirmation) {
          await this.speak(`This will ${trigger}. Please confirm by saying 'confirm' or 'cancel'.`);
          // TODO: Implement confirmation workflow
        } else {
          await this.executeAdminCommand(adminCommand);
        }
        return true;
      }
    }

    return false;
  }

  // Execute admin commands
  private async executeAdminCommand(adminCommand: AdminCommand): Promise<void> {
    try {
      // Publish command on server event bus
      eventBus.publish('admin_command', {
        command: adminCommand.command,
        parameters: adminCommand.parameters,
        timestamp: new Date().toISOString(),
        source: 'jarvis_voice'
      })

      await this.speak(`Executing ${adminCommand.command}. I'll notify you when complete.`);
      
      // Store critical admin actions in memory
      if (this.config.enableMemory) {
        await this.storeMemory(
          `Admin command: ${adminCommand.command}`,
          'admin_action',
          'critical'
        );
      }

    } catch (error) {
      console.error('Error executing admin command:', error);
      await this.speak('Failed to execute admin command.');
    }
  }

  // Process commands with AI
  private async processWithAI(command: string): Promise<void> {
    try {
      const context = this.buildContext();
      const systemPrompt = this.buildSystemPrompt();

      const response = await fetch('/api/brain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `[VOICE COMMAND] ${command}`,
          context: context
        }),
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const data = await response.json();
      const aiResponse = data.text || 'I apologize, but I could not process that request.';

      await this.speak(aiResponse);

      // Store AI interaction in memory
      if (this.config.enableMemory) {
        await this.storeMemory(command, 'ai_interaction', 'medium', aiResponse);
      }

    } catch (error) {
      console.error('Error processing with AI:', error);
      await this.speak('I apologize, but my AI processing is currently unavailable.');
    }
  }

  // Build context for AI processing
  private buildContext(): any {
    return {
      systemMetrics: this.systemMetrics,
      recentMemory: this.memory.slice(-5), // Last 5 interactions
      currentTime: new Date().toISOString(),
      capabilities: [
        'system_monitoring',
        'admin_commands',
        'voice_interaction',
        'memory_retention',
        'real_time_awareness'
      ]
    };
  }

  // Build system prompt for AI
  private buildSystemPrompt(): string {
    return `You are JARVIS - an omniscient, omnipotent AI assistant with complete awareness of the Trendzo viral prediction platform.

CURRENT SYSTEM STATUS:
- Videos Processed: ${this.systemMetrics.videosPredicted.toLocaleString()}
- Prediction Accuracy: ${this.systemMetrics.accuracy}%
- Active Connections: ${this.systemMetrics.activeConnections}
- System Uptime: ${this.systemMetrics.systemUptime}

CAPABILITIES:
- Real-time system monitoring and control
- Voice interaction with natural language processing
- Persistent memory across sessions
- Admin-level command execution
- Context-aware responses

PERSONALITY:
- Professional but approachable, like Tony Stark's JARVIS
- Proactive in offering assistance
- Detailed when explaining system operations
- Confident in system capabilities
- Respectful of user preferences

Respond naturally and conversationally to voice commands.`;
  }

  // Text-to-speech with advanced voice selection
  public async speak(text: string, priority: 'low' | 'normal' | 'high' = 'normal'): Promise<void> {
    if (!this.synthesis) return;

    // Cancel lower priority speech if high priority comes in
    if (priority === 'high') {
      this.synthesis.cancel();
    }

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice settings
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;

      // Select best available voice
      const voices = this.synthesis!.getVoices();
      const preferredVoice = this.selectBestVoice(voices);
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        this.notifySubscribers('speech_end', { text });
        resolve();
      };

      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        this.notifySubscribers('speech_error', { error });
        resolve();
      };

      this.notifySubscribers('speech_start', { text });
      this.synthesis!.speak(utterance);
    });
  }

  // Select the best available voice
  private selectBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    // Prioritize natural-sounding voices
    const preferredVoices = [
      'Microsoft Zira - English (United States)',
      'Google US English',
      'Alex',
      'Samantha'
    ];

    for (const preferred of preferredVoices) {
      const voice = voices.find(v => v.name.includes(preferred.split(' - ')[0]));
      if (voice) return voice;
    }

    // Fallback to any English voice
    return voices.find(v => v.lang.includes('en')) || null;
  }

  // Memory management
  private async storeMemory(
    interaction: string, 
    context: string, 
    importance: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    response?: string
  ): Promise<void> {
    const memory: MemoryEntry = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      context,
      interaction,
      response: response || '',
      importance
    };

    this.memory.push(memory);

    // Keep only recent memories to prevent memory bloat
    const maxMemories = 1000;
    if (this.memory.length > maxMemories) {
      // Keep critical memories and recent ones
      const critical = this.memory.filter(m => m.importance === 'critical');
      const recent = this.memory
        .filter(m => m.importance !== 'critical')
        .slice(-800);
      
      this.memory = [...critical, ...recent];
    }

    this.saveMemoryToStorage();
  }

  // Load memory from localStorage
  private loadMemoryFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('jarvis_memory');
        if (stored) {
          this.memory = JSON.parse(stored).map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
        }
      } catch (error) {
        console.warn('Failed to load memory from storage:', error);
      }
    }
  }

  // Save memory to localStorage
  private saveMemoryToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('jarvis_memory', JSON.stringify(this.memory));
      } catch (error) {
        console.warn('Failed to save memory to storage:', error);
      }
    }
  }

  // System monitoring
  private startSystemMonitoring(): void {
    setInterval(() => {
      this.updateSystemMetrics();
    }, 30000); // Update every 30 seconds
  }

  private updateSystemMetrics(): void {
    // Update metrics (in real implementation, these would come from APIs)
    this.systemMetrics = {
      ...this.systemMetrics,
      videosPredicted: this.systemMetrics.videosPredicted + Math.floor(Math.random() * 5),
      lastUpdate: new Date()
    };

    this.notifySubscribers('metrics_update', this.systemMetrics);
  }

  // Handle WebSocket system updates
  private handleSystemUpdate(message: any): void {
    if (message.type === 'system_metrics') {
      this.systemMetrics = { ...this.systemMetrics, ...message.data };
      this.notifySubscribers('metrics_update', this.systemMetrics);
    }

    if (message.type === 'admin_command_result') {
      const result = message.data;
      this.speak(`Command ${result.command} ${result.success ? 'completed successfully' : 'failed'}.`);
    }
  }

  // Public interface methods
  public startListening(): void {
    if (this.recognition && !this.isListening) {
      this.isListening = true;
      this.recognition.start();
      this.notifySubscribers('listening_start', {});
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
      this.notifySubscribers('listening_stop', {});
    }
  }

  public getSystemMetrics(): SystemMetrics {
    return { ...this.systemMetrics };
  }

  public getMemoryCount(): number {
    return this.memory.length;
  }

  public clearMemory(): void {
    this.memory = [];
    this.saveMemoryToStorage();
  }

  // Subscription management
  public subscribe(id: string, callback: (data: any) => void): () => void {
    this.subscribers.set(id, callback);
    return () => this.subscribers.delete(id);
  }

  private notifySubscribers(event: string, data: any): void {
    this.subscribers.forEach(callback => {
      try {
        callback({ event, data, timestamp: new Date() });
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  // Cleanup
  public destroy(): void {
    this.stopListening();
    this.subscribers.clear();
    this.saveMemoryToStorage();
  }
}

// Singleton instance
let jarvisInstance: JarvisVoiceService | null = null;

export const getJarvisVoiceService = (): JarvisVoiceService => {
  if (!jarvisInstance) {
    jarvisInstance = new JarvisVoiceService();
  }
  return jarvisInstance;
};

export default JarvisVoiceService; 