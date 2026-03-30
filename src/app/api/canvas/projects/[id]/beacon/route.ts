import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resolveCanvasAuth } from '../../../_lib/auth';

/**
 * POST /api/canvas/projects/[id]/beacon
 *
 * Same logic as the PUT save handler but accepts POST so that
 * navigator.sendBeacon() (which only supports POST) can flush
 * unsaved state on tab close / visibility-hidden.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const anonClient = await createServerSupabaseClient();
    const { userId, supabase, errorResponse } = await resolveCanvasAuth(anonClient);
    if (errorResponse) return errorResponse;

    let ownerQuery = supabase
      .from('canvas_projects')
      .select('id')
      .eq('id', id);
    if (userId) ownerQuery = ownerQuery.eq('user_id', userId);
    const { error: projectError } = await ownerQuery.single();

    if (projectError) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const { nodes: incomingNodes = [], connections: incomingConnections = [], chats: incomingChats = {} } = body;

    const { data: existingNodes } = await supabase
      .from('canvas_nodes')
      .select('id')
      .eq('project_id', id);

    const existingNodeIds = (existingNodes || []).map((n: any) => n.id);
    const incomingNodeIds = incomingNodes.map((n: any) => n.id).filter(Boolean);

    const nodesToDelete = existingNodeIds.filter((eid: string) => !incomingNodeIds.includes(eid));
    if (nodesToDelete.length > 0) {
      await supabase.from('canvas_nodes').delete().in('id', nodesToDelete);
    }

    for (const node of incomingNodes) {
      const { steps = [], apis = [], acceptance = [], dependencies = [], ...nodeData } = node;

      await supabase
        .from('canvas_nodes')
        .upsert({
          id: nodeData.id,
          project_id: id,
          node_type: nodeData.node_type,
          step_number: nodeData.step_number ?? 0,
          title: nodeData.title || null,
          description: nodeData.description || null,
          x: nodeData.x ?? 0,
          y: nodeData.y ?? 0,
          fidelity: nodeData.fidelity || 'concept',
          priority: nodeData.priority ?? 1,
          notes: nodeData.notes || null,
          parent_node_id: nodeData.parent_node_id || null,
          step_data: nodeData.step_data || null,
        }, { onConflict: 'id' });

      await supabase.from('canvas_node_steps').delete().eq('node_id', nodeData.id);
      if (steps.length > 0) {
        await supabase.from('canvas_node_steps').insert(
          steps.map((s: any, i: number) => ({
            node_id: nodeData.id,
            sort_order: s.sort_order ?? i,
            title: s.title || null,
            user_action: s.user_action || null,
            system_action: s.system_action || null,
            success_state: s.success_state || null,
            error_states: s.error_states || null,
            api_called: s.api_called || null,
          }))
        );
      }

      await supabase.from('canvas_node_apis').delete().eq('node_id', nodeData.id);
      if (apis.length > 0) {
        await supabase.from('canvas_node_apis').insert(
          apis.map((a: any) => ({
            node_id: nodeData.id,
            method: a.method || 'POST',
            endpoint: a.endpoint || null,
            purpose: a.purpose || null,
            request_shape: a.request_shape || null,
            response_shape: a.response_shape || null,
          }))
        );
      }

      await supabase.from('canvas_node_acceptance').delete().eq('node_id', nodeData.id);
      if (acceptance.length > 0) {
        await supabase.from('canvas_node_acceptance').insert(
          acceptance.map((a: any, i: number) => ({
            node_id: nodeData.id,
            text: a.text,
            done: a.done ?? false,
            sort_order: a.sort_order ?? i,
          }))
        );
      }
    }

    await supabase.from('canvas_connections').delete().eq('project_id', id);
    if (incomingConnections.length > 0) {
      await supabase.from('canvas_connections').insert(
        incomingConnections.map((c: any) => ({
          project_id: id,
          from_node_id: c.from_node_id,
          to_node_id: c.to_node_id,
          label: c.label ?? '',
        }))
      );
    }

    // Chat messages: delete-and-reinsert per node
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;
    for (const [nodeId, messages] of Object.entries(incomingChats as Record<string, any[]>)) {
      if (!UUID_RE.test(nodeId) || !Array.isArray(messages)) continue;
      const { error: chatDelErr } = await supabase.from('canvas_chat_messages').delete().eq('node_id', nodeId);
      if (chatDelErr) {
        console.error('[canvas beacon] chat delete error:', chatDelErr.message);
        continue;
      }
      if (messages.length > 0) {
        const baseTime = Date.now();
        const { error: chatErr } = await supabase.from('canvas_chat_messages').insert(
          messages.map((m: any, i: number) => ({
            node_id: nodeId,
            role: m.role,
            content: m.content,
            created_at: new Date(baseTime + i).toISOString(),
          }))
        );
        if (chatErr) {
          console.error('[canvas beacon] chat insert error:', chatErr.message);
        }
      }
    }

    await supabase
      .from('canvas_projects')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/canvas/projects/[id]/beacon error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
