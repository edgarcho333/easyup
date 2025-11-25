
import { mockDb } from '../lib/mockDb';
import { Workflow } from '../types';

export const workflowService = {
  async getProjectWorkflows(projectId: string): Promise<Workflow[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));
    return mockDb.filter('workflows', (w: any) => w.project_id === projectId);
  },

  async createWorkflow(workflowData: Partial<Workflow>): Promise<Workflow> {
    await new Promise(resolve => setTimeout(resolve, 800));
    return mockDb.insert('workflows', workflowData);
  },

  async toggleWorkflow(workflowId: string, isEnabled: boolean): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));
    mockDb.update('workflows', workflowId, { is_enabled: isEnabled });
  },

  async deleteWorkflow(workflowId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    mockDb.delete('workflows', workflowId);
  }
};
