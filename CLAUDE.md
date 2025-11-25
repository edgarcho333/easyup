# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EASYUP is a multi-tenant SaaS platform for social media campaign and content management, designed for marketing agencies and their clients. Built with React 19, TypeScript, and Vite, it features AI-powered content generation via Google Gemini.

## Common Development Commands

```bash
# Development
npm install                # Install dependencies (use --legacy-peer-deps if conflicts)
npm run dev               # Start dev server at localhost:3000
npm run build             # Production build
npm run preview           # Preview production build
```

## Environment Setup

Create `.env.local` with:
```
GEMINI_API_KEY=your_api_key_here
```

The API key is injected as `process.env.API_KEY` via vite.config.ts for Google Gemini integration.

## Architecture

### Service Layer Pattern

All business logic lives in `/services/` directory. **Always use services for data operations**, never manipulate the mock database directly from components:

- `authService.ts` - Authentication and session management
- `projectService.ts` - Project CRUD operations
- `ideaService.ts` - Content idea workflow management
- `taskService.ts` - Task operations with dependency validation
- `chatService.ts` - Messaging system
- `assetService.ts` - File uploads and review workflow
- `analyticsService.ts` - Activity logging and metrics
- `notificationService.ts` - Real-time notifications
- `organizationService.ts` - Multi-tenant organization management
- `budgetService.ts` - Campaign budget tracking
- `workflowService.ts` - Automation rules
- `timeService.ts` - Time tracking
- `userService.ts` - User profiles

### Mock Database System

Location: `/lib/mockDb.ts`

- In-memory database with localStorage persistence
- Storage key: `easyup_mock_db_v18_full_data`
- Collections: users, organizations, projects, ideas, tasks, conversations, messages, assets, etc.
- Operations: `find`, `filter`, `insert`, `update`, `delete`
- **Important**: Changing the storage key version will reset all data

### Global State Management

Four React Context providers manage global state:

1. **AuthContext** (`/context/AuthContext.tsx`)
   - Current user and organization
   - Organization switching: `switchOrganization(orgId)`
   - Session persistence via localStorage

2. **ThemeContext** (`/context/ThemeContext.tsx`)
   - Dark/light mode with localStorage persistence

3. **ToastContext** (`/context/ToastContext.tsx`)
   - Toast notifications: `showToast(message, type)`

4. **NotificationContext** (`/context/NotificationContext.tsx`)
   - Polls every 10 seconds for new notifications
   - Unread count and notification management

### Component Organization

```
components/
├── ui/              # Base UI components (Button, Card, Input, etc.)
├── analytics/       # Analytics and reporting
├── assets/          # Asset management (upload, gallery, annotations)
├── budget/          # Budget tracking
├── chat/            # Real-time messaging
├── ideas/           # Content idea workflow (core feature)
├── notifications/   # Notification dropdown
├── org/             # Organization management
├── projects/        # Project management
├── tasks/           # Task management (Kanban, Calendar, Timeline)
├── time/            # Time tracking widgets
└── workflows/       # Workflow automation
```

## Key Workflows

### Content Idea Workflow

Status progression: `draft` → `pending_approval` → `in_production` → `pending_final_review` → `scheduled` → `published`

**AI Generation Flow** (`CreateIdeaModal.tsx`):
1. User clicks "Magic Generate"
2. Gemini 2.5 Flash generates concept (title, content, platforms, post_type)
3. Gemini 2.5 Flash Image generates reference visual
4. Form auto-populates with AI suggestions
5. User can refine or save

### Role-Based Access Control

Roles: `super_admin`, `account_manager`, `copywriter`, `designer`, `content_creator`, `advertiser`, `client`

- Permissions checked at component level (conditional rendering)
- Service layer validates authorization
- Project settings allow workflow customization per role

### Task Management

- Supports dependencies (Gantt-style timeline)
- Multiple assignees per task
- Workload capacity planning
- Status: `todo` → `in_progress` → `review` → `done`

## Supabase Migration (Future)

The app currently uses a mock database but is **ready for Supabase migration**:

- Database schemas defined in `/supabase/` directory
- Supabase client stubbed in `/lib/supabase.ts`
- All service methods abstract data access
- When migrating: replace mock DB calls with Supabase queries

## AI Integration

**Google Gemini** powers content generation:

- Model: Gemini 2.5 Flash (text), Gemini 2.5 Flash Image (images)
- Location: `/components/ideas/CreateIdeaModal.tsx`
- Features: Auto-generated titles, captions, hashtags, reference images
- Error handling: Partial results on failure

## Important Patterns

### Adding New Features

1. Create service in `/services/` for business logic
2. Update types in `/types.ts`
3. Add UI components in appropriate `/components/` subdirectory
4. Use existing Context providers for global state
5. Follow RBAC patterns for permissions

### Routing

- Uses `HashRouter` for client-side routing
- Routes defined in `/App.tsx`
- `ProtectedRoute` wrapper for authenticated pages
- `PublicRoute` wrapper for unauthenticated pages

### Data Persistence

- User session: localStorage (`auth_user`, `current_organization`)
- Mock database: localStorage (`easyup_mock_db_v18_full_data`)
- Theme preference: localStorage (`theme`)

## Multi-Tenant Architecture

- Users belong to multiple organizations via `user_organizations` join table
- Projects belong to one organization
- Organization switching updates context without re-login
- Invitation system for adding users to organizations
