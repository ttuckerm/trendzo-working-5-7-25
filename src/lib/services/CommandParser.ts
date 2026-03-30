import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export interface ParsedCommand {
  intent: string;
  action: string;
  target?: string;
  parameters?: Record<string, any>;
  confidence: number;
  needsConfirmation: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
}

export interface CommandContext {
  pageName: string;
  route: string;
  visibleData: any;
  activeElements: string[];
  systemState: any;
}

export class CommandParser {
  private static instance: CommandParser;
  
  // Intent patterns for conversational programming
  private intentPatterns = {
    analytics: {
      patterns: [
        /how (?:did|is|are) template[s]?\s*(?:#?(\d+))?\s*perform/i,
        /show (?:me )?(?:the )?performance (?:of )?template[s]?\s*(?:#?(\d+))?/i,
        /what(?:'s| is) the (?:engagement|performance|score) (?:of|for) template[s]?\s*(?:#?(\d+))?/i,
        /(?:template|engagement|viral) (?:stats|metrics|data)/i
      ],
      action: 'analytics',
      riskLevel: 'low' as const
    },
    
    updateRules: {
      patterns: [
        /(?:change|update|set|adjust) (?:the )?viral threshold to (\d+(?:\.\d+)?)/i,
        /(?:increase|decrease|lower|raise) (?:the )?viral (?:threshold|score) (?:to )?(\d+(?:\.\d+)?)/i,
        /set (?:the )?minimum (?:engagement|score) (?:to )?(\d+(?:\.\d+)?)/i
      ],
      action: 'update_rule',
      riskLevel: 'medium' as const
    },
    
    runPipeline: {
      patterns: [
        /run (?:the )?(?:full )?(?:macro|pipeline)/i,
        /start (?:the )?(?:macro|pipeline) (?:run|process)/i,
        /execute (?:the )?(?:full )?(?:pipeline|macro)/i,
        /trigger (?:a )?(?:macro|pipeline) run/i
      ],
      action: 'macro_track',
      riskLevel: 'high' as const
    },
    
    moduleControl: {
      patterns: [
        /(?:start|run|execute) (?:the )?(\w+) module/i,
        /(?:stop|pause|halt) (?:the )?(\w+) module/i,
        /restart (?:the )?(\w+) module/i
      ],
      action: 'module',
      riskLevel: 'medium' as const
    },
    
    templateAnalysis: {
      patterns: [
        /analyze template[s]?\s*(?:#?(\d+))?/i,
        /what makes template[s]?\s*(?:#?(\d+))? viral/i,
        /(?:explain|describe) template[s]?\s*(?:#?(\d+))?/i
      ],
      action: 'analytics',
      riskLevel: 'low' as const
    },
    
    systemStatus: {
      patterns: [
        /(?:what(?:'s| is)|show (?:me )?(?:the )?) (?:system )?status/i,
        /how (?:is|are) (?:the )?(?:system|modules|pipeline)/i,
        /(?:system|pipeline|module) (?:health|status|overview)/i
      ],
      action: 'status',
      riskLevel: 'low' as const
    }
  };

  static getInstance(): CommandParser {
    if (!CommandParser.instance) {
      CommandParser.instance = new CommandParser();
    }
    return CommandParser.instance;
  }

  async parseCommand(message: string, context?: CommandContext): Promise<ParsedCommand> {
    const normalizedMessage = message.toLowerCase().trim();
    
    // Try to match against intent patterns
    for (const [intentName, intentConfig] of Object.entries(this.intentPatterns)) {
      for (const pattern of intentConfig.patterns) {
        const match = normalizedMessage.match(pattern);
        if (match) {
          return this.buildParsedCommand(
            intentName,
            intentConfig.action,
            match,
            intentConfig.riskLevel,
            message,
            context
          );
        }
      }
    }

    // If no specific pattern matches, try contextual parsing
    return this.parseContextualCommand(message, context);
  }

  private buildParsedCommand(
    intent: string,
    action: string,
    match: RegExpMatchArray,
    riskLevel: 'low' | 'medium' | 'high',
    originalMessage: string,
    context?: CommandContext
  ): ParsedCommand {
    const parameters: Record<string, any> = {};
    let target = '';
    let description = '';

    switch (intent) {
      case 'analytics':
        if (match[1]) {
          parameters.template_id = match[1];
          target = `template_${match[1]}`;
          description = `Analyze performance of Template #${match[1]}`;
        } else {
          target = 'overview';
          description = 'Show overall analytics overview';
        }
        parameters.timeframe = this.extractTimeframe(originalMessage) || '7d';
        break;

      case 'updateRules':
        if (match[1]) {
          parameters.new_value = parseFloat(match[1]);
          parameters.rule_type = 'viral_threshold';
          target = 'viral_threshold';
          description = `Update viral threshold to ${parameters.new_value}`;
        }
        break;

      case 'runPipeline':
        target = 'macro';
        description = 'Execute full macro pipeline run';
        break;

      case 'moduleControl':
        if (match[1]) {
          target = match[1].toLowerCase();
          const action = this.extractModuleAction(originalMessage);
          parameters.module_action = action;
          description = `${action.charAt(0).toUpperCase() + action.slice(1)} ${target} module`;
        }
        break;

      case 'systemStatus':
        target = 'all';
        description = 'Show system status overview';
        break;
    }

    return {
      intent,
      action,
      target,
      parameters,
      confidence: this.calculateConfidence(intent, originalMessage),
      needsConfirmation: riskLevel === 'high' || this.requiresConfirmation(parameters),
      riskLevel,
      description
    };
  }

  private parseContextualCommand(message: string, context?: CommandContext): ParsedCommand {
    // Fallback contextual parsing based on current page/context
    if (context) {
      if (context.route.includes('template') && message.includes('performance')) {
        return {
          intent: 'contextual_analytics',
          action: 'analytics',
          target: 'current_page',
          parameters: { context_based: true },
          confidence: 0.6,
          needsConfirmation: false,
          riskLevel: 'low',
          description: 'Show analytics for current context'
        };
      }
      
      if (context.route.includes('pipeline') && message.includes('run')) {
        return {
          intent: 'contextual_pipeline',
          action: 'run',
          target: 'context_pipeline',
          parameters: { context_based: true },
          confidence: 0.5,
          needsConfirmation: true,
          riskLevel: 'medium',
          description: 'Execute pipeline operation based on current context'
        };
      }
    }

    // Default response for unrecognized commands
    return {
      intent: 'unknown',
      action: 'clarify',
      parameters: { original_message: message },
      confidence: 0.3,
      needsConfirmation: false,
      riskLevel: 'low',
      description: 'Request clarification for unrecognized command'
    };
  }

  private extractTimeframe(message: string): string | null {
    const timePatterns = [
      { pattern: /last (\d+) days?/i, format: (match: string[]) => `${match[1]}d` },
      { pattern: /past (\d+) weeks?/i, format: (match: string[]) => `${parseInt(match[1]) * 7}d` },
      { pattern: /yesterday/i, format: () => '1d' },
      { pattern: /last week/i, format: () => '7d' },
      { pattern: /last month/i, format: () => '30d' }
    ];

    for (const { pattern, format } of timePatterns) {
      const match = message.match(pattern);
      if (match) {
        return format(match);
      }
    }
    return null;
  }

  private extractModuleAction(message: string): string {
    if (/start|run|execute/.test(message)) return 'run';
    if (/stop|pause|halt/.test(message)) return 'stop';
    if (/restart/.test(message)) return 'restart';
    return 'run';
  }

  private calculateConfidence(intent: string, message: string): number {
    // Simple confidence calculation based on pattern matching
    const baseConfidence = {
      analytics: 0.8,
      updateRules: 0.9,
      runPipeline: 0.85,
      moduleControl: 0.8,
      systemStatus: 0.75,
      unknown: 0.3
    };

    let confidence = baseConfidence[intent as keyof typeof baseConfidence] || 0.3;
    
    // Boost confidence for specific keywords
    const boostKeywords = ['template', 'viral', 'pipeline', 'module', 'performance'];
    const keywordCount = boostKeywords.filter(keyword => 
      message.toLowerCase().includes(keyword)
    ).length;
    
    confidence += keywordCount * 0.05;
    
    return Math.min(confidence, 1.0);
  }

  private requiresConfirmation(parameters: Record<string, any>): boolean {
    // Require confirmation for certain parameter values
    if (parameters.new_value && (parameters.new_value < 0.1 || parameters.new_value > 1.0)) {
      return true;
    }
    
    if (parameters.module_action === 'stop') {
      return true;
    }
    
    return false;
  }

  // Validate commands against current system state
  async validateCommand(parsedCommand: ParsedCommand): Promise<{ valid: boolean; reason?: string }> {
    try {
      switch (parsedCommand.action) {
        case 'update_rule':
          if (parsedCommand.parameters?.new_value) {
            const value = parsedCommand.parameters.new_value;
            if (value < 0 || value > 1) {
              return { valid: false, reason: 'Threshold value must be between 0 and 1' };
            }
          }
          break;

        case 'module':
          if (parsedCommand.target) {
            // Check if module exists and is in valid state for the action
            const validModules = ['apify-scraper', 'viral-filter', 'template-generator', 'evolution-engine'];
            if (!validModules.includes(parsedCommand.target)) {
              return { valid: false, reason: `Unknown module: ${parsedCommand.target}` };
            }
          }
          break;

        case 'analytics':
          if (parsedCommand.parameters?.template_id) {
            // Validate template exists (simplified check)
            const templateId = parsedCommand.parameters.template_id;
            if (isNaN(parseInt(templateId))) {
              return { valid: false, reason: 'Invalid template ID format' };
            }
          }
          break;
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, reason: 'Validation error occurred' };
    }
  }
}