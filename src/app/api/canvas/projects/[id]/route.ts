import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resolveCanvasAuth } from '../../_lib/auth';

/** Group an array of objects by a key, returning { [keyValue]: items[] } */
function groupBy<T extends Record<string, any>>(items: T[], key: string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const k = item[key];
    if (!result[k]) result[k] = [];
    result[k].push(item);
  }
  return result;
}

/**
 * GET /api/canvas/projects/[id]
 * Full load of a project with all nested data (avoids N+1)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const anonClient = await createServerSupabaseClient();
    const { userId, supabase, errorResponse } = await resolveCanvasAuth(anonClient);
    if (errorResponse) return errorResponse;

    // 1. Fetch project (with ownership check when authenticated)
    let projectQuery = supabase
      .from('canvas_projects')
      .select('*')
      .eq('id', id);
    if (userId) projectQuery = projectQuery.eq('user_id', userId);
    const { data: project, error: projectError } = await projectQuery.single();

    if (projectError) {
      if (projectError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      console.error('Error fetching canvas project:', projectError);
      return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
    }

    // 2. Fetch all nodes for the project
    const { data: nodes, error: nodesError } = await supabase
      .from('canvas_nodes')
      .select('*')
      .eq('project_id', id)
      .order('step_number', { ascending: true });

    if (nodesError) {
      console.error('Error fetching canvas nodes:', nodesError);
      return NextResponse.json({ error: 'Failed to fetch nodes' }, { status: 500 });
    }

    const nodeIds = (nodes || []).map(n => n.id);

    // 3. If no nodes, return early with empty arrays
    if (nodeIds.length === 0) {
      return NextResponse.json({
        project,
        nodes: [],
        connections: [],
        chats: {},
      });
    }

    // 4. Parallel fetch all child data
    const [stepsResult, apisResult, acceptanceResult, dependenciesResult, chatsResult, connectionsResult] = await Promise.all([
      supabase.from('canvas_node_steps').select('*').in('node_id', nodeIds).order('sort_order', { ascending: true }),
      supabase.from('canvas_node_apis').select('*').in('node_id', nodeIds),
      supabase.from('canvas_node_acceptance').select('*').in('node_id', nodeIds).order('sort_order', { ascending: true }),
      supabase.from('canvas_node_dependencies').select('*').in('node_id', nodeIds),
      supabase.from('canvas_chat_messages').select('*').in('node_id', nodeIds).order('created_at', { ascending: true }),
      supabase.from('canvas_connections').select('*').eq('project_id', id),
    ]);

    for (const result of [stepsResult, apisResult, acceptanceResult, dependenciesResult, chatsResult, connectionsResult]) {
      if (result.error) {
        console.error('Error fetching canvas child data:', result.error);
        return NextResponse.json({ error: 'Failed to fetch project data' }, { status: 500 });
      }
    }

    // 5. Group children by node_id
    const stepsByNode = groupBy(stepsResult.data || [], 'node_id');
    const apisByNode = groupBy(apisResult.data || [], 'node_id');
    const acceptanceByNode = groupBy(acceptanceResult.data || [], 'node_id');
    const dependenciesByNode = groupBy(dependenciesResult.data || [], 'node_id');
    const chatsByNode = groupBy(chatsResult.data || [], 'node_id');

    // 6. Nest children under each node
    const enrichedNodes = (nodes || []).map(node => ({
      ...node,
      steps: stepsByNode[node.id] || [],
      apis: apisByNode[node.id] || [],
      acceptance: acceptanceByNode[node.id] || [],
      dependencies: dependenciesByNode[node.id] || [],
    }));

    return NextResponse.json({
      project,
      nodes: enrichedNodes,
      connections: connectionsResult.data || [],
      chats: chatsByNode,
    }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache' },
    });
  } catch (error) {
    console.error('GET /api/canvas/projects/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/canvas/projects/[id]
 * Auto-save: upsert nodes + children, delete-and-reinsert connections
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const anonClient = await createServerSupabaseClient();
    const { userId, supabase, errorResponse } = await resolveCanvasAuth(anonClient);
    if (errorResponse) return errorResponse;

    // Verify project exists (with ownership check when authenticated)
    let ownerQuery = supabase
      .from('canvas_projects')
      .select('id')
      .eq('id', id);
    if (userId) ownerQuery = ownerQuery.eq('user_id', userId);
    const { data: project, error: projectError } = await ownerQuery.single();

    if (projectError) {
      if (projectError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      console.error('[canvas PUT] ownership check error:', projectError);
      return NextResponse.json({ error: 'Failed to verify project' }, { status: 500 });
    }

    const body = await request.json();
    const { nodes: incomingNodes = [], connections: incomingConnections = [], chats: incomingChats = {} } = body;

    // Get existing node IDs from DB
    const { data: existingNodes } = await supabase
      .from('canvas_nodes')
      .select('id')
      .eq('project_id', id);

    const existingNodeIds = (existingNodes || []).map((n: any) => n.id);
    const incomingNodeIds = incomingNodes.map((n: any) => n.id).filter(Boolean);

    // Delete nodes that are no longer present (cascade handles children)
    const nodesToDelete = existingNodeIds.filter((eid: string) => !incomingNodeIds.includes(eid));
    if (nodesToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('canvas_nodes')
        .delete()
        .in('id', nodesToDelete);

      if (deleteError) {
        console.error('[canvas PUT] delete nodes error:', deleteError);
        return NextResponse.json({ error: 'Failed to save project', details: deleteError.message }, { status: 500 });
      }
    }

    // Upsert each node and re-insert children
    for (const node of incomingNodes) {
      const { steps = [], apis = [], acceptance = [], dependencies = [], ...nodeData } = node;

      const { error: upsertError } = await supabase
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

      if (upsertError) {
        console.error('[canvas PUT] upsert node error:', {
          nodeId: nodeData.id,
          nodeType: nodeData.node_type,
          message: upsertError.message,
          code: upsertError.code,
          details: upsertError.details,
          hint: upsertError.hint,
        });
        return NextResponse.json({
          error: 'Failed to save node',
          details: `${upsertError.message} (node_type: ${nodeData.node_type}, id: ${nodeData.id})`,
        }, { status: 500 });
      }

      // Steps
      await supabase.from('canvas_node_steps').delete().eq('node_id', nodeData.id);
      if (steps.length > 0) {
        const { error: stepsError } = await supabase
          .from('canvas_node_steps')
          .insert(steps.map((s: any, i: number) => ({
            node_id: nodeData.id,
            sort_order: s.sort_order ?? i,
            title: s.title || null,
            user_action: s.user_action || null,
            system_action: s.system_action || null,
            success_state: s.success_state || null,
            error_states: s.error_states || null,
            api_called: s.api_called || null,
          })));
        if (stepsError) console.error('[canvas PUT] steps insert error:', stepsError.message);
      }

      // APIs
      await supabase.from('canvas_node_apis').delete().eq('node_id', nodeData.id);
      if (apis.length > 0) {
        const { error: apisError } = await supabase
          .from('canvas_node_apis')
          .insert(apis.map((a: any) => ({
            node_id: nodeData.id,
            method: a.method || 'POST',
            endpoint: a.endpoint || null,
            purpose: a.purpose || null,
            request_shape: a.request_shape || null,
            response_shape: a.response_shape || null,
          })));
        if (apisError) console.error('[canvas PUT] apis insert error:', apisError.message);
      }

      // Acceptance criteria
      await supabase.from('canvas_node_acceptance').delete().eq('node_id', nodeData.id);
      if (acceptance.length > 0) {
        const { error: acceptanceError } = await supabase
          .from('canvas_node_acceptance')
          .insert(acceptance.map((a: any, i: number) => ({
            node_id: nodeData.id,
            text: a.text,
            done: a.done ?? false,
            sort_order: a.sort_order ?? i,
          })));
        if (acceptanceError) console.error('[canvas PUT] acceptance insert error:', acceptanceError.message);
      }
    }

    // Connections: delete all for project, re-insert
    await supabase.from('canvas_connections').delete().eq('project_id', id);
    if (incomingConnections.length > 0) {
      const { error: connError } = await supabase
        .from('canvas_connections')
        .insert(incomingConnections.map((c: any) => ({
          project_id: id,
          from_node_id: c.from_node_id,
          to_node_id: c.to_node_id,
          label: c.label ?? '',
        })));
      if (connError) {
        console.error('[canvas PUT] connections insert error:', connError.message);
      }
    }

    // Chat messages: delete-and-reinsert per node (same pattern as steps/apis/acceptance)
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;
    for (const [nodeId, messages] of Object.entries(incomingChats as Record<string, any[]>)) {
      if (!UUID_RE.test(nodeId) || !Array.isArray(messages)) continue;
      const { error: chatDelErr } = await supabase.from('canvas_chat_messages').delete().eq('node_id', nodeId);
      if (chatDelErr) {
        console.error('[canvas PUT] chat delete error:', chatDelErr.message);
        return NextResponse.json({ error: 'Failed to save chat messages', details: chatDelErr.message }, { status: 500 });
      }
      if (messages.length > 0) {
        const baseTime = Date.now();
        const { error: chatErr } = await supabase
          .from('canvas_chat_messages')
          .insert(messages.map((m: any, i: number) => ({
            node_id: nodeId,
            role: m.role,
            content: m.content,
            created_at: new Date(baseTime + i).toISOString(),
          })));
        if (chatErr) {
          console.error('[canvas PUT] chat insert error:', chatErr.message);
          return NextResponse.json({ error: 'Failed to save chat messages', details: chatErr.message }, { status: 500 });
        }
      }
    }

    // Touch updated_at
    const { data: updated, error: touchError } = await supabase
      .from('canvas_projects')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('updated_at')
      .single();

    if (touchError) {
      console.error('[canvas PUT] touch updated_at error:', touchError.message);
    }

    return NextResponse.json({
      success: true,
      updated_at: updated?.updated_at || new Date().toISOString(),
    });
  } catch (error) {
    console.error('PUT /api/canvas/projects/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/canvas/projects/[id]
 * Update project metadata (title, description)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const anonClient = await createServerSupabaseClient();
    const { userId, supabase, errorResponse } = await resolveCanvasAuth(anonClient);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.title === 'string' && body.title.trim()) {
      updates.title = body.title.trim();
    }
    if (typeof body.description === 'string') {
      updates.description = body.description.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    let patchQuery = supabase
      .from('canvas_projects')
      .update(updates)
      .eq('id', id);
    if (userId) patchQuery = patchQuery.eq('user_id', userId);
    const { data: project, error } = await patchQuery.select('id, title, updated_at').single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      console.error('Error patching canvas project:', error);
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('PATCH /api/canvas/projects/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/canvas/projects/[id]
 * Delete a canvas project (cascade handles all children)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const anonClient = await createServerSupabaseClient();
    const { userId, supabase, errorResponse } = await resolveCanvasAuth(anonClient);
    if (errorResponse) return errorResponse;

    let deleteQuery = supabase
      .from('canvas_projects')
      .delete()
      .eq('id', id);
    if (userId) deleteQuery = deleteQuery.eq('user_id', userId);
    const { error } = await deleteQuery;

    if (error) {
      console.error('Error deleting canvas project:', error);
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/canvas/projects/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
