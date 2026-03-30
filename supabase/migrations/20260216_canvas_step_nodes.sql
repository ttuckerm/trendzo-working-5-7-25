-- Canvas Step Nodes: parent-child hierarchy for workflow steps
-- Allows step nodes to be first-class canvas_nodes with a parent relationship

-- 1. Parent-child relationship
ALTER TABLE canvas_nodes
ADD COLUMN IF NOT EXISTS parent_node_id UUID REFERENCES canvas_nodes(id) ON DELETE CASCADE;

-- 2. Step ordering (no-op: step_number INT NOT NULL already exists)
ALTER TABLE canvas_nodes
ADD COLUMN IF NOT EXISTS step_number INTEGER;

-- 3. Structured step data
ALTER TABLE canvas_nodes
ADD COLUMN IF NOT EXISTS step_data JSONB;

-- 4. Partial index for parent lookups
CREATE INDEX IF NOT EXISTS idx_canvas_nodes_parent
ON canvas_nodes(parent_node_id)
WHERE parent_node_id IS NOT NULL;

-- 5. Column documentation
COMMENT ON COLUMN canvas_nodes.parent_node_id IS 'Self-referencing FK — when set, this node is a workflow step child of the referenced feature node';
COMMENT ON COLUMN canvas_nodes.step_data IS 'Structured step fields: user_action, system_action, success_state, error_states, api_called';
