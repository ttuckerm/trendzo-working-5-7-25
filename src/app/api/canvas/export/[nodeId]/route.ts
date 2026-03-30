import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const NODE_TYPE_LABELS: Record<string, string> = {
  screen: 'Screen / Page',
  action: 'Action / Process',
  logic: 'Logic / Decision',
  ai: 'AI / ML Feature',
};

/**
 * POST /api/canvas/export/[nodeId]
 * Export a node as a structured brief for handoff to Claude Code
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params;
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch node with ownership join
    const { data: node, error: nodeError } = await supabase
      .from('canvas_nodes')
      .select('*, canvas_projects!inner(user_id)')
      .eq('id', nodeId)
      .single();

    if (nodeError) {
      if (nodeError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Node not found' }, { status: 404 });
      }
      console.error('Error fetching canvas node:', nodeError);
      return NextResponse.json({ error: 'Failed to fetch node' }, { status: 500 });
    }

    // Verify ownership
    if (node.canvas_projects.user_id !== user.id) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 });
    }

    // Parallel fetch: steps, apis, acceptance, dependencies
    const [stepsResult, apisResult, acceptanceResult, depsResult] = await Promise.all([
      supabase.from('canvas_node_steps').select('*').eq('node_id', nodeId).order('sort_order', { ascending: true }),
      supabase.from('canvas_node_apis').select('*').eq('node_id', nodeId),
      supabase.from('canvas_node_acceptance').select('*').eq('node_id', nodeId).order('sort_order', { ascending: true }),
      supabase.from('canvas_node_dependencies').select('*, canvas_nodes!canvas_node_dependencies_depends_on_node_id_fkey(title)').eq('node_id', nodeId),
    ]);

    const steps = stepsResult.data || [];
    const apis = apisResult.data || [];
    const acceptance = acceptanceResult.data || [];
    const dependencies = depsResult.data || [];

    // Build brief in spec format
    const lines: string[] = [];

    lines.push(`TASK: ${node.title || 'Untitled'}`);
    lines.push(`TYPE: ${NODE_TYPE_LABELS[node.node_type] || node.node_type}`);
    lines.push(`PRIORITY: P${node.priority ?? 1}`);
    lines.push(`SPEC: ${node.description || 'None'}`);
    lines.push(`NOTES: ${node.notes || 'None'}`);

    // Workflow steps
    lines.push('');
    lines.push('WORKFLOW STEPS:');
    if (steps.length === 0) {
      lines.push('None defined');
    } else {
      steps.forEach((step, i) => {
        lines.push(`${i + 1}. ${step.title || 'Untitled step'}`);
        lines.push(`   User Action: ${step.user_action || 'N/A'}`);
        lines.push(`   System Action: ${step.system_action || 'N/A'}`);
        lines.push(`   Success: ${step.success_state || 'N/A'}`);
        lines.push(`   Errors: ${step.error_states || 'N/A'}`);
        lines.push(`   API: ${step.api_called || 'N/A'}`);
      });
    }

    // API endpoints
    lines.push('');
    lines.push('API ENDPOINTS:');
    if (apis.length === 0) {
      lines.push('None defined');
    } else {
      apis.forEach(api => {
        lines.push(`- ${api.method} ${api.endpoint || '/unknown'} — ${api.purpose || 'N/A'}`);
        lines.push(`  Request: ${api.request_shape || 'N/A'}`);
        lines.push(`  Response: ${api.response_shape || 'N/A'}`);
      });
    }

    // Dependencies
    lines.push('');
    lines.push('DEPENDENCIES:');
    if (dependencies.length === 0) {
      lines.push('None defined');
    } else {
      dependencies.forEach(dep => {
        const depTitle = dep.canvas_nodes?.title || dep.depends_on_node_id;
        lines.push(`- ${depTitle}`);
      });
    }

    // Acceptance criteria
    lines.push('');
    lines.push('ACCEPTANCE CRITERIA:');
    if (acceptance.length === 0) {
      lines.push('None defined');
    } else {
      acceptance.forEach(criterion => {
        const check = criterion.done ? '[x]' : '[ ]';
        lines.push(`${check} ${criterion.text}`);
      });
    }

    lines.push('');
    lines.push('DO NOT claim done without: test output, screenshots/logs, sample requests/responses');

    const brief = lines.join('\n');

    return NextResponse.json({ brief });
  } catch (error) {
    console.error('POST /api/canvas/export/[nodeId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
