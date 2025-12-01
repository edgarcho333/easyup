import { supabase } from '../lib/supabase';
import { ProjectBudget, PostCampaign, CampaignMetric } from '../types';

export const budgetService = {
  async getProjectBudget(projectId: string): Promise<ProjectBudget | null> {
    const { data, error } = await supabase
      .from('project_budgets')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as ProjectBudget;
  },

  async setProjectBudget(projectId: string, budget: Partial<ProjectBudget>): Promise<ProjectBudget> {
    // Check if budget exists
    const existing = await this.getProjectBudget(projectId);

    if (existing) {
      const { data, error } = await supabase
        .from('project_budgets')
        .update(budget)
        .eq('id', existing.id)
        .select()
        .single();

      if (error || !data) {
        throw new Error('Failed to update budget');
      }

      return data as ProjectBudget;
    } else {
      const { data, error } = await supabase
        .from('project_budgets')
        .insert({ project_id: projectId, ...budget })
        .select()
        .single();

      if (error || !data) {
        throw new Error('Failed to create budget');
      }

      return data as ProjectBudget;
    }
  },

  async getCampaigns(projectId: string): Promise<PostCampaign[]> {
    const { data, error } = await supabase
      .from('post_campaigns')
      .select('*')
      .eq('project_id', projectId)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
      return [];
    }

    return (data || []) as PostCampaign[];
  },

  async createCampaign(campaign: Partial<PostCampaign>): Promise<PostCampaign> {
    const { data, error } = await supabase
      .from('post_campaigns')
      .insert(campaign)
      .select()
      .single();

    if (error || !data) {
      throw new Error('Failed to create campaign');
    }

    return data as PostCampaign;
  },

  async updateCampaign(id: string, updates: Partial<PostCampaign>): Promise<void> {
    const { error } = await supabase
      .from('post_campaigns')
      .update(updates)
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  async toggleCampaignStatus(id: string, status: 'active' | 'paused' | 'completed'): Promise<void> {
    const { error } = await supabase
      .from('post_campaigns')
      .update({ status })
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  async deleteCampaign(id: string): Promise<void> {
    const { error } = await supabase
      .from('post_campaigns')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  async getCampaignMetrics(campaignId: string): Promise<CampaignMetric[]> {
    const { data, error } = await supabase
      .from('campaign_metrics')
      .select('*')
      .eq('post_campaign_id', campaignId)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching campaign metrics:', error);
      return [];
    }

    return (data || []) as CampaignMetric[];
  },

  async getProjectMetrics(projectId: string): Promise<CampaignMetric[]> {
    // Get all campaigns for project
    const { data: campaigns } = await supabase
      .from('post_campaigns')
      .select('id')
      .eq('project_id', projectId);

    const campaignIds = campaigns?.map(c => c.id) || [];

    if (campaignIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('campaign_metrics')
      .select('*')
      .in('post_campaign_id', campaignIds)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching project metrics:', error);
      return [];
    }

    return (data || []) as CampaignMetric[];
  },

  async addMetrics(metrics: Partial<CampaignMetric>): Promise<void> {
    const { error } = await supabase
      .from('campaign_metrics')
      .insert(metrics);

    if (error) {
      throw error;
    }

    // Update campaign spent amount
    if (metrics.post_campaign_id && metrics.spend) {
      const { data: campaign } = await supabase
        .from('post_campaigns')
        .select('budget_spent, project_id')
        .eq('id', metrics.post_campaign_id)
        .single();

      if (campaign) {
        const newSpent = (campaign.budget_spent || 0) + metrics.spend;
        await supabase
          .from('post_campaigns')
          .update({ budget_spent: newSpent })
          .eq('id', metrics.post_campaign_id);

        // Update project budget spent
        const { data: budget } = await supabase
          .from('project_budgets')
          .select('id, budget_spent')
          .eq('project_id', campaign.project_id)
          .single();

        if (budget) {
          await supabase
            .from('project_budgets')
            .update({ budget_spent: (budget.budget_spent || 0) + metrics.spend })
            .eq('id', budget.id);
        }
      }
    }
  }
};
