
import { User, Organization, Role, UserOrganization, Project, Idea, Task, ProjectBudget, PostCampaign, Conversation, Message, ActivityLog, TeamMember, TaskComment, TaskAttachment, CampaignMetric, ProjectSettings, IdeaAsset, IdeaApproval, AssetReview, Workflow, Notification, TimeLog, AssetAnnotation, Invitation } from '../types';

const STORAGE_KEY = 'easyup_mock_db_v18_full_data'; 

export const newId = () => Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);

// Generate secure invite token
export const generateInviteToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

// Get date 7 days from now
export const getExpiryDate = (days: number = 7) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

// --- HELPER: Date Generator ---
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const addHours = (dateStr: string, hours: number) => {
    const date = new Date(dateStr);
    date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
    return date.toISOString();
};

// --- SEED DATA: ROLES ---
const SEED_ROLES: Role[] = [
  { id: 'role-1', name: 'super_admin', display_name: 'Super Admin' },
  { id: 'role-2', name: 'account_manager', display_name: 'Account Manager' },
  { id: 'role-3', name: 'copywriter', display_name: 'Copywriter' },
  { id: 'role-4', name: 'designer', display_name: 'Designer' },
  { id: 'role-5', name: 'content_creator', display_name: 'Content Creator' },
  { id: 'role-6', name: 'advertiser', display_name: 'Advertiser' },
  { id: 'role-7', name: 'client', display_name: 'Client' },
];

// --- SEED DATA: USERS ---
const SEED_USERS = [
  {
    id: 'user-giorgi',
    email: 'giorgi.dzvelaia.3@gmail.com',
    full_name: 'Giorgi Dzvelaia',
    avatar_url: 'https://ui-avatars.com/api/?name=Giorgi+Dzvelaia&background=0D8ABC&color=fff',
    password_hash: 'mock'
  },
  {
    id: 'user-demo',
    email: 'sarah@easyup.com',
    full_name: 'Sarah Manager',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    password_hash: 'mock'
  },
  {
    id: 'user-designer',
    email: 'alex@easyup.com',
    full_name: 'Alex Designer',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    password_hash: 'mock'
  },
  {
    id: 'user-copy',
    email: 'mike@easyup.com',
    full_name: 'Mike Copywriter',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    password_hash: 'mock'
  },
  {
    id: 'user-client',
    email: 'emma@urbanstyle.com',
    full_name: 'Emma Client',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
    password_hash: 'mock'
  },
  {
    id: 'user-video',
    email: 'jake@easyup.com',
    full_name: 'Jake Video',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    password_hash: 'mock'
  },
  {
    id: 'user-strat',
    email: 'tom@easyup.com',
    full_name: 'Tom Strategy',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
    password_hash: 'mock'
  },
  {
    id: 'user-intern',
    email: 'lily@easyup.com',
    full_name: 'Lily Intern',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    password_hash: 'mock'
  }
];

// --- SEED DATA: ORGANIZATIONS ---
const SEED_ORGS = [
  {
    id: 'org-default',
    name: 'EasyUp Agency',
    owner_id: 'user-giorgi',
    created_at: daysAgo(90),
    settings: {}
  }
];

// --- SEED DATA: MEMBERSHIPS ---
const SEED_MEMBERSHIPS = [
  { id: 'mem-1', user_id: 'user-giorgi', organization_id: 'org-default', role_id: 'role-1', status: 'active', joined_at: daysAgo(90) },
  { id: 'mem-2', user_id: 'user-demo', organization_id: 'org-default', role_id: 'role-2', status: 'active', joined_at: daysAgo(89) },
  { id: 'mem-3', user_id: 'user-designer', organization_id: 'org-default', role_id: 'role-4', status: 'active', joined_at: daysAgo(85) },
  { id: 'mem-4', user_id: 'user-copy', organization_id: 'org-default', role_id: 'role-3', status: 'active', joined_at: daysAgo(85) },
  { id: 'mem-5', user_id: 'user-client', organization_id: 'org-default', role_id: 'role-7', status: 'active', joined_at: daysAgo(30) },
  { id: 'mem-6', user_id: 'user-video', organization_id: 'org-default', role_id: 'role-5', status: 'active', joined_at: daysAgo(60) },
  { id: 'mem-7', user_id: 'user-strat', organization_id: 'org-default', role_id: 'role-6', status: 'active', joined_at: daysAgo(45) },
  { id: 'mem-8', user_id: 'user-intern', organization_id: 'org-default', role_id: 'role-5', status: 'active', joined_at: daysAgo(15) },
];

const DEFAULT_SETTINGS: ProjectSettings = {
  workflow: {
    require_client_approval: true,
    require_assets_for_approval: true,
    allow_client_comments: true,
    auto_archive_published: false,
  },
  permissions: [
    { action: 'create_ideas', allowed_roles: ['super_admin', 'account_manager', 'copywriter', 'content_creator', 'advertiser'] },
    { action: 'edit_content', allowed_roles: ['super_admin', 'account_manager', 'copywriter'] },
    { action: 'approve_concept', allowed_roles: ['super_admin', 'account_manager', 'client'] },
    { action: 'upload_assets', allowed_roles: ['super_admin', 'account_manager', 'designer', 'content_creator'] },
    { action: 'final_approval', allowed_roles: ['super_admin', 'account_manager', 'client'] },
    { action: 'manage_budget', allowed_roles: ['super_admin', 'account_manager', 'advertiser'] }
  ],
  notifications: {
    email_on_new_idea: true,
    email_on_approval: true,
    email_on_comment: true,
    email_on_task_due: true
  }
};

// --- SEED DATA: PROJECT (SINGLE PROJECT MODE) ---
const SEED_PROJECTS = [
    {
        id: 'proj-1',
        organization_id: 'org-default',
        name: "Neon Summer Campaign '24",
        client_name: 'Urban Style Co.',
        description: 'The biggest seasonal push for Urban Style. High-energy video content, influencer collaborations, and a neon-noir aesthetic. Target audience: Gen Z & Millennials. Key Goal: Drive 50k clicks to the new collection page.',
        status: 'active',
        monthly_post_target: 15,
        total_budget: 25000,
        created_by: 'user-demo',
        created_at: daysAgo(45),
        updated_at: daysAgo(0),
        settings: DEFAULT_SETTINGS
    }
];

// --- SEED DATA: PROJECT MEMBERS ---
const SEED_PROJECT_MEMBERS = [
    { id: 'pm-1', project_id: 'proj-1', user_id: 'user-giorgi', role_id: 'role-1', is_lead: true, added_at: daysAgo(45) },
    { id: 'pm-2', project_id: 'proj-1', user_id: 'user-demo', role_id: 'role-2', is_lead: true, added_at: daysAgo(45) },
    { id: 'pm-3', project_id: 'proj-1', user_id: 'user-designer', role_id: 'role-4', is_lead: false, added_at: daysAgo(40) },
    { id: 'pm-4', project_id: 'proj-1', user_id: 'user-copy', role_id: 'role-3', is_lead: false, added_at: daysAgo(40) },
    { id: 'pm-5', project_id: 'proj-1', user_id: 'user-client', role_id: 'role-7', is_lead: false, added_at: daysAgo(30) },
    { id: 'pm-6', project_id: 'proj-1', user_id: 'user-video', role_id: 'role-5', is_lead: false, added_at: daysAgo(20) },
    { id: 'pm-7', project_id: 'proj-1', user_id: 'user-strat', role_id: 'role-6', is_lead: false, added_at: daysAgo(10) },
];

// --- SEED DATA: IDEAS ---
const SEED_IDEAS = [
    {
        id: 'idea-1',
        project_id: 'proj-1',
        title: 'Neon City Teaser',
        content: 'A mysterious 15s clip showing silhouettes dancing in neon rain. "Something bright is coming." #UrbanNeon #ComingSoon',
        post_type: 'reel',
        platforms: ['instagram', 'tiktok'],
        status: 'published',
        planned_post_date: daysAgo(5),
        created_by: 'user-copy',
        created_at: daysAgo(20),
        updated_at: daysAgo(5),
        reference_image_url: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 'idea-2',
        project_id: 'proj-1',
        title: 'Product Drop: Electric Jacket',
        content: 'The centerpiece of the collection. Waterproof, windproof, and glows under UV light. Pre-order now.',
        post_type: 'carousel',
        platforms: ['instagram', 'facebook'],
        status: 'scheduled',
        planned_post_date: daysAgo(-2), // 2 days in future
        created_by: 'user-demo',
        created_at: daysAgo(15),
        updated_at: daysAgo(1),
        reference_image_url: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 'idea-3',
        project_id: 'proj-1',
        title: 'Influencer Takeover Announcement',
        content: 'Guess who is taking over our stories this weekend? Hint: She loves pink neon and synthwave.',
        post_type: 'story',
        platforms: ['instagram'],
        status: 'in_production',
        created_by: 'user-strat',
        created_at: daysAgo(10),
        updated_at: daysAgo(3),
        reference_image_url: 'https://images.unsplash.com/photo-1496440738382-65591a91f052?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 'idea-4',
        project_id: 'proj-1',
        title: 'Behind the Scenes: Photoshoot',
        content: 'Raw footage from our night shoot in downtown Tokyo. The vibe was unreal.',
        post_type: 'video',
        platforms: ['tiktok', 'youtube_shorts'],
        status: 'pending_approval',
        created_by: 'user-video',
        created_at: daysAgo(2),
        updated_at: daysAgo(2),
        reference_image_url: 'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 'idea-5',
        project_id: 'proj-1',
        title: 'User Generated Content Contest',
        content: 'Show us your neon style. Tag #UrbanNeon for a chance to win the full collection.',
        post_type: 'image',
        platforms: ['instagram', 'twitter'],
        status: 'draft',
        created_by: 'user-copy',
        created_at: daysAgo(1),
        updated_at: daysAgo(1),
        reference_image_url: null
    },
    {
        id: 'idea-6',
        project_id: 'proj-1',
        title: 'Flash Sale: Midnight Madness',
        content: 'Only for 24 hours. Use code NEON24 for 24% off everything black and neon.',
        post_type: 'image',
        platforms: ['facebook', 'instagram'],
        status: 'changes_requested',
        created_by: 'user-strat',
        created_at: daysAgo(3),
        updated_at: daysAgo(0),
        reference_image_url: 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 'idea-7',
        project_id: 'proj-1',
        title: 'Lifestyle Blog Post: Cyberpunk Fashion',
        content: 'How to style the Electric Jacket for everyday wear. Link in bio.',
        post_type: 'carousel',
        platforms: ['linkedin', 'twitter'],
        status: 'draft',
        created_by: 'user-copy',
        created_at: daysAgo(0),
        updated_at: daysAgo(0),
        reference_image_url: null
    }
];

// --- SEED DATA: TASKS (Complex Dependencies for Timeline) ---
const SEED_TASKS = [
    // Completed Initial Phase
    {
        id: 'task-1',
        project_id: 'proj-1',
        title: 'Campaign Strategy & KPI Definition',
        description: 'Define the core goals, target audience segments, and budget allocation.',
        status: 'done',
        priority: 'high',
        assigned_to: ['user-demo', 'user-strat'],
        start_date: daysAgo(40),
        due_date: daysAgo(35),
        created_by: 'user-demo',
        created_at: daysAgo(45),
        dependencies: []
    },
    {
        id: 'task-2',
        project_id: 'proj-1',
        title: 'Visual Identity & Moodboard',
        description: 'Create the neon-noir aesthetic guide for all assets.',
        status: 'done',
        priority: 'medium',
        assigned_to: ['user-designer'],
        start_date: daysAgo(34),
        due_date: daysAgo(30),
        created_by: 'user-demo',
        created_at: daysAgo(35),
        dependencies: ['task-1']
    },
    
    // Active Production Phase
    {
        id: 'task-3',
        project_id: 'proj-1',
        title: 'Copywriting for Teaser Video',
        description: 'Scripting the voiceover and text overlays for the 15s teaser.',
        status: 'done',
        priority: 'high',
        assigned_to: ['user-copy'],
        start_date: daysAgo(20),
        due_date: daysAgo(18),
        created_by: 'user-video',
        created_at: daysAgo(22),
        dependencies: ['task-2']
    },
    {
        id: 'task-4',
        project_id: 'proj-1',
        title: 'Video Production: Teaser',
        description: 'Editing the raw footage based on the approved script.',
        status: 'review',
        priority: 'high',
        assigned_to: ['user-video'],
        start_date: daysAgo(17),
        due_date: daysAgo(5), // Actually late based on "review" status usually, but putting it recent
        created_by: 'user-demo',
        created_at: daysAgo(18),
        dependencies: ['task-3']
    },
    {
        id: 'task-5',
        project_id: 'proj-1',
        title: 'Product Photography Selection',
        description: 'Select top 20 photos from the 500 raw shots.',
        status: 'done',
        priority: 'medium',
        assigned_to: ['user-designer', 'user-client'],
        start_date: daysAgo(15),
        due_date: daysAgo(12),
        created_by: 'user-designer',
        created_at: daysAgo(20),
        dependencies: []
    },
    {
        id: 'task-6',
        project_id: 'proj-1',
        title: 'Design Social Carousels (Set A)',
        description: 'Create 3 carousel posts featuring the Electric Jacket.',
        status: 'in_progress',
        priority: 'high',
        assigned_to: ['user-designer'],
        start_date: daysAgo(2),
        due_date: daysAgo(2), // Due in 2 days
        created_by: 'user-demo',
        created_at: daysAgo(5),
        dependencies: ['task-5']
    },
    {
        id: 'task-7',
        project_id: 'proj-1',
        title: 'Influencer Outreach',
        description: 'Contact list of 10 potential influencers for the takeover.',
        status: 'in_progress',
        priority: 'medium',
        assigned_to: ['user-strat'],
        start_date: daysAgo(5),
        due_date: daysAgo(0), // Due today
        created_by: 'user-demo',
        created_at: daysAgo(10),
        dependencies: ['task-1']
    },
    {
        id: 'task-8',
        project_id: 'proj-1',
        title: 'Client Review: Teaser Video',
        description: 'Waiting for Emma to sign off on the final cut.',
        status: 'todo',
        priority: 'high',
        assigned_to: ['user-client', 'user-demo'],
        start_date: daysAgo(-1), // Starts tomorrow
        due_date: daysAgo(-3),
        created_by: 'user-video',
        created_at: daysAgo(1),
        dependencies: ['task-4']
    },
    {
        id: 'task-9',
        project_id: 'proj-1',
        title: 'Setup Paid Ads Campaign',
        description: 'Configure FB/Insta ads manager with custom audiences.',
        status: 'todo',
        priority: 'medium',
        assigned_to: ['user-strat'],
        start_date: daysAgo(-2),
        due_date: daysAgo(-5),
        created_by: 'user-demo',
        created_at: daysAgo(2),
        dependencies: ['task-6']
    },
    {
        id: 'task-10',
        project_id: 'proj-1',
        title: 'Write Blog Post: Cyberpunk Fashion',
        description: 'SEO optimized article for the website.',
        status: 'todo',
        priority: 'low',
        assigned_to: ['user-copy'],
        start_date: daysAgo(-5),
        due_date: daysAgo(-10),
        created_by: 'user-strat',
        created_at: daysAgo(1),
        dependencies: []
    }
];

// --- SEED DATA: TIME LOGS (For Analytics) ---
const SEED_TIME_LOGS: TimeLog[] = [
    { id: 'log-1', user_id: 'user-designer', organization_id: 'org-default', project_id: 'proj-1', task_id: 'task-2', description: 'Moodboard refinement', start_time: daysAgo(32), end_time: addHours(daysAgo(32), 4), duration_minutes: 240, created_at: daysAgo(32) },
    { id: 'log-2', user_id: 'user-designer', organization_id: 'org-default', project_id: 'proj-1', task_id: 'task-2', description: 'Finalizing assets', start_time: daysAgo(31), end_time: addHours(daysAgo(31), 3.5), duration_minutes: 210, created_at: daysAgo(31) },
    { id: 'log-3', user_id: 'user-video', organization_id: 'org-default', project_id: 'proj-1', task_id: 'task-4', description: 'Rough cut edit', start_time: daysAgo(10), end_time: addHours(daysAgo(10), 5), duration_minutes: 300, created_at: daysAgo(10) },
    { id: 'log-4', user_id: 'user-video', organization_id: 'org-default', project_id: 'proj-1', task_id: 'task-4', description: 'Color grading', start_time: daysAgo(9), end_time: addHours(daysAgo(9), 4), duration_minutes: 240, created_at: daysAgo(9) },
    { id: 'log-5', user_id: 'user-designer', organization_id: 'org-default', project_id: 'proj-1', task_id: 'task-6', description: 'Carousel layout', start_time: daysAgo(1), end_time: addHours(daysAgo(1), 2), duration_minutes: 120, created_at: daysAgo(1) },
    { id: 'log-6', user_id: 'user-designer', organization_id: 'org-default', project_id: 'proj-1', task_id: 'task-6', description: 'Photo retouching', start_time: new Date().toISOString(), end_time: undefined, duration_minutes: 0, created_at: new Date().toISOString() }, // Active now
    { id: 'log-7', user_id: 'user-strat', organization_id: 'org-default', project_id: 'proj-1', task_id: 'task-7', description: 'Emailing influencers', start_time: daysAgo(0), end_time: addHours(daysAgo(0), 1.5), duration_minutes: 90, created_at: daysAgo(0) },
];

// --- SEED DATA: ACTIVITY LOGS ---
const SEED_ACTIVITY_LOGS: ActivityLog[] = [
    { id: 'act-1', organization_id: 'org-default', user_id: 'user-demo', action_type: 'project_created', entity_type: 'project', entity_id: 'proj-1', details: { name: "Neon Summer Campaign '24" }, created_at: daysAgo(45), project_id: 'proj-1' },
    { id: 'act-2', organization_id: 'org-default', user_id: 'user-demo', action_type: 'member_added', entity_type: 'team', details: { name: 'Giorgi Dzvelaia' }, created_at: daysAgo(45), project_id: 'proj-1' },
    { id: 'act-3', organization_id: 'org-default', user_id: 'user-designer', action_type: 'task_completed', entity_type: 'task', entity_id: 'task-2', details: { title: 'Visual Identity & Moodboard' }, created_at: daysAgo(30), project_id: 'proj-1' },
    { id: 'act-4', organization_id: 'org-default', user_id: 'user-copy', action_type: 'idea_created', entity_type: 'idea', entity_id: 'idea-1', details: { title: 'Neon City Teaser' }, created_at: daysAgo(20), project_id: 'proj-1' },
    { id: 'act-5', organization_id: 'org-default', user_id: 'user-client', action_type: 'comment_added', entity_type: 'idea', entity_id: 'idea-1', details: { comment: 'Love this concept!' }, created_at: daysAgo(19), project_id: 'proj-1' },
    { id: 'act-6', organization_id: 'org-default', user_id: 'user-video', action_type: 'task_moved', entity_type: 'task', entity_id: 'task-4', details: { from: 'In Progress', to: 'Review' }, created_at: daysAgo(1), project_id: 'proj-1' },
    { id: 'act-7', organization_id: 'org-default', user_id: 'user-designer', action_type: 'asset_uploaded', entity_type: 'asset', details: { filename: 'carousel_v1.png' }, created_at: daysAgo(0), project_id: 'proj-1' },
];

// --- INITIAL DATABASE STATE ---
const INITIAL_DATA = {
  roles: SEED_ROLES,
  users: SEED_USERS,
  organizations: SEED_ORGS,
  user_organizations: SEED_MEMBERSHIPS,
  projects: SEED_PROJECTS,
  project_members: SEED_PROJECT_MEMBERS,
  ideas: SEED_IDEAS,
  idea_comments: [],
  idea_approvals: [],
  idea_assets: [],
  asset_reviews: [],
  asset_annotations: [],
  tasks: SEED_TASKS,
  task_comments: [],
  task_attachments: [],
  time_logs: SEED_TIME_LOGS,
  workflows: [],
  notifications: [],
  conversations: [],
  conversation_participants: [],
  messages: [],
  activity_logs: SEED_ACTIVITY_LOGS,
  project_budgets: [{ id: 'pb-1', project_id: 'proj-1', total_budget: 25000, budget_spent: 8450, currency: 'USD', start_date: daysAgo(45) }],
  post_campaigns: [
      { id: 'camp-1', project_id: 'proj-1', campaign_name: 'Teaser Awareness', platforms: ['instagram', 'tiktok'], budget_allocated: 5000, budget_spent: 4200, status: 'active', start_date: daysAgo(10), created_by: 'user-strat' },
      { id: 'camp-2', project_id: 'proj-1', campaign_name: 'Retargeting - Cart Abandon', platforms: ['facebook'], budget_allocated: 2000, budget_spent: 150, status: 'active', start_date: daysAgo(2), created_by: 'user-strat' }
  ],
  campaign_metrics: [],
  invitations: []
};

class MockDB {
  private data: any;

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      this.data = JSON.parse(stored);
      // Migration checks could go here if needed
    } else {
      this.data = INITIAL_DATA;
      this.save();
    }
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  public getRoles() {
    return this.data.roles;
  }

  public find(collection: string, predicate: (item: any) => boolean) {
    if (!this.data[collection]) return null;
    return this.data[collection].find(predicate);
  }

  public filter(collection: string, predicate: (item: any) => boolean) {
    if (!this.data[collection]) return [];
    return this.data[collection].filter(predicate);
  }

  public insert<T>(collection: string, item: any): T {
    if (!this.data[collection]) this.data[collection] = [];
    const newItem = {
      id: newId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...item
    };
    this.data[collection].push(newItem);
    this.save();
    return newItem;
  }

  public update(collection: string, id: string, updates: any) {
    if (!this.data[collection]) return null;
    const index = this.data[collection].findIndex((item: any) => item.id === id);
    if (index === -1) return null;
    
    this.data[collection][index] = {
      ...this.data[collection][index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.save();
    return this.data[collection][index];
  }

  public delete(collection: string, id: string) {
    if (!this.data[collection]) return;
    this.data[collection] = this.data[collection].filter((item: any) => item.id !== id);
    this.save();
  }
  
  public reset() {
      this.data = INITIAL_DATA;
      this.save();
  }
}

export const mockDb = new MockDB();
