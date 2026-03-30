import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resolveCanvasAuth } from '../../_lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { getCanvasSystemPrompt } from '@/lib/canvas/ai-system-prompt';
import { getRelevantFiles } from '@/lib/canvas/knowledge/file-reader';

/**
 * Canvas AI Chat Route
 *
 * LLM Providers: Anthropic, OpenAI
 * Models: Configurable via request body (provider + modelId)
 * Default: Anthropic claude-sonnet-4-20250514
 * API Key Env Vars: ANTHROPIC_API_KEY, OPENAI_API_KEY
 * System Prompt Source: src/lib/canvas/ai-system-prompt.ts
 * Knowledge Base Source: frameworks-and-research/POC Research & Framework Data/
 */
export async function POST(request: NextRequest) {
  try {
    const anonClient = await createServerSupabaseClient();
    const { supabase, errorResponse } = await resolveCanvasAuth(anonClient);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const {
      projectId,
      nodeId,
      message,
      history = [],
      nodeContext,
      provider = 'anthropic',
      modelId = 'claude-sonnet-4-6',
      maxTokens = 16000,
    } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Fetch project template_type for knowledge context scoping
    let templateType: string | undefined;
    if (projectId) {
      try {
        const { data: project } = await supabase
          .from('canvas_projects')
          .select('template_type')
          .eq('id', projectId)
          .single();
        templateType = project?.template_type ?? undefined;
      } catch (err) {
        console.warn('[canvas AI] Failed to fetch project template_type:', err);
      }
    }

    // Type and fidelity label maps
    const TYPE_LABELS: Record<string, string> = {
      screen: 'Screen / Page',
      action: 'Action / Process',
      logic: 'Logic / Decision',
      ai: 'AI / ML Feature',
      acceptance_tests: 'Acceptance Tests',
    };

    const FIDELITY_META: Record<string, { label: string; description: string }> = {
      concept: { label: 'Concept', description: 'Brainstorm features, define scope and purpose' },
      wireframe: { label: 'Wireframe', description: 'Define workflow steps and user interactions' },
      mockup: { label: 'Mockup', description: 'Add API contracts and technical details' },
      'build-ready': { label: 'Build Ready', description: 'Complete acceptance criteria and verify spec' },
    };

    // Build context block from nodeContext
    let contextBlock = '';
    if (nodeContext) {
      const isStepNode = !!nodeContext.parent_node_id;

      if (isStepNode) {
        // --- Step node context: fetch parent + siblings from DB ---
        let parentNode: any = null;
        let siblingSteps: any[] = [];

        try {
          const { data: parent } = await supabase
            .from('canvas_nodes')
            .select('*')
            .eq('id', nodeContext.parent_node_id)
            .single();
          parentNode = parent;

          if (parentNode) {
            const { data: siblings } = await supabase
              .from('canvas_nodes')
              .select('id, title, step_number')
              .eq('parent_node_id', nodeContext.parent_node_id)
              .order('step_number', { ascending: true });
            siblingSteps = siblings || [];
          }
        } catch (err) {
          console.warn('[canvas AI] Failed to fetch step node parent/siblings:', err);
        }

        const stepData = nodeContext.step_data || {};
        const lines = [
          `\n\nCURRENT NODE CONTEXT (Step Node):`,
        ];

        if (parentNode) {
          const parentFidelity = FIDELITY_META[parentNode.fidelity]?.label || parentNode.fidelity;
          lines.push(`Feature: ${parentNode.title || 'Untitled'} (${TYPE_LABELS[parentNode.node_type] || parentNode.node_type}, ${parentFidelity})`);
        }

        lines.push(
          `Current Step: Step ${nodeContext.step_number ?? '?'} — ${nodeContext.title || 'Untitled'}`,
          `Step Data:`,
          `  User Action: ${stepData.user_action || 'Not defined'}`,
          `  System Action: ${stepData.system_action || 'Not defined'}`,
          `  Success State: ${stepData.success_state || 'Not defined'}`,
          `  Error States: ${stepData.error_states || 'Not defined'}`,
          `  API Called: ${stepData.api_called || 'Not defined'}`,
        );

        if (siblingSteps.length > 0) {
          lines.push(``, `Other Steps in Workflow:`);
          for (const s of siblingSteps) {
            const marker = s.id === nodeContext.id ? ' ← current' : '';
            lines.push(`${s.step_number}. ${s.title || 'Untitled'}${marker}`);
          }
        }

        contextBlock = lines.join('\n');
      } else {
        // --- Feature node context (original logic) ---
        const fidelity = nodeContext.fidelity || 'concept';
        const fidelityMeta = FIDELITY_META[fidelity] || FIDELITY_META.concept;
        const deps = nodeContext.dependencies && nodeContext.dependencies.length > 0
          ? nodeContext.dependencies.join(', ')
          : 'None';
        const lines = [
          `\n\nCURRENT NODE CONTEXT:`,
          `Feature: ${nodeContext.title || 'Not yet defined'}`,
          `Type: ${TYPE_LABELS[nodeContext.node_type] || 'Not yet defined'}`,
          `Fidelity: ${fidelityMeta.label} — ${fidelityMeta.description}`,
          `Priority: P${nodeContext.priority ?? 1}`,
          `Description: ${nodeContext.description || 'Not yet defined'}`,
          `Workflow Steps: ${nodeContext.stepCount ?? 0} defined`,
          `API Endpoints: ${nodeContext.apiCount ?? 0} defined`,
          `Acceptance Criteria: ${nodeContext.acceptanceDone ?? 0}/${nodeContext.acceptanceTotal ?? 0} complete`,
          `Dependencies: ${deps}`,
          `Notes: ${nodeContext.notes || 'Not yet defined'}`,
        ];

        // Check for step node children of this feature
        if (nodeId) {
          try {
            const { data: stepChildren } = await supabase
              .from('canvas_nodes')
              .select('title, step_number, step_data')
              .eq('parent_node_id', nodeId)
              .order('step_number', { ascending: true });

            if (stepChildren && stepChildren.length > 0) {
              lines.push(``, `Workflow Steps (${stepChildren.length}):`);
              for (const s of stepChildren) {
                const sd = (s.step_data as any) || {};
                lines.push(`${s.step_number}. ${s.title || 'Untitled'} — User Action: ${sd.user_action || 'Not defined'}`);
              }
            }
          } catch (err) {
            console.warn('[canvas AI] Failed to fetch step children:', err);
          }
        }

        contextBlock = lines.join('\n');
      }
    }

    // Truncate history to last 10 messages
    const truncatedHistory = history.slice(-10).map((msg: any) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Add current user message
    const messages = [
      ...truncatedHistory,
      { role: 'user' as const, content: message.trim() },
    ];

    // Extract search terms from the last user message for on-demand file lookup
    const searchTerms = extractSearchTerms(message.trim());

    let relevantFiles = '';
    if (searchTerms.length > 0) {
      try {
        relevantFiles = getRelevantFiles(searchTerms, 5, 20_000);
        if (relevantFiles) {
          console.log(
            `[canvas/chat] Loaded ${relevantFiles.length} chars of relevant source files for terms:`,
            searchTerms
          );
        }
      } catch (err) {
        console.warn('[canvas/chat] Failed to load relevant files:', err);
      }
    }

    const basePrompt = getCanvasSystemPrompt(templateType) + contextBlock;
    const fullPrompt = relevantFiles
      ? `${basePrompt}\n\n${relevantFiles}`
      : basePrompt;

    console.log(
      `[canvas/chat] Provider: ${provider} | Model: ${modelId} | System prompt size: ${fullPrompt.length} chars (~${Math.round(fullPrompt.length / 4)} tokens)`
    );

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    let assistantText: string;
    try {
      if (provider === 'openai') {
        // --- OpenAI ---
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        // o-series reasoning models use different parameters
        const isReasoningModel = /^o[0-9]/.test(modelId);

        const openaiMessages = [
          // o-series models use 'developer' role instead of 'system'
          { role: (isReasoningModel ? 'developer' : 'system') as any, content: fullPrompt },
          ...messages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ];

        const openaiParams: any = {
          model: modelId,
          messages: openaiMessages,
        };

        if (isReasoningModel) {
          openaiParams.max_completion_tokens = maxTokens;
        } else {
          openaiParams.max_tokens = maxTokens;
        }

        const response = await openai.chat.completions.create(
          openaiParams,
          { signal: controller.signal }
        );

        assistantText = response.choices[0]?.message?.content ?? '';

        if (!assistantText) {
          console.warn('[Canvas AI] Empty response from OpenAI. finish_reason:', response.choices[0]?.finish_reason);
        }
      } else {
        // --- Anthropic (default) ---
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        const response = await anthropic.messages.create(
          {
            model: modelId,
            max_tokens: maxTokens,
            system: fullPrompt,
            messages,
          },
          { signal: controller.signal }
        );

        assistantText = response.content[0]?.type === 'text'
          ? response.content[0].text
          : '';

        if (!assistantText) {
          console.warn('[Canvas AI] Empty response from Anthropic. stop_reason:', response.stop_reason);
        }
      }
    } catch (aiError: any) {
      console.error(`[Canvas AI] ${provider} API error:`, {
        message: aiError?.message,
        status: aiError?.status,
        type: aiError?.type,
        error: aiError?.error,
      });
      const detail = aiError?.message || 'Unknown error';
      return NextResponse.json(
        { error: 'AI response failed', details: detail },
        { status: 503 }
      );
    } finally {
      clearTimeout(timeout);
    }

    // Parse structured mutations from AI response
    const mutationRegex = /<canvas_mutations>\s*([\s\S]*?)\s*<\/canvas_mutations>/g;
    const mutations: Record<string, unknown>[] = [];
    let match;
    while ((match = mutationRegex.exec(assistantText)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed)) {
          mutations.push(...parsed);
        } else {
          mutations.push(parsed);
        }
      } catch (parseErr) {
        console.warn('[canvas AI] Malformed mutation JSON, skipping:', match[1]?.slice(0, 200), parseErr);
      }
    }

    // Strip mutation blocks from the prose the user sees
    const proseText = assistantText.replace(/<canvas_mutations>\s*[\s\S]*?\s*<\/canvas_mutations>/g, '').trim();


    // Best-effort server-side save (primary persistence is via auto-save PUT)
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;
    if (nodeId && UUID_RE.test(nodeId)) {
      const chatRows = [
        { node_id: nodeId, role: 'user', content: message.trim() },
        { node_id: nodeId, role: 'assistant', content: proseText },
      ];
      const { error: chatError } = await supabase
        .from('canvas_chat_messages')
        .insert(chatRows);

      if (chatError) {
        console.warn('[canvas AI] Chat save skipped (node may not be persisted yet):', chatError.message);
      }
    }

    return NextResponse.json({ message: proseText, mutations });
  } catch (error) {
    console.error('POST /api/canvas/ai/chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'i', 'you', 'we', 'they',
  'it', 'he', 'she', 'this', 'that', 'these', 'those', 'my', 'your',
  'our', 'what', 'how', 'why', 'when', 'where', 'which', 'who',
  'to', 'from', 'in', 'on', 'at', 'for', 'with', 'about', 'of',
  'and', 'or', 'but', 'not', 'if', 'then', 'so', 'just', 'want',
  'need', 'like', 'make', 'build', 'create', 'add', 'fix', 'update',
  'me', 'please', 'help', 'think', 'know', 'work', 'feature',
]);

function extractSearchTerms(message: string): string[] {
  return message
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    .slice(0, 8);
}
