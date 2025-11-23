
import { User, Organization, Role, UserOrganization, Project, Idea, Task, ProjectBudget, PostCampaign, Conversation, Message, ActivityLog, TeamMember, TaskComment, TaskAttachment, CampaignMetric, ProjectSettings, IdeaAsset, IdeaApproval, AssetReview } from '../types';

const STORAGE_KEY = 'easyup_mock_db_v11_single_project_rich'; 

export const newId = () => Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);

// --- HELPER: Date Generator (Days ago) ---
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
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
    full_name: 'Sarah Jenkins (AM)',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    password_hash: 'mock'
  },
  {
    id: 'user-designer',
    email: 'alex@easyup.com',
    full_name: 'Alex Chen (Lead Design)',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    password_hash: 'mock'
  },
  {
    id: 'user-copy',
    email: 'mike@easyup.com',
    full_name: 'Mike Write',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    password_hash: 'mock'
  },
  {
    id: 'user-client',
    email: 'emma@urbanstyle.com',
    full_name: 'Emma Styles (Client)',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
    password_hash: 'mock'
  },
  {
    id: 'user-video',
    email: 'jake@easyup.com',
    full_name: 'Jake Motion (Video)',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    password_hash: 'mock'
  }
];

// --- SEED DATA: ORGANIZATIONS ---
const SEED_ORGS = [
  {
    id: 'org-default',
    name: 'EasyUp Agency',
    owner_id: 'user-giorgi',
    created_at: daysAgo(60),
    settings: {}
  }
];

// --- SEED DATA: MEMBERSHIPS ---
const SEED_MEMBERSHIPS = [
  { id: 'mem-1', user_id: 'user-giorgi', organization_id: 'org-default', role_id: 'role-1', status: 'active', joined_at: daysAgo(60) },
  { id: 'mem-2', user_id: 'user-demo', organization_id: 'org-default', role_id: 'role-2', status: 'active', joined_at: daysAgo(59) },
  { id: 'mem-3', user_id: 'user-designer', organization_id: 'org-default', role_id: 'role-4', status: 'active', joined_at: daysAgo(55) },
  { id: 'mem-4', user_id: 'user-copy', organization_id: 'org-default', role_id: 'role-3', status: 'active', joined_at: daysAgo(55) },
  { id: 'mem-5', user_id: 'user-client', organization_id: 'org-default', role_id: 'role-7', status: 'active', joined_at: daysAgo(20) },
  { id: 'mem-6', user_id: 'user-video', organization_id: 'org-default', role_id: 'role-5', status: 'active', joined_at: daysAgo(40) },
];

const DEFAULT_SETTINGS: ProjectSettings = {
  workflow: {
    require_client_approval: true,
    require_assets_for_approval: true,
    allow_client_comments: true,
    auto_archive_published: false,
  },
  permissions: [
    { action: 'create_ideas', allowed_roles: ['super_admin', 'account_manager', 'copywriter', 'content_creator'] },
    { action: 'edit_content', allowed_roles: ['super_admin', 'account_manager', 'copywriter'] },
    { action: 'approve_concept', allowed_roles: ['super_admin', 'account_manager', 'client'] },
    { action: 'upload_assets', allowed_roles: ['super_admin', 'account_manager', 'designer', 'content_creator'] },
    { action: 'final_approval', allowed_roles: ['super_admin', 'account_manager', 'client'] },
    { action: 'manage_budget', allowed_roles: ['super_admin', 'account_manager', 'advertiser'] }
  ],
  notifications: {
    email_on_new_idea: true,
    email_on_approval: true,
    email_on_comment: true
  }
};

// --- SEED DATA: PROJECTS ---
const SEED_PROJECTS = [
    {
        id: 'proj-1',
        organization_id: 'org-default',
        name: "Neon Summer Campaign '24",
        client_name: 'Urban Style Co.',
        description: 'High-energy summer campaign focusing on the new "Neon Nights" streetwear collection. Target audience: Gen Z. Platforms: TikTok (Viral challenges), Instagram (Aesthetic carousels). Key message: "Glow Different".',
        status: 'active',
        monthly_post_target: 25, // Increased target
        total_budget: 25000, // Increased budget
        created_by: 'user-giorgi',
        created_at: daysAgo(30),
        updated_at: daysAgo(0),
        settings: DEFAULT_SETTINGS
    }
];

const SEED_PROJECT_MEMBERS = [
    { id: 'pm-1', project_id: 'proj-1', user_id: 'user-giorgi', role_id: 'role-1', added_at: daysAgo(30), is_lead: true },
    { id: 'pm-2', project_id: 'proj-1', user_id: 'user-demo', role_id: 'role-2', added_at: daysAgo(30), is_lead: false },
    { id: 'pm-3', project_id: 'proj-1', user_id: 'user-designer', role_id: 'role-4', added_at: daysAgo(29), is_lead: false },
    { id: 'pm-4', project_id: 'proj-1', user_id: 'user-copy', role_id: 'role-3', added_at: daysAgo(29), is_lead: false },
    { id: 'pm-5', project_id: 'proj-1', user_id: 'user-client', role_id: 'role-7', added_at: daysAgo(25), is_lead: false },
    { id: 'pm-6', project_id: 'proj-1', user_id: 'user-video', role_id: 'role-5', added_at: daysAgo(29), is_lead: false },
];

// --- SEED DATA: IDEAS (MASSIVELY EXPANDED) ---
const SEED_IDEAS = [
    // 1. READY / PUBLISHED
    {
        id: 'idea-1', project_id: 'proj-1', title: 'Teaser: The Glow Up', 
        content: 'Are you ready to glow? 🌟 The Neon Nights collection drops in 48 hours. \n\nTurn on post notifications so you don\'t miss the limited release. #NeonNights #UrbanStyle #Streetwear',
        status: 'published', post_type: 'reel', platforms: ['instagram', 'tiktok'],
        created_by: 'user-copy', created_at: daysAgo(15), submitted_at: daysAgo(14), approved_at: daysAgo(10), planned_post_date: daysAgo(2),
        reference_image_url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 'idea-6', project_id: 'proj-1', title: 'Moodboard Reveal',
        content: 'The inspiration behind the collection. Cyberpunk meets 90s rave culture. 💿💜 #Inspo #DesignProcess',
        status: 'published', post_type: 'image', platforms: ['instagram', 'pinterest'],
        created_by: 'user-designer', created_at: daysAgo(20), submitted_at: daysAgo(18), approved_at: daysAgo(15), planned_post_date: daysAgo(5),
        reference_image_url: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 'idea-7', project_id: 'proj-1', title: '"Day in the Life" w/ Model',
        content: 'Come behind the scenes with @SashaFierce as she shoots the campaign lookbook. 📸✨',
        status: 'published', post_type: 'video', platforms: ['tiktok'],
        created_by: 'user-video', created_at: daysAgo(18), submitted_at: daysAgo(16), approved_at: daysAgo(12), planned_post_date: daysAgo(1),
        reference_image_url: 'https://images.unsplash.com/photo-1485230405346-71acb9518d9c?auto=format&fit=crop&w=800&q=80'
    },

    // 2. SCHEDULED / APPROVED
    {
        id: 'idea-8', project_id: 'proj-1', title: 'Product Spotlight: Cyber Hoodie',
        content: 'Meet the Cyber Hoodie. Reflective piping, oversized fit, 100% organic cotton. Available now in 3 colorways. Link in bio to shop.',
        status: 'scheduled', post_type: 'image', platforms: ['instagram', 'facebook'],
        created_by: 'user-copy', created_at: daysAgo(8), submitted_at: daysAgo(7), approved_at: daysAgo(1), planned_post_date: daysAgo(-1),
        reference_image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 'idea-9', project_id: 'proj-1', title: 'Neon Outfit Challenge',
        content: 'Show us your brightest fit! 🌈 Use sound "NeonGlow" and tag us for a chance to win a $500 gift card. Challenge starts NOW.',
        status: 'scheduled', post_type: 'video', platforms: ['tiktok', 'instagram'],
        created_by: 'user-demo', created_at: daysAgo(10), submitted_at: daysAgo(9), approved_at: daysAgo(2), planned_post_date: daysAgo(-2),
        reference_image_url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80'
    },

    // 3. REVIEW (Visuals Done, Waiting Final)
    {
        id: 'idea-2', project_id: 'proj-1', title: 'Lookbook Carousel', 
        content: 'Swipe to see the vibe. ➡️ \n\n1. The "Cyber" Hoodie\n2. Reflective Joggers\n3. Neon Beanies\n\nWhich piece is your cop? 👇',
        status: 'pending_final_review', post_type: 'carousel', platforms: ['instagram', 'linkedin'],
        created_by: 'user-demo', created_at: daysAgo(7), submitted_at: daysAgo(6), planned_post_date: daysAgo(2),
        reference_image_url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 'idea-10', project_id: 'proj-1', title: '"How to Style" Tutorial',
        content: '3 ways to style the Neon Track Pants. From street to chic. 👟👠 #StyleGuide #OOTD',
        status: 'pending_final_review', post_type: 'reel', platforms: ['instagram'],
        created_by: 'user-video', created_at: daysAgo(6), submitted_at: daysAgo(5), planned_post_date: daysAgo(3),
        reference_image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'
    },

    // 4. PRODUCTION (Concept Approved, Assets Missing)
    {
        id: 'idea-3', project_id: 'proj-1', title: 'Influencer Unboxing (Story)', 
        content: 'Repost @FashionNova unboxing video. Add overlay text: "Approved by the best 🔥". Link sticker to shop.',
        status: 'in_production', post_type: 'story', platforms: ['instagram'],
        created_by: 'user-giorgi', created_at: daysAgo(5), submitted_at: daysAgo(4), planned_post_date: daysAgo(0),
        reference_image_url: 'https://images.unsplash.com/photo-1512413914633-b5043f4041ea?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 'idea-11', project_id: 'proj-1', title: 'Launch Party Recap',
        content: 'What a night! 🎆 Thank you to everyone who came out to celebrate the launch. Here are the highlights.',
        status: 'in_production', post_type: 'video', platforms: ['instagram', 'tiktok', 'linkedin'],
        created_by: 'user-video', created_at: daysAgo(3), submitted_at: daysAgo(2), planned_post_date: daysAgo(4),
        reference_image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 'idea-12', project_id: 'proj-1', title: 'Behind the Seams: Design',
        content: 'From sketch to sample. See how Alex created the signature neon print.',
        status: 'in_production', post_type: 'carousel', platforms: ['linkedin', 'instagram'],
        created_by: 'user-designer', created_at: daysAgo(12), submitted_at: daysAgo(10), planned_post_date: daysAgo(6),
        reference_image_url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80'
    },

    // 5. CONCEPT (Pending Approval / Changes)
    {
        id: 'idea-4', project_id: 'proj-1', title: 'Flash Sale: Midnight Drop', 
        content: 'MIDNIGHT FLASH SALE. ⚡ 24 hours only. \n\nCode: NEON24 for 20% off everything. Go go go!',
        status: 'changes_requested', post_type: 'image', platforms: ['facebook', 'twitter'],
        created_by: 'user-copy', created_at: daysAgo(3), submitted_at: daysAgo(2), planned_post_date: daysAgo(5),
        reference_image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 'idea-13', project_id: 'proj-1', title: 'CEO Interview Snippet',
        content: 'Our CEO discusses the future of sustainable streetwear with @Forbes. "Fashion needs to be bold, but responsible."',
        status: 'pending_approval', post_type: 'video', platforms: ['linkedin'],
        created_by: 'user-giorgi', created_at: daysAgo(1), submitted_at: daysAgo(0), planned_post_date: daysAgo(7),
        reference_image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'
    },

    // 6. DRAFT
    {
        id: 'idea-5', project_id: 'proj-1', title: 'BTS: Photoshoot Day', 
        content: 'Raw footage from the studio. Showing the lighting setup and model prep. Authentic vibes.',
        status: 'draft', post_type: 'video', platforms: ['tiktok'],
        created_by: 'user-designer', created_at: daysAgo(0),
        reference_image_url: 'https://images.unsplash.com/photo-1585675100412-37c2b3d308c9?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 'idea-14', project_id: 'proj-1', title: 'Meme: "Me vs My Wallet"',
        content: 'Me: I need to save money.\nAlso Me: *Sees Neon Nights collection*\n\nTag a friend who needs an intervention. 😂',
        status: 'draft', post_type: 'image', platforms: ['instagram', 'twitter'],
        created_by: 'user-copy', created_at: daysAgo(1),
        reference_image_url: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 'idea-15', project_id: 'proj-1', title: 'Giveaway Announcement',
        content: 'WIN THE ENTIRE COLLECTION! 🎁\n\n1. Follow us\n2. Like this post\n3. Tag 3 friends\n\nBonus entry: Share to story.',
        status: 'draft', post_type: 'image', platforms: ['instagram'],
        created_by: 'user-demo', created_at: daysAgo(0),
        reference_image_url: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=800&q=80'
    },
    {
        id: 'idea-16', project_id: 'proj-1', title: 'Last Chance Reminder',
        content: 'Only 4 hours left to shop the drop before the vault closes! ⏳',
        status: 'draft', post_type: 'story', platforms: ['instagram'],
        created_by: 'user-copy', created_at: daysAgo(0)
    }
];

// --- SEED DATA: ASSETS ---
const SEED_ASSETS = [
    // For Idea 2 (Lookbook)
    {
        id: 'asset-1', idea_id: 'idea-2', file_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
        file_name: 'Lookbook_Cover_V1.jpg', file_type: 'image/jpeg', file_size: 1024000,
        version_number: 1, status: 'approved', uploaded_by: 'user-designer', created_at: daysAgo(1)
    },
    {
        id: 'asset-2', idea_id: 'idea-2', file_url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=80',
        file_name: 'Lookbook_Slide2_V1.jpg', file_type: 'image/jpeg', file_size: 1024000,
        version_number: 1, status: 'pending_review', uploaded_by: 'user-designer', created_at: daysAgo(1),
        notes: 'Is the logo too small here?'
    },
    // For Idea 1 (Teaser)
    {
        id: 'asset-3', idea_id: 'idea-1', file_url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80',
        file_name: 'Teaser_Final_Cut.mp4', file_type: 'video/mp4', file_size: 15000000,
        version_number: 2, status: 'approved', uploaded_by: 'user-video', created_at: daysAgo(11),
        notes: 'Color grading updated as requested.'
    },
    // For Idea 10 (Tutorial)
    {
        id: 'asset-4', idea_id: 'idea-10', file_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
        file_name: 'Tutorial_Draft_1.mp4', file_type: 'video/mp4', file_size: 25000000,
        version_number: 1, status: 'pending_review', uploaded_by: 'user-video', created_at: daysAgo(1),
        notes: 'Added the captions. Let me know if the font is legible.'
    }
];

const SEED_APPROVALS: IdeaApproval[] = [
    {
        id: 'app-1', idea_id: 'idea-1', approver_id: 'user-client', approver_role: 'client',
        action: 'approved', comments: 'Love the energy in this! Good to go.', created_at: daysAgo(10)
    },
    {
        id: 'app-2', idea_id: 'idea-4', approver_id: 'user-demo', approver_role: 'account_manager',
        action: 'requested_changes', comments: 'Can we make the "20% OFF" text bigger? It gets lost.', created_at: daysAgo(1)
    },
    {
        id: 'app-3', idea_id: 'idea-9', approver_id: 'user-client', approver_role: 'client',
        action: 'approved', comments: 'Great idea for engagement. Approved.', created_at: daysAgo(2)
    }
];

const SEED_COMMENTS = [
    { id: 'ic-1', idea_id: 'idea-2', user_id: 'user-client', content: 'The second slide feels a bit empty.', created_at: daysAgo(3) },
    { id: 'ic-2', idea_id: 'idea-2', user_id: 'user-designer', content: 'I will add some graphic elements to fill the space.', created_at: daysAgo(2) },
    { id: 'ic-3', idea_id: 'idea-11', user_id: 'user-demo', content: 'Make sure we include the shot of the DJ.', created_at: daysAgo(1) },
    { id: 'ic-4', idea_id: 'idea-15', user_id: 'user-copy', content: 'Should we ask them to tag 2 friends or 3? 3 might be high friction.', created_at: daysAgo(0) }
];

// --- SEED DATA: TASKS ---
const SEED_TASKS = [
    {
        id: 'task-1', project_id: 'proj-1', title: 'Approve Q3 Ad Spend', description: 'Finalize the budget allocation for July/August.',
        status: 'done', priority: 'high', assigned_to: 'user-client', created_by: 'user-demo', created_at: daysAgo(10), due_date: daysAgo(8)
    },
    {
        id: 'task-2', project_id: 'proj-1', title: 'Design Lookbook Assets', description: 'Create 5 slides for the carousel post. Use the "Neon" preset.',
        status: 'review', priority: 'high', assigned_to: 'user-designer', created_by: 'user-demo', created_at: daysAgo(5), due_date: daysAgo(1)
    },
    {
        id: 'task-3', project_id: 'proj-1', title: 'Write Flash Sale Copy', description: 'Needs to be punchy and urgent. Include emojis.',
        status: 'in_progress', priority: 'medium', assigned_to: 'user-copy', created_by: 'user-demo', created_at: daysAgo(2), due_date: daysAgo(0)
    },
    {
        id: 'task-4', project_id: 'proj-1', title: 'Community Management', description: 'Reply to comments on the Teaser post once it goes live.',
        status: 'todo', priority: 'low', assigned_to: 'user-demo', created_by: 'user-giorgi', created_at: daysAgo(1), due_date: daysAgo(2)
    },
    {
        id: 'task-5', project_id: 'proj-1', title: 'Edit Launch Party Video', description: 'Sift through the 2 hours of footage and cut a 30s sizzle reel.',
        status: 'in_progress', priority: 'high', assigned_to: 'user-video', created_by: 'user-demo', created_at: daysAgo(2), due_date: daysAgo(4)
    },
    {
        id: 'task-6', project_id: 'proj-1', title: 'Approve Giveaway Terms', description: 'Legal needs to review the terms and conditions for the instagram giveaway.',
        status: 'todo', priority: 'high', assigned_to: 'user-client', created_by: 'user-demo', created_at: daysAgo(0), due_date: daysAgo(1)
    },
    {
        id: 'task-7', project_id: 'proj-1', title: 'Reach out to Influencers', description: 'DM the shortlist for the Outfit Challenge. Send them the brief.',
        status: 'in_progress', priority: 'medium', assigned_to: 'user-demo', created_by: 'user-giorgi', created_at: daysAgo(3), due_date: daysAgo(1)
    },
    {
        id: 'task-8', project_id: 'proj-1', title: 'Schedule "Spotlight" Post', description: 'Post is approved. Put it in Sprout Social for Friday 5PM.',
        status: 'done', priority: 'medium', assigned_to: 'user-demo', created_by: 'user-copy', created_at: daysAgo(2), due_date: daysAgo(2)
    },
    {
        id: 'task-9', project_id: 'proj-1', title: 'Research Competitor Hashtags', description: 'See what tags are trending for #Streetwear this week.',
        status: 'todo', priority: 'low', assigned_to: 'user-copy', created_by: 'user-demo', created_at: daysAgo(1), due_date: daysAgo(5)
    },
    {
        id: 'task-10', project_id: 'proj-1', title: 'Design Giveaway Graphic', description: 'Needs to look expensive. Gold/Neon aesthetic.',
        status: 'todo', priority: 'medium', assigned_to: 'user-designer', created_by: 'user-demo', created_at: daysAgo(0), due_date: daysAgo(2)
    }
];

// --- SEED DATA: CHAT ---
const SEED_CONVERSATIONS: Conversation[] = [
    {
        id: 'conv-team-1', organization_id: 'org-default', project_id: 'proj-1', type: 'project', name: 'Neon Campaign - Team',
        last_message_at: daysAgo(0), created_at: daysAgo(30)
    },
    {
        id: 'conv-client-1', organization_id: 'org-default', project_id: 'proj-1', type: 'client', name: 'Neon Campaign - Client',
        last_message_at: daysAgo(0), created_at: daysAgo(25)
    }
];

const SEED_MESSAGES: Message[] = [
    // Team Chat
    { id: 'msg-1', conversation_id: 'conv-team-1', user_id: 'user-demo', content: 'Jake, did you get the footage from the party?', created_at: daysAgo(2) },
    { id: 'msg-2', conversation_id: 'conv-team-1', user_id: 'user-video', content: 'Yeah, tons of good stuff. The lighting was tricky but I can fix it in post.', created_at: daysAgo(2) },
    { id: 'msg-3', conversation_id: 'conv-team-1', user_id: 'user-designer', content: 'I uploaded the Lookbook V2 assets. Let me know what you think.', created_at: daysAgo(1) },
    { id: 'msg-4', conversation_id: 'conv-team-1', user_id: 'user-demo', content: 'Checking now. Also, Mike, we need that Flash Sale copy ASAP.', created_at: daysAgo(1) },
    { id: 'msg-5', conversation_id: 'conv-team-1', user_id: 'user-copy', content: 'On it. Sending a draft in 10 mins.', created_at: daysAgo(0) },
    
    // Client Chat
    { id: 'msg-6', conversation_id: 'conv-client-1', user_id: 'user-client', content: 'The teaser reel performance is insane! 50k views already.', created_at: daysAgo(2) },
    { id: 'msg-7', conversation_id: 'conv-client-1', user_id: 'user-giorgi', content: 'We told you it would go viral! The TikTok algorithm loved the sound choice.', created_at: daysAgo(2) },
    { id: 'msg-8', conversation_id: 'conv-client-1', user_id: 'user-client', content: 'Just approved the Outfit Challenge post. When does that go live?', created_at: daysAgo(1) },
    { id: 'msg-9', conversation_id: 'conv-client-1', user_id: 'user-demo', content: 'Scheduled for tomorrow at 6 PM. Prime time.', created_at: daysAgo(1) },
    { id: 'msg-10', conversation_id: 'conv-client-1', user_id: 'user-client', content: 'Perfect. Can you send over the giveaway graphics for review when ready?', created_at: daysAgo(0) }
];

const SEED_PARTICIPANTS = [
    { id: 'cp-1', conversation_id: 'conv-team-1', user_id: 'user-giorgi' },
    { id: 'cp-2', conversation_id: 'conv-team-1', user_id: 'user-demo' },
    { id: 'cp-3', conversation_id: 'conv-team-1', user_id: 'user-designer' },
    { id: 'cp-4', conversation_id: 'conv-team-1', user_id: 'user-copy' },
    { id: 'cp-5', conversation_id: 'conv-team-1', user_id: 'user-video' },
    
    { id: 'cp-6', conversation_id: 'conv-client-1', user_id: 'user-giorgi' },
    { id: 'cp-7', conversation_id: 'conv-client-1', user_id: 'user-demo' },
    { id: 'cp-8', conversation_id: 'conv-client-1', user_id: 'user-client' },
];

// --- SEED DATA: METRICS ---
const SEED_CAMPAIGNS = [
    {
        id: 'camp-1', project_id: 'proj-1', campaign_name: 'Traffic - Neon Launch', 
        platforms: ['instagram'], budget_allocated: 10000, budget_spent: 4250.50, 
        status: 'active', start_date: daysAgo(10), created_by: 'user-demo'
    },
    {
        id: 'camp-2', project_id: 'proj-1', campaign_name: 'Awareness - TikTok Viral', 
        platforms: ['tiktok'], budget_allocated: 8000, budget_spent: 6100.00, 
        status: 'active', start_date: daysAgo(8), created_by: 'user-demo'
    },
    {
        id: 'camp-3', project_id: 'proj-1', campaign_name: 'Retargeting - Abandoned Cart', 
        platforms: ['facebook', 'instagram'], budget_allocated: 5000, budget_spent: 1200.00, 
        status: 'active', start_date: daysAgo(5), created_by: 'user-giorgi'
    }
];

const SEED_BUDGETS = [
    { id: 'bud-1', project_id: 'proj-1', total_budget: 25000, budget_spent: 11550.50, currency: 'USD', start_date: daysAgo(30) }
];

const SEED_METRICS: CampaignMetric[] = [];
// Generate daily metrics for last 10 days for active campaigns
[0, 1, 2].forEach(campIdx => {
    const campId = SEED_CAMPAIGNS[campIdx].id;
    for (let i = 10; i >= 0; i--) {
        const date = daysAgo(i).split('T')[0];
        SEED_METRICS.push({
            id: `met-${campId}-${i}`, post_campaign_id: campId, platform: SEED_CAMPAIGNS[campIdx].platforms[0] as any, date: date,
            impressions: 5000 + (Math.random() * 5000), clicks: 200 + (Math.random() * 200),
            spend: 200 + (Math.random() * 300), conversions: 5 + (Math.floor(Math.random() * 15)),
            conversion_value: 300 + (Math.random() * 800)
        });
    }
});

// --- SEED DATA: LOGS ---
const SEED_LOGS = [
    { id: 'l-1', organization_id: 'org-default', project_id: 'proj-1', user_id: 'user-designer', action_type: 'uploaded_asset', entity_type: 'idea', details: { title: 'Lookbook Carousel' }, created_at: daysAgo(0) },
    { id: 'l-2', organization_id: 'org-default', project_id: 'proj-1', user_id: 'user-copy', action_type: 'created_idea', entity_type: 'idea', details: { title: 'Giveaway Announcement' }, created_at: daysAgo(0) },
    { id: 'l-3', organization_id: 'org-default', project_id: 'proj-1', user_id: 'user-video', action_type: 'uploaded_asset', entity_type: 'idea', details: { title: 'How to Style Tutorial' }, created_at: daysAgo(1) },
    { id: 'l-4', organization_id: 'org-default', project_id: 'proj-1', user_id: 'user-demo', action_type: 'requested_changes', entity_type: 'idea', details: { title: 'Flash Sale Post' }, created_at: daysAgo(1) },
    { id: 'l-5', organization_id: 'org-default', project_id: 'proj-1', user_id: 'user-client', action_type: 'approved_concept', entity_type: 'idea', details: { title: 'Neon Outfit Challenge' }, created_at: daysAgo(2) },
    { id: 'l-6', organization_id: 'org-default', project_id: 'proj-1', user_id: 'user-demo', action_type: 'scheduled_post', entity_type: 'idea', details: { title: 'Teaser: The Glow Up' }, created_at: daysAgo(2) },
    { id: 'l-7', organization_id: 'org-default', project_id: 'proj-1', user_id: 'user-giorgi', action_type: 'created_campaign', entity_type: 'campaign', details: { name: 'Retargeting - Abandoned Cart' }, created_at: daysAgo(5) },
    { id: 'l-8', organization_id: 'org-default', project_id: 'proj-1', user_id: 'user-client', action_type: 'commented', entity_type: 'idea', details: { title: 'Lookbook Carousel' }, created_at: daysAgo(3) },
    { id: 'l-9', organization_id: 'org-default', project_id: 'proj-1', user_id: 'user-video', action_type: 'status_change', entity_type: 'task', details: { title: 'Edit Launch Party Video', status: 'in_progress' }, created_at: daysAgo(2) },
    { id: 'l-10', organization_id: 'org-default', project_id: 'proj-1', user_id: 'user-copy', action_type: 'status_change', entity_type: 'task', details: { title: 'Write Flash Sale Copy', status: 'in_progress' }, created_at: daysAgo(2) }
];

// --- INITIAL DB STRUCTURE ---
const INITIAL_DB = {
  users: SEED_USERS as any[],
  organizations: SEED_ORGS as Organization[],
  roles: SEED_ROLES,
  user_organizations: SEED_MEMBERSHIPS as any[],
  invitations: [] as any[],
  projects: SEED_PROJECTS as Project[],
  project_members: SEED_PROJECT_MEMBERS as any[],
  ideas: SEED_IDEAS as Idea[],
  idea_comments: SEED_COMMENTS as any[],
  idea_approvals: SEED_APPROVALS as any[],
  idea_assets: SEED_ASSETS as any[],
  asset_reviews: [] as any[],
  tasks: SEED_TASKS as Task[],
  task_comments: [] as TaskComment[],
  task_attachments: [] as TaskAttachment[],
  project_budgets: SEED_BUDGETS as ProjectBudget[],
  post_campaigns: SEED_CAMPAIGNS as PostCampaign[],
  campaign_metrics: SEED_METRICS as any[],
  conversations: SEED_CONVERSATIONS as Conversation[],
  conversation_participants: SEED_PARTICIPANTS as any[],
  messages: SEED_MESSAGES as Message[],
  activity_logs: SEED_LOGS as ActivityLog[],
};

class MockDatabase {
  private data: typeof INITIAL_DB;

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.data = JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse mock db', e);
        this.data = INITIAL_DB;
        this.save();
      }
    } else {
      this.data = INITIAL_DB;
      this.save();
    }
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  getRoles() { return this.data.roles; }

  find<T>(collection: keyof typeof INITIAL_DB, predicate: (item: T) => boolean): T | undefined {
    return (this.data[collection] as T[]).find(predicate);
  }

  filter<T>(collection: keyof typeof INITIAL_DB, predicate: (item: T) => boolean): T[] {
    return (this.data[collection] as T[]).filter(predicate);
  }

  insert<T>(collection: keyof typeof INITIAL_DB, item: any): T {
    const newItem = { id: generateId(), created_at: new Date().toISOString(), ...item };
    (this.data[collection] as any[]).push(newItem);
    this.save();
    return newItem;
  }

  update<T>(collection: keyof typeof INITIAL_DB, id: string, updates: Partial<T>): T | null {
    const index = (this.data[collection] as any[]).findIndex((item: any) => item.id === id);
    if (index === -1) return null;
    
    const updatedItem = { ...this.data[collection][index], ...updates, updated_at: new Date().toISOString() };
    this.data[collection][index] = updatedItem;
    this.save();
    return updatedItem;
  }

  delete(collection: keyof typeof INITIAL_DB, id: string): void {
    this.data[collection] = (this.data[collection] as any[]).filter((item: any) => item.id !== id);
    this.save();
  }
}

const generateId = () => Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);

export const mockDb = new MockDatabase();
