-- Fix: canvas_nodes node_type CHECK constraint is missing 'step' and 'acceptance_tests'
-- The step nodes feature (20260216_canvas_step_nodes.sql) added parent_node_id and step_data
-- but never updated the CHECK constraint. This causes all saves containing step-type nodes
-- to fail with a constraint violation error.

ALTER TABLE canvas_nodes
DROP CONSTRAINT IF EXISTS canvas_nodes_node_type_check;

ALTER TABLE canvas_nodes
ADD CONSTRAINT canvas_nodes_node_type_check
CHECK (node_type IN ('screen', 'action', 'logic', 'ai', 'step', 'acceptance_tests'));
