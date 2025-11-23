import { mockDb } from '../lib/mockDb';
import { ProjectBudget, PostCampaign, CampaignMetric } from '../types';

export const budgetService = {
  async getProjectBudget(projectId: string): Promise<ProjectBudget | null> {
    return mockDb.find('project_budgets', (b: any) => b.project_id === projectId) || null;
  },

  async setProjectBudget(projectId: string, budget: Partial<ProjectBudget>): Promise<ProjectBudget> {
    const existing = mockDb.find('project_budgets', (b: any) => b.project_id === projectId);
    if (existing) {
        return mockDb.update('project_budgets', existing.id, budget) as ProjectBudget;
    } else {
        return mockDb.insert('project_budgets', { project_id: projectId, ...budget });
    }
  },

  async getCampaigns(projectId: string): Promise<PostCampaign[]> {
    return mockDb.filter('post_campaigns', (c: any) => c.project_id === projectId)
        .sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  },

  async createCampaign(campaign: Partial<PostCampaign>): Promise<PostCampaign> {
    return mockDb.insert('post_campaigns', campaign);
  },

  async updateCampaign(id: string, updates: Partial<PostCampaign>): Promise<void> {
    mockDb.update('post_campaigns', id, updates);
  },

  async toggleCampaignStatus(id: string, status: 'active' | 'paused' | 'completed'): Promise<void> {
    mockDb.update('post_campaigns', id, { status });
  },

  async deleteCampaign(id: string): Promise<void> {
    mockDb.delete('post_campaigns', id);
  },

  async getCampaignMetrics(campaignId: string): Promise<CampaignMetric[]> {
    return mockDb.filter('campaign_metrics', (m: any) => m.post_campaign_id === campaignId)
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  async getProjectMetrics(projectId: string): Promise<CampaignMetric[]> {
    const campaigns = mockDb.filter('post_campaigns', (c: any) => c.project_id === projectId);
    const campaignIds = campaigns.map((c: any) => c.id);
    return mockDb.filter('campaign_metrics', (m: any) => campaignIds.includes(m.post_campaign_id))
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  async addMetrics(metrics: Partial<CampaignMetric>): Promise<void> {
    mockDb.insert('campaign_metrics', metrics);
    
    // Update totals in mock DB
    const campaign: any = mockDb.find('post_campaigns', (c: any) => c.id === metrics.post_campaign_id);
    if (campaign && metrics.spend) {
        const newSpent = (campaign.budget_spent || 0) + metrics.spend;
        mockDb.update('post_campaigns', campaign.id, { budget_spent: newSpent });
        
        const budget: any = mockDb.find('project_budgets', (b: any) => b.project_id === campaign.project_id);
        if (budget) {
            mockDb.update('project_budgets', budget.id, { budget_spent: (budget.budget_spent || 0) + metrics.spend });
        }
    }
  }
};