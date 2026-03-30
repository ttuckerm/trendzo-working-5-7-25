-- Migration: Canvas Database Schema
-- Description: Creates tables for the Canvas visual specification tool.
-- Canvas lets solo founders map screens, actions, logic, and AI nodes
-- into a visual flow, then drill into each node for full spec detail.
-- This is Prompt 1 of 5 — persistence layer only.

-- ============================================================================
-- TABLE: canvas_projects (root — owns everything)
-- ============================================================================

CREATE TABLE IF NOT EXISTS canvas_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    template_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canvas_projects_user_id ON canvas_projects(user_id);

-- ============================================================================
-- TABLE: canvas_nodes (child of projects)
-- ============================================================================

CREATE TABLE IF NOT EXISTS canvas_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES canvas_projects(id) ON DELETE CASCADE,
    node_type TEXT NOT NULL CHECK (node_type IN ('screen', 'action', 'logic', 'ai')),
    step_number INT NOT NULL,
    title TEXT,
    description TEXT,
    x FLOAT,
    y FLOAT,
    fidelity TEXT CHECK (fidelity IN ('concept', 'wireframe', 'mockup', 'build-ready')) DEFAULT 'concept',
    priority INT CHECK (priority >= 0 AND priority <= 3) DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canvas_nodes_project_id ON canvas_nodes(project_id);

-- ============================================================================
-- TABLE: canvas_node_steps (child of nodes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS canvas_node_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES canvas_nodes(id) ON DELETE CASCADE,
    sort_order INT NOT NULL,
    title TEXT,
    user_action TEXT,
    system_action TEXT,
    success_state TEXT,
    error_states TEXT,
    api_called TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canvas_node_steps_node_id ON canvas_node_steps(node_id);

-- ============================================================================
-- TABLE: canvas_node_apis (child of nodes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS canvas_node_apis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES canvas_nodes(id) ON DELETE CASCADE,
    method TEXT CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')) DEFAULT 'POST',
    endpoint TEXT,
    purpose TEXT,
    request_shape TEXT,
    response_shape TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canvas_node_apis_node_id ON canvas_node_apis(node_id);

-- ============================================================================
-- TABLE: canvas_node_acceptance (child of nodes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS canvas_node_acceptance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES canvas_nodes(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    done BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canvas_node_acceptance_node_id ON canvas_node_acceptance(node_id);

-- ============================================================================
-- TABLE: canvas_connections (child of projects, references nodes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS canvas_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES canvas_projects(id) ON DELETE CASCADE,
    from_node_id UUID NOT NULL REFERENCES canvas_nodes(id) ON DELETE CASCADE,
    to_node_id UUID NOT NULL REFERENCES canvas_nodes(id) ON DELETE CASCADE,
    label TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canvas_connections_project_id ON canvas_connections(project_id);

-- ============================================================================
-- TABLE: canvas_node_dependencies (self-referencing node relationship)
-- ============================================================================

CREATE TABLE IF NOT EXISTS canvas_node_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES canvas_nodes(id) ON DELETE CASCADE,
    depends_on_node_id UUID NOT NULL REFERENCES canvas_nodes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(node_id, depends_on_node_id)
);

CREATE INDEX IF NOT EXISTS idx_canvas_node_dependencies_node_id ON canvas_node_dependencies(node_id);

-- ============================================================================
-- TABLE: canvas_chat_messages (child of nodes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS canvas_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES canvas_nodes(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canvas_chat_messages_node_id ON canvas_chat_messages(node_id);

-- ============================================================================
-- TRIGGERS: Auto-update updated_at timestamp
-- Reuses update_updated_at_column() from 20260127_content_strategies.sql
-- ============================================================================

DROP TRIGGER IF EXISTS update_canvas_projects_updated_at ON canvas_projects;
CREATE TRIGGER update_canvas_projects_updated_at
    BEFORE UPDATE ON canvas_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_canvas_nodes_updated_at ON canvas_nodes;
CREATE TRIGGER update_canvas_nodes_updated_at
    BEFORE UPDATE ON canvas_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE canvas_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_node_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_node_apis ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_node_acceptance ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_node_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_chat_messages ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- canvas_projects — direct ownership: auth.uid() = user_id
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own canvas projects" ON canvas_projects;
CREATE POLICY "Users can view own canvas projects"
    ON canvas_projects
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own canvas projects" ON canvas_projects;
CREATE POLICY "Users can create own canvas projects"
    ON canvas_projects
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own canvas projects" ON canvas_projects;
CREATE POLICY "Users can update own canvas projects"
    ON canvas_projects
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own canvas projects" ON canvas_projects;
CREATE POLICY "Users can delete own canvas projects"
    ON canvas_projects
    FOR DELETE
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- canvas_nodes — 1 join via project_id
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own canvas nodes" ON canvas_nodes;
CREATE POLICY "Users can view own canvas nodes"
    ON canvas_nodes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM canvas_projects
            WHERE canvas_projects.id = canvas_nodes.project_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create own canvas nodes" ON canvas_nodes;
CREATE POLICY "Users can create own canvas nodes"
    ON canvas_nodes
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM canvas_projects
            WHERE canvas_projects.id = canvas_nodes.project_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own canvas nodes" ON canvas_nodes;
CREATE POLICY "Users can update own canvas nodes"
    ON canvas_nodes
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM canvas_projects
            WHERE canvas_projects.id = canvas_nodes.project_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own canvas nodes" ON canvas_nodes;
CREATE POLICY "Users can delete own canvas nodes"
    ON canvas_nodes
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM canvas_projects
            WHERE canvas_projects.id = canvas_nodes.project_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

-- --------------------------------------------------------------------------
-- canvas_connections — 1 join via project_id
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own canvas connections" ON canvas_connections;
CREATE POLICY "Users can view own canvas connections"
    ON canvas_connections
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM canvas_projects
            WHERE canvas_projects.id = canvas_connections.project_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create own canvas connections" ON canvas_connections;
CREATE POLICY "Users can create own canvas connections"
    ON canvas_connections
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM canvas_projects
            WHERE canvas_projects.id = canvas_connections.project_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own canvas connections" ON canvas_connections;
CREATE POLICY "Users can update own canvas connections"
    ON canvas_connections
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM canvas_projects
            WHERE canvas_projects.id = canvas_connections.project_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own canvas connections" ON canvas_connections;
CREATE POLICY "Users can delete own canvas connections"
    ON canvas_connections
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM canvas_projects
            WHERE canvas_projects.id = canvas_connections.project_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

-- --------------------------------------------------------------------------
-- canvas_node_steps — 2 joins via node_id → project_id
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own canvas node steps" ON canvas_node_steps;
CREATE POLICY "Users can view own canvas node steps"
    ON canvas_node_steps
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM canvas_nodes
            JOIN canvas_projects ON canvas_projects.id = canvas_nodes.project_id
            WHERE canvas_nodes.id = canvas_node_steps.node_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create own canvas node steps" ON canvas_node_steps;
CREATE POLICY "Users can create own canvas node steps"
    ON canvas_node_steps
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM canvas_nodes
            JOIN canvas_projects ON canvas_projects.id = canvas_nodes.project_id
            WHERE canvas_nodes.id = canvas_node_steps.node_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own canvas node steps" ON canvas_node_steps;
CREATE POLICY "Users can update own canvas node steps"
    ON canvas_node_steps
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM canvas_nodes
            JOIN canvas_projects ON canvas_projects.id = canvas_nodes.project_id
            WHERE canvas_nodes.id = canvas_node_steps.node_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own canvas node steps" ON canvas_node_steps;
CREATE POLICY "Users can delete own canvas node steps"
    ON canvas_node_steps
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM canvas_nodes
            JOIN canvas_projects ON canvas_projects.id = canvas_nodes.project_id
            WHERE canvas_nodes.id = canvas_node_steps.node_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

-- --------------------------------------------------------------------------
-- canvas_node_apis — 2 joins via node_id → project_id
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own canvas node apis" ON canvas_node_apis;
CREATE POLICY "Users can view own canvas node apis"
    ON canvas_node_apis
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM canvas_nodes
            JOIN canvas_projects ON canvas_projects.id = canvas_nodes.project_id
            WHERE canvas_nodes.id = canvas_node_apis.node_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create own canvas node apis" ON canvas_node_apis;
CREATE POLICY "Users can create own canvas node apis"
    ON canvas_node_apis
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM canvas_nodes
            JOIN canvas_projects ON canvas_projects.id = canvas_nodes.project_id
            WHERE canvas_nodes.id = canvas_node_apis.node_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own canvas node apis" ON canvas_node_apis;
CREATE POLICY "Users can update own canvas node apis"
    ON canvas_node_apis
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM canvas_nodes
            JOIN canvas_projects ON canvas_projects.id = canvas_nodes.project_id
            WHERE canvas_nodes.id = canvas_node_apis.node_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own canvas node apis" ON canvas_node_apis;
CREATE POLICY "Users can delete own canvas node apis"
    ON canvas_node_apis
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM canvas_nodes
            JOIN canvas_projects ON canvas_projects.id = canvas_nodes.project_id
            WHERE canvas_nodes.id = canvas_node_apis.node_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

-- --------------------------------------------------------------------------
-- canvas_node_acceptance — 2 joins via node_id → project_id
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own canvas node acceptance" ON canvas_node_acceptance;
CREATE POLICY "Users can view own canvas node acceptance"
    ON canvas_node_acceptance
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM canvas_nodes
            JOIN canvas_projects ON canvas_projects.id = canvas_nodes.project_id
            WHERE canvas_nodes.id = canvas_node_acceptance.node_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create own canvas node acceptance" ON canvas_node_acceptance;
CREATE POLICY "Users can create own canvas node acceptance"
    ON canvas_node_acceptance
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM canvas_nodes
            JOIN canvas_projects ON canvas_projects.id = canvas_nodes.project_id
            WHERE canvas_nodes.id = canvas_node_acceptance.node_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own canvas node acceptance" ON canvas_node_acceptance;
CREATE POLICY "Users can update own canvas node acceptance"
    ON canvas_node_acceptance
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM canvas_nodes
            JOIN canvas_projects ON canvas_projects.id = canvas_nodes.project_id
            WHERE canvas_nodes.id = canvas_node_acceptance.node_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own canvas node acceptance" ON canvas_node_acceptance;
CREATE POLICY "Users can delete own canvas node acceptance"
    ON canvas_node_acceptance
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM canvas_nodes
            JOIN canvas_projects ON canvas_projects.id = canvas_nodes.project_id
            WHERE canvas_nodes.id = canvas_node_acceptance.node_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

-- --------------------------------------------------------------------------
-- canvas_node_dependencies — 2 joins via node_id → project_id
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own canvas node dependencies" ON canvas_node_dependencies;
CREATE POLICY "Users can view own canvas node dependencies"
    ON canvas_node_dependencies
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM canvas_nodes
            JOIN canvas_projects ON canvas_projects.id = canvas_nodes.project_id
            WHERE canvas_nodes.id = canvas_node_dependencies.node_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create own canvas node dependencies" ON canvas_node_dependencies;
CREATE POLICY "Users can create own canvas node dependencies"
    ON canvas_node_dependencies
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM canvas_nodes
            JOIN canvas_projects ON canvas_projects.id = canvas_nodes.project_id
            WHERE canvas_nodes.id = canvas_node_dependencies.node_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own canvas node dependencies" ON canvas_node_dependencies;
CREATE POLICY "Users can update own canvas node dependencies"
    ON canvas_node_dependencies
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM canvas_nodes
            JOIN canvas_projects ON canvas_projects.id = canvas_nodes.project_id
            WHERE canvas_nodes.id = canvas_node_dependencies.node_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own canvas node dependencies" ON canvas_node_dependencies;
CREATE POLICY "Users can delete own canvas node dependencies"
    ON canvas_node_dependencies
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM canvas_nodes
            JOIN canvas_projects ON canvas_projects.id = canvas_nodes.project_id
            WHERE canvas_nodes.id = canvas_node_dependencies.node_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

-- --------------------------------------------------------------------------
-- canvas_chat_messages — 2 joins via node_id → project_id
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own canvas chat messages" ON canvas_chat_messages;
CREATE POLICY "Users can view own canvas chat messages"
    ON canvas_chat_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM canvas_nodes
            JOIN canvas_projects ON canvas_projects.id = canvas_nodes.project_id
            WHERE canvas_nodes.id = canvas_chat_messages.node_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create own canvas chat messages" ON canvas_chat_messages;
CREATE POLICY "Users can create own canvas chat messages"
    ON canvas_chat_messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM canvas_nodes
            JOIN canvas_projects ON canvas_projects.id = canvas_nodes.project_id
            WHERE canvas_nodes.id = canvas_chat_messages.node_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own canvas chat messages" ON canvas_chat_messages;
CREATE POLICY "Users can update own canvas chat messages"
    ON canvas_chat_messages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM canvas_nodes
            JOIN canvas_projects ON canvas_projects.id = canvas_nodes.project_id
            WHERE canvas_nodes.id = canvas_chat_messages.node_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own canvas chat messages" ON canvas_chat_messages;
CREATE POLICY "Users can delete own canvas chat messages"
    ON canvas_chat_messages
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM canvas_nodes
            JOIN canvas_projects ON canvas_projects.id = canvas_nodes.project_id
            WHERE canvas_nodes.id = canvas_chat_messages.node_id
            AND canvas_projects.user_id = auth.uid()
        )
    );

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE canvas_projects IS 'Root table for Canvas spec projects. Each project owns all nodes, connections, and child data.';
COMMENT ON TABLE canvas_nodes IS 'Visual nodes on the canvas — screens, actions, logic gates, or AI steps.';
COMMENT ON TABLE canvas_node_steps IS 'Ordered interaction steps within a node (user action → system response flow).';
COMMENT ON TABLE canvas_node_apis IS 'API endpoints referenced by a node, with method, shape, and purpose.';
COMMENT ON TABLE canvas_node_acceptance IS 'Acceptance criteria checklist items for a node.';
COMMENT ON TABLE canvas_connections IS 'Directed edges between nodes on the canvas, with optional label.';
COMMENT ON TABLE canvas_node_dependencies IS 'Build-order dependencies between nodes (node X depends on node Y).';
COMMENT ON TABLE canvas_chat_messages IS 'Per-node AI chat history for spec refinement conversations.';
