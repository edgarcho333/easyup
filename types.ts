

export type UserRoleName = 
  | 'super_admin' 
  | 'account_manager' 
  | 'copywriter' 
  | 'designer' 
  | 'content_creator' 
  | 'advertiser' 
  | 'client';

export interface OrganizationSettings {
  logo_url?: string;
  theme_color?: string;
}

export interface Organization {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at?: string;
  settings: OrganizationSettings;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
}

export interface Role {
  id: string;
  name: UserRoleName;
  display_name: string;
}

export interface UserOrganization {
  id: string;
  user_id: string;
  organization_id: string;
  role_id: string;
  invited_by?: string;
  status: 'pending' | 'active' | 'inactive';
  joined_at?: string;
  organization?: Organization;
  role?: Role;
}

// SIMPLIFIED INVITATION - Email Only
export interface Invitation {
  id: string;
  email: string;
  organization_id: string;
  role_id: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'cancelled';
  personal_message?: string;
  created_at: string;
  organization?: Organization;
  role?: Role;
  inviter?: User;
}

export interface TeamMember {
  membershipId: string; 
  id?: string; 
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: Role;
  status: 'active' | 'inactive' | 'pending';
  joined_at: string;
  type: 'member' | 'invitation';
  invited_by_name?: string;
  organization_id?: string;
}

export type ProjectStatus = 'setup' | 'active' | 'on_hold' | 'completed' | 'archived';

export interface ProjectPermission {
  action: 'create_ideas' | 'edit_content' | 'approve_concept' | 'upload_assets' | 'final_approval' | 'manage_budget';
  allowed_roles: UserRoleName[];
}

export interface ProjectSettings {
  workflow: {
    require_client_approval: boolean;
    require_assets_for_approval: boolean;
    allow_client_comments: boolean;
    auto_archive_published: boolean;
  };
  permissions: ProjectPermission[];
  notifications: {
    email_on_new_idea: boolean;
    email_on_approval: boolean;
    email_on_comment: boolean;
    email_on_task_due: boolean;
  };
}

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  client_name: string;
  status: ProjectStatus;
  monthly_post_target: number;
  total_budget?: number;
  created_by: string;
  created_at: string;
  updated_at?: string;
  archived_at?: string;
  
  settings?: ProjectSettings; // Added settings field

  // Virtual
  members?: ProjectMember[];
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role_id: string;
  is_lead: boolean;
  added_at: string;
  user?: User;
  role?: Role;
}

// UPDATED STATUS WORKFLOW
export type IdeaStatus = 
  | 'draft' 
  | 'pending_approval'      // 1. Waiting for Concept Approval
  | 'in_production'         // 2. Concept Approved, Creating Assets
  | 'pending_final_review'  // 3. Assets Uploaded, Waiting for Final Visual Approval
  | 'scheduled'             // 4. Final Approved, On Calendar
  | 'published'             // 5. Done
  | 'changes_requested' 
  | 'rejected';

export type PostType = 'image' | 'video' | 'carousel' | 'story' | 'reel';
export type Platform = 'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'twitter';

export interface Idea {
  id: string;
  project_id: string;
  title: string;
  content: string;
  reference_image_url?: string;
  planned_post_date?: string;
  status: IdeaStatus;
  post_type: PostType;
  platforms: Platform[];
  created_by: string;
  created_at: string;
  submitted_at?: string;
  approved_at?: string;
  updated_at?: string;
  
  // Virtual
  creator?: User;
  assets?: IdeaAsset[]; // For previewing assets in cards
}

export interface IdeaComment {
  id: string;
  idea_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface IdeaApproval {
  id: string;
  idea_id: string;
  approver_id: string;
  approver_role: string;
  action: 'approved' | 'rejected' | 'requested_changes';
  comments?: string;
  created_at: string;
  approver?: User;
}

export type AssetStatus = 'pending_review' | 'approved' | 'changes_requested';

export interface IdeaAsset {
  id: string;
  idea_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  version_number: number;
  status: AssetStatus;
  uploaded_by: string;
  created_at: string;
  notes?: string;
  uploader?: User;
}

export interface AssetAnnotation {
  id: string;
  asset_id: string;
  user_id: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  comment: string;
  created_at: string;
  is_resolved: boolean;
  
  // Virtual
  user?: User;
}

export interface AssetReview {
  id: string;
  asset_id: string;
  reviewer_id: string;
  action: 'approved' | 'rejected' | 'changes_requested';
  comments?: string;
  created_at: string;
  reviewer?: User;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
  uploader?: User;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  
  // Updated to array
  assigned_to?: string[]; 
  
  // Timeline fields
  start_date?: string; // ISO String
  due_date?: string; // ISO String
  dependencies?: string[]; // Array of Task IDs that must complete before this one
  
  // Workload fields
  effort?: number;
  effort_unit?: 'hours' | 'points';

  checklist?: TaskChecklistItem[];
  created_by: string;
  created_at: string;
  updated_at?: string;
  
  // Updated Virtual
  assignees?: User[]; 
  
  creator?: User;
  project?: Project;
}

// --- TIME TRACKING ---
export interface TimeLog {
  id: string;
  user_id: string;
  organization_id: string;
  project_id?: string;
  task_id?: string;
  start_time: string;
  end_time?: string;
  duration_minutes: number; // 0 if currently running
  description?: string;
  created_at: string;
  
  // Virtual
  user?: User;
  project?: Project;
  task?: Task;
}

// --- EMPLOYEE ANALYTICS ---
export interface EmployeePerformanceMetrics {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  user_role: string;
  
  // Discipline
  attendance_score: number; // 0-100
  lateness_count: number; // Number of times late this month
  avg_lateness_minutes: number; 
  
  // Activity
  current_status: 'working' | 'idle' | 'offline';
  current_task?: string;
  current_project?: string;
  total_hours_today: number;
  
  // Delivery
  tasks_completed_on_time: number;
  tasks_overdue: number;
  task_efficiency_rate: number; // % on time
  active_task_count?: number; // NEW for load matrix
  
  // Communication
  avg_chat_response_time_minutes: number;
  missed_messages_count: number;
}

export interface VelocityMetric {
  sprint_name: string;
  planned_points: number;
  completed_points: number;
}

export interface WorkloadDistribution {
  status: TaskStatus;
  count: number;
}

// --- WORKFLOW AUTOMATION ---
export type WorkflowTriggerType = 'status_change' | 'priority_change' | 'task_created';
export type WorkflowActionType = 'assign_user' | 'change_status' | 'post_comment';

export interface Workflow {
  id: string;
  project_id: string;
  name: string;
  is_enabled: boolean;
  trigger_type: WorkflowTriggerType;
  trigger_value?: string; // e.g. 'high' for priority, or 'done' for status
  action_type: WorkflowActionType;
  action_value: string; // e.g. user_id for assign, status string for change_status
  created_by: string;
  created_at: string;
}

// --- NOTIFICATIONS ---
export type NotificationType = 
  | 'task_assigned' 
  | 'idea_approved' 
  | 'comment_added' 
  | 'mention' 
  | 'system'
  | 'task_due_soon'
  | 'task_overdue'
  | 'timer_started'
  | 'project_created';

export interface Notification {
  id: string;
  user_id: string; // Who receives it
  organization_id: string;
  project_id?: string; // Added for project-specific filtering
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link_url?: string; // Where it takes you
  sender_id?: string; // Who triggered it
  sender?: User; // Virtual
}

export interface ProjectBudget {
  id: string;
  project_id: string;
  total_budget: number;
  budget_spent: number;
  currency: string;
  start_date: string;
}

export interface PostCampaign {
  id: string;
  project_id: string;
  campaign_name: string;
  platforms: Platform[];
  budget_allocated: number;
  budget_spent: number;
  status: 'planned' | 'active' | 'paused' | 'completed';
  start_date: string;
  created_by: string;
}

export interface CampaignMetric {
  id: string;
  post_campaign_id: string;
  platform: Platform;
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  conversion_value: number;
}

export type ConversationType = 'dm' | 'project' | 'client';

export interface Conversation {
  id: string;
  organization_id?: string;
  type: ConversationType;
  name?: string;
  project_id?: string;
  last_message_at?: string;
  created_at: string;
  participants?: User[];
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string; // 'image' | 'file'
  created_at: string;
  user?: User;
}

// ANALYTICS
export interface ActivityLog {
  id: string;
  organization_id: string;
  project_id?: string; // Added for filtering
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id?: string;
  details?: any;
  created_at: string;
  
  // Virtual
  user?: CurrentUser; // Changed to CurrentUser to access Role for filtering
}

export interface AnalyticsSummary {
  total_projects: number;
  active_projects: number;
  total_ideas: number;
  approved_ideas: number;
  approval_rate: number;
  tasks_completed: number;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface GeneratedReport {
  id: string;
  name: string;
  type: 'pdf' | 'excel' | 'csv';
  date_range: string;
  file_url: string;
  created_by: string;
  created_at: string;
  creator?: User;
}

export interface CurrentUser extends User {
  currentOrganization: Organization | null;
  currentRole: UserRoleName | null;
  currentMembershipId: string | null;
  organizations: Organization[];
}

export interface AuthState {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}