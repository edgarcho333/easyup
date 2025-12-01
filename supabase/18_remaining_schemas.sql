-- =============================================
-- REMAINING SCHEMAS: Time, Analytics, Budget, Workflows
-- =============================================

-- =============================================
-- TIME LOGS
-- =============================================

CREATE TABLE IF NOT EXISTS time_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_organization_id ON time_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_project_id ON time_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_start_time ON time_logs(start_time DESC);

-- =============================================
-- ACTIVITY LOGS
-- =============================================

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_organization_id ON activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- =============================================
-- PROJECT BUDGETS
-- =============================================

CREATE TABLE IF NOT EXISTS project_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
    total_budget NUMERIC NOT NULL DEFAULT 0,
    budget_spent NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    start_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_budgets_project_id ON project_budgets(project_id);

-- =============================================
-- POST CAMPAIGNS
-- =============================================

CREATE TABLE IF NOT EXISTS post_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    campaign_name TEXT NOT NULL,
    platforms TEXT[] NOT NULL DEFAULT '{}',
    budget_allocated NUMERIC NOT NULL DEFAULT 0,
    budget_spent NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'paused', 'completed')),
    start_date DATE NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_campaigns_project_id ON post_campaigns(project_id);
CREATE INDEX IF NOT EXISTS idx_post_campaigns_status ON post_campaigns(status);

-- =============================================
-- CAMPAIGN METRICS
-- =============================================

CREATE TABLE IF NOT EXISTS campaign_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_campaign_id UUID NOT NULL REFERENCES post_campaigns(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    date DATE NOT NULL,
    impressions INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    spend NUMERIC NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    conversion_value NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_id ON campaign_metrics(post_campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_date ON campaign_metrics(date);

-- =============================================
-- WORKFLOWS
-- =============================================

CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('status_change', 'priority_change', 'task_created')),
    trigger_value TEXT,
    action_type TEXT NOT NULL CHECK (action_type IN ('assign_user', 'change_status', 'post_comment')),
    action_value TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflows_project_id ON workflows(project_id);
CREATE INDEX IF NOT EXISTS idx_workflows_is_enabled ON workflows(is_enabled);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- Time Logs: Users can see their own logs
CREATE POLICY "Users can view their own time logs"
    ON time_logs FOR SELECT
    USING (user_id = auth.uid());

-- Time Logs: Org members can see org logs
CREATE POLICY "Org members can view organization time logs"
    ON time_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.organization_id = time_logs.organization_id
            AND uo.user_id = auth.uid()
            AND uo.status = 'active'
        )
    );

-- Time Logs: Users can create their own logs
CREATE POLICY "Users can create their own time logs"
    ON time_logs FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Time Logs: Users can update their own logs
CREATE POLICY "Users can update their own time logs"
    ON time_logs FOR UPDATE
    USING (user_id = auth.uid());

-- Activity Logs: Org members can view
CREATE POLICY "Org members can view activity logs"
    ON activity_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_organizations uo
            WHERE uo.organization_id = activity_logs.organization_id
            AND uo.user_id = auth.uid()
            AND uo.status = 'active'
        )
    );

-- Activity Logs: Authenticated users can insert
CREATE POLICY "Authenticated users can create activity logs"
    ON activity_logs FOR INSERT
    WITH CHECK (true);

-- Budgets: Project members can view
CREATE POLICY "Project members can view budgets"
    ON project_budgets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = project_budgets.project_id
            AND pm.user_id = auth.uid()
        )
    );

-- Budgets: Project members can manage
CREATE POLICY "Project members can manage budgets"
    ON project_budgets FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = project_budgets.project_id
            AND pm.user_id = auth.uid()
        )
    );

-- Campaigns: Project members can view
CREATE POLICY "Project members can view campaigns"
    ON post_campaigns FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = post_campaigns.project_id
            AND pm.user_id = auth.uid()
        )
    );

-- Campaigns: Project members can manage
CREATE POLICY "Project members can manage campaigns"
    ON post_campaigns FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = post_campaigns.project_id
            AND pm.user_id = auth.uid()
        )
    );

-- Campaign Metrics: Follow campaign access
CREATE POLICY "Users can view campaign metrics"
    ON campaign_metrics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM post_campaigns pc
            JOIN project_members pm ON pm.project_id = pc.project_id
            WHERE pc.id = campaign_metrics.post_campaign_id
            AND pm.user_id = auth.uid()
        )
    );

-- Campaign Metrics: Project members can add
CREATE POLICY "Project members can add campaign metrics"
    ON campaign_metrics FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM post_campaigns pc
            JOIN project_members pm ON pm.project_id = pc.project_id
            WHERE pc.id = campaign_metrics.post_campaign_id
            AND pm.user_id = auth.uid()
        )
    );

-- Workflows: Project members can view
CREATE POLICY "Project members can view workflows"
    ON workflows FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = workflows.project_id
            AND pm.user_id = auth.uid()
        )
    );

-- Workflows: Project members can manage
CREATE POLICY "Project members can manage workflows"
    ON workflows FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = workflows.project_id
            AND pm.user_id = auth.uid()
        )
    );
