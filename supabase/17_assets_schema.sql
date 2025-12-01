-- =============================================
-- ASSETS SCHEMA (Idea Assets, Reviews, Annotations)
-- =============================================

-- Idea Assets table
CREATE TABLE IF NOT EXISTS idea_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    version_number INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'changes_requested')),
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Asset Reviews table
CREATE TABLE IF NOT EXISTS asset_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES idea_assets(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'changes_requested')),
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Asset Annotations table (for visual feedback)
CREATE TABLE IF NOT EXISTS asset_annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES idea_assets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    x NUMERIC NOT NULL,
    y NUMERIC NOT NULL,
    comment TEXT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_idea_assets_idea_id ON idea_assets(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_assets_uploaded_by ON idea_assets(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_idea_assets_version ON idea_assets(idea_id, version_number DESC);

CREATE INDEX IF NOT EXISTS idx_asset_reviews_asset_id ON asset_reviews(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_reviews_reviewer_id ON asset_reviews(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_asset_annotations_asset_id ON asset_annotations(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_annotations_user_id ON asset_annotations(user_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE idea_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_annotations ENABLE ROW LEVEL SECURITY;

-- Assets: Project members can view assets
CREATE POLICY "Project members can view assets"
    ON idea_assets FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM ideas i
            JOIN project_members pm ON pm.project_id = i.project_id
            WHERE i.id = idea_assets.idea_id
            AND pm.user_id = auth.uid()
        )
    );

-- Assets: Project members can upload assets
CREATE POLICY "Project members can upload assets"
    ON idea_assets FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM ideas i
            JOIN project_members pm ON pm.project_id = i.project_id
            WHERE i.id = idea_assets.idea_id
            AND pm.user_id = auth.uid()
        )
    );

-- Assets: Uploaders can update their assets
CREATE POLICY "Uploaders can update their assets"
    ON idea_assets FOR UPDATE
    USING (uploaded_by = auth.uid());

-- Reviews: Project members can view reviews
CREATE POLICY "Project members can view reviews"
    ON asset_reviews FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM idea_assets ia
            JOIN ideas i ON i.id = ia.idea_id
            JOIN project_members pm ON pm.project_id = i.project_id
            WHERE ia.id = asset_reviews.asset_id
            AND pm.user_id = auth.uid()
        )
    );

-- Reviews: Project members can create reviews
CREATE POLICY "Project members can create reviews"
    ON asset_reviews FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM idea_assets ia
            JOIN ideas i ON i.id = ia.idea_id
            JOIN project_members pm ON pm.project_id = i.project_id
            WHERE ia.id = asset_reviews.asset_id
            AND pm.user_id = auth.uid()
        )
    );

-- Annotations: Project members can view annotations
CREATE POLICY "Project members can view annotations"
    ON asset_annotations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM idea_assets ia
            JOIN ideas i ON i.id = ia.idea_id
            JOIN project_members pm ON pm.project_id = i.project_id
            WHERE ia.id = asset_annotations.asset_id
            AND pm.user_id = auth.uid()
        )
    );

-- Annotations: Project members can create annotations
CREATE POLICY "Project members can create annotations"
    ON asset_annotations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM idea_assets ia
            JOIN ideas i ON i.id = ia.idea_id
            JOIN project_members pm ON pm.project_id = i.project_id
            WHERE ia.id = asset_annotations.asset_id
            AND pm.user_id = auth.uid()
        )
    );

-- Annotations: Users can update their own annotations
CREATE POLICY "Users can update their own annotations"
    ON asset_annotations FOR UPDATE
    USING (user_id = auth.uid());

-- Annotations: Users can delete their own annotations
CREATE POLICY "Users can delete their own annotations"
    ON asset_annotations FOR DELETE
    USING (user_id = auth.uid());

-- =============================================
-- STORAGE BUCKET FOR ASSETS
-- =============================================
-- Note: Run this in Supabase Dashboard or via SQL Editor:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('idea-assets', 'idea-assets', true);
