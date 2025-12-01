import { supabase } from '../lib/supabase';
import { Workflow } from '../types';

export const workflowService = {
  async getProjectWorkflows(projectId: string): Promise<Workflow[]> {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('project_id', projectId);

    if (error) {
      console.error('Error fetching workflows:', error);
      return [];
    }

    return (data || []) as Workflow[];
  },

  async createWorkflow(workflowData: Partial<Workflow>): Promise<Workflow> {
    const { data, error } = await supabase
      .from('workflows')
      .insert(workflowData)
      .select()
      .single();

    if (error || !data) {
      throw new Error('Failed to create workflow');
    }

    return data as Workflow;
  },

  async toggleWorkflow(workflowId: string, isEnabled: boolean): Promise<void> {
    const { error } = await supabase
      .from('workflows')
      .update({ is_enabled: isEnabled })
      .eq('id', workflowId);

    if (error) {
      throw error;
    }
  },

  async deleteWorkflow(workflowId: string): Promise<void> {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', workflowId);

    if (error) {
      throw error;
    }
  }
};
