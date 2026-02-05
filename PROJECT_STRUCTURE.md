# Project Structure & File Reference

Complete reference guide for all files in the Supabase Multi-Project Dashboard.

## Quick Overview

```
supabase-dashboard/
├── public/                    # Static assets
├── src/
│   ├── app/                  # Next.js App Router pages and layouts
│   ├── components/           # Reusable React components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities, API clients, configuration
│   ├── stores/               # Zustand state management
│   ├── types/                # TypeScript type definitions
│   └── styles/               # Global CSS
├── supabase/
│   ├── migrations/           # Database migrations (SQL)
│   └── functions/            # Edge Functions (Deno/TypeScript)
├── middleware.ts             # Next.js auth middleware
├── package.json              # Dependencies
├── next.config.js            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.ts        # Tailwind CSS configuration
└── .env.local                # Environment variables (NOT in git)
```

## Database Layer

### Migrations

**Path**: `supabase/migrations/`

These SQL files set up the PostgreSQL database and must be run in order.

#### `001_initial_schema.sql`
**Purpose**: Creates core database tables and inserts default data

**Tables created**:
- `projects` - Main projects table with name, owner, status, schema info
- `project_credentials` - API keys, service keys, JWT secrets
- `project_templates` - Reusable templates (Healthcare, Education, E-commerce, Blank)
- `project_members` - Team members with role assignments
- `audit_logs` - Activity history for compliance
- `project_stats` - Metrics and statistics per project

**Indexes**: Created on frequently queried columns (owner_id, status, created_at)

**Default data**: Inserts 4 system templates

**Run first**: Required before anything else works

#### `002_functions.sql`
**Purpose**: Creates PostgreSQL functions that handle business logic

**Functions created**:

1. **provision_new_project()** ⭐ CRITICAL
   - Creates new PostgreSQL schema (project_{id})
   - Creates tables based on selected template
   - Generates API credentials (anon_key, service_key, jwt_secret)
   - Adds owner to project_members with role='owner'
   - Logs action to audit_logs
   - **Called by**: POST /api/projects

2. **delete_project()**
   - Soft deletes project (status = 'deleted')
   - Optionally drops schema (CASCADE)
   - Removes credentials, members, stats
   - **Called by**: DELETE /api/projects/[id]

3. **regenerate_credentials()**
   - Generates new API key
   - Marks old credential as inactive
   - **Called by**: POST /api/projects/[id]/credentials/regenerate

4. **get_project_stats()**
   - Counts users, tables, rows in project schema
   - Calculates storage usage
   - Returns JSON stats
   - **Called by**: GET /api/projects/[id] (in background)

5. **add_project_member()**
   - Adds team member to project
   - Validates requester is owner/admin
   - **Called by**: POST /api/projects/[id]/members

6. **update_member_role()**
   - Changes member's role
   - Prevents removing last owner
   - **Called by**: PATCH /api/projects/[id]/members/[userId]

**Run second**: Required after schema is created

#### `003_rls_policies.sql`
**Purpose**: Enables Row Level Security (RLS) for data isolation

**Policies by table**:

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| projects | Member OR Owner | Auth user | Owner/Admin | Owner |
| project_credentials | Owner/Admin | Function | Owner | Never |
| project_members | Member | Owner/Admin | Owner/Admin | Owner OR Self |
| audit_logs | Member | Trigger | Never | Never |
| project_stats | Member | Function | Never | Never |

**Run third**: Completes database setup

---

## Backend: Edge Functions

**Path**: `supabase/functions/`

Deno-based serverless functions deployed to Supabase. Handle heavy operations that can timeout on API routes.

### `provision-project/index.ts`
**When called**: User clicks "Create Project"
**Flow**:
1. Receives JSON: { project_id, name, template_id, owner_id }
2. Calls Supabase admin client with SERVICE_KEY
3. Executes PostgreSQL function: provision_new_project()
4. Returns: { success, project_id, credentials, schema_name }
5. Frontend gets response → stores in DB via React Query

**Error handling**: Catches provision errors, returns descriptive message

### `delete-project/index.ts`
**When called**: User confirms project deletion
**Flow**:
1. Verifies user is project owner (via RLS)
2. Calls PostgreSQL function: delete_project()
3. Returns: { success, message }

### `get-project-stats/index.ts`
**When called**: Periodically or on project details page
**Flow**:
1. Receives: { project_id, start_date, end_date }
2. Calls PostgreSQL function: get_project_stats()
3. Returns: { users_count, tables_count, rows_count, storage_mb }

---

## Frontend: Configuration & Setup

**Path**: `src/lib/supabase/`

### `client.ts`
**Purpose**: Browser-side Supabase client
**Exports**:
- `createBrowserClient()` - Initializes Supabase with PKCE auth flow
- `supabase` - Singleton instance

**Used in**: All client-side components for queries/mutations

**Security**: Uses NEXT_PUBLIC keys (intentional - browser needs these)

### `server.ts`
**Purpose**: Server-side Supabase client with service account
**Exports**:
- `createServerClient()` - Uses SERVICE_KEY for elevated permissions
- `supabase` - Singleton instance

**Used in**: API routes, Edge Functions
**Security**: Uses SERVICE_KEY (secret - never exposed to browser)

### `middleware.ts`
**Purpose**: Helper for Next.js middleware auth checks
**Exports**:
- `updateSession()` - Refreshes auth session from cookies

**Used in**: `/middleware.ts` (root)

### `database.types.ts`
**Purpose**: Auto-generated TypeScript types from Supabase schema
**Exports**:
- All table types: `Database['public']['Tables']['projects']['Row']`
- Enum types: `ProjectStatus`, `MemberRole`

**Generated by**: `supabase gen types typescript --local > src/lib/supabase/database.types.ts`

---

## Frontend: Type Definitions

**Path**: `src/types/`

All TypeScript interfaces and types that extend database types with app-specific logic.

### `project.ts`
```typescript
- Project           // Extended project with computed fields
- ProjectStatus     // 'pending' | 'provisioning' | 'active' | 'suspended' | 'deleted'
- CreateProjectInput // Form input validation
- UpdateProjectInput
- ProjectFeature    // Individual feature flags
```

### `credentials.ts`
```typescript
- ProjectCredentials    // Credential record from DB
- CredentialType        // 'anon_key' | 'service_key' | 'jwt_secret'
- CredentialsDisplay    // UI-focused: with masked property
- RevealedCredentials   // For showing full values
```

### `template.ts`
```typescript
- ProjectTemplate       // Template definition
- Table                 // Schema table definition
- Column                // Column definition
- DEFAULT_TEMPLATES     // 4 built-in templates
```

### `member.ts`
```typescript
- ProjectMember         // Member record with user info
- MemberRole            // 'owner' | 'admin' | 'member' | 'viewer'
- ROLE_PERMISSIONS      // Permissions matrix by role
- ROLE_LABELS           // Display labels
- ROLE_DESCRIPTIONS     // Help text
```

### `stats.ts`
```typescript
- ProjectStats          // Statistics for single project
- DashboardStats        // Aggregated dashboard stats
- TimeSeriesStats       // Stats over time
```

---

## Frontend: State Management

**Path**: `src/stores/`

### `auth-store.ts`
**Purpose**: Global authentication state
**Zustand store with**:
- `user` - Current authenticated user
- `session` - Auth session data
- `loading` - Auth initialization loading state
- `error` - Auth error message
- `signIn()` - Email/password login
- `signUp()` - Email/password registration
- `signOut()` - Logout
- `initialize()` - Load session on app startup

**Persisted to**: localStorage (auto-rehydrate on page load)

**Used in**: Middleware, header, auth pages

---

## Frontend: Custom Hooks

**Path**: `src/hooks/`

All React Query hooks for data fetching and mutations.

### `use-auth.ts`
**Exports**:
- `useAuth()` - Access auth state
- `useSignIn()` - Login mutation
- `useSignUp()` - Register mutation
- `useSignOut()` - Logout

**Uses**: Auth store + React Query mutations

### `use-projects.ts`
**Exports**:
- `useProjects()` - Query all projects
- `useProject(id)` - Query single project
- `useCreateProject()` - Mutation: create project
- `useUpdateProject()` - Mutation: update project
- `useDeleteProject()` - Mutation: delete project
- `useSuspendProject()` - Mutation: suspend project
- `useActivateProject()` - Mutation: activate project

**Caching**: 5-minute staleTime, 10-minute gcTime

**Auto-invalidate**: Mutations invalidate related queries

### `use-templates.ts`
**Exports**:
- `useTemplates()` - Query all templates
- `useTemplate(id)` - Query single template

### `use-members.ts`
**Exports**:
- `useProjectMembers(id)` - Query project members
- `useAddMember()` - Mutation: add member
- `useUpdateMemberRole()` - Mutation: change role
- `useRemoveMember()` - Mutation: remove member

---

## Frontend: API Routes (Middleware Layer)

**Path**: `src/app/api/`

Next.js API routes that wrap Edge Functions and database calls. Handles auth, validation, error handling.

### Route Structure

```
api/
├── projects/
│   ├── route.ts                    # GET (list) + POST (create)
│   ├── [id]/
│   │   ├── route.ts                # GET (detail) + PATCH (update) + DELETE
│   │   ├── credentials/
│   │   │   ├── route.ts            # GET (view, masked)
│   │   │   └── regenerate/
│   │   │       └── route.ts        # POST (regenerate key)
│   │   └── members/
│   │       ├── route.ts            # GET (list) + POST (add)
│   │       └── [userId]/
│   │           └── route.ts        # PATCH (role) + DELETE (remove)
└── templates/
    └── route.ts                    # GET (list)
```

### `POST /api/projects` - Create Project
**Input validation**: Zod schema validates name, id, template
**Flow**:
1. Check auth (redirect to login if not)
2. Validate input with Zod
3. Check project ID uniqueness
4. Call Edge Function: `provision-project`
5. If success: return created project
6. If error: return 400/500 with message

### `GET /api/projects` - List Projects
**Flow**:
1. Check auth
2. Query from `projects` table
3. RLS automatically filters to user's projects
4. Return array of projects

### `DELETE /api/projects/[id]` - Delete Project
**Flow**:
1. Verify user is owner (RLS)
2. Call Edge Function: `delete-project`
3. Return success/error

### `GET /api/projects/[id]/credentials` - View Credentials
**Flow**:
1. Verify user is owner/admin (RLS)
2. Query credentials from `project_credentials`
3. Return with masked values (except when Reveal clicked)

### `POST /api/projects/[id]/credentials/regenerate` - Regenerate Key
**Flow**:
1. Verify user is owner
2. Call PostgreSQL function: `regenerate_credentials()`
3. Return new credential (masked by default)

---

## Frontend: Pages & Layout

**Path**: `src/app/`

### Root Layout
**File**: `src/app/layout.tsx`
**Purpose**: Global layout wrapping all pages
**Features**:
- Wraps with Providers (QueryClientProvider, Toaster)
- Global styles
- Auth initialization

### Auth Pages
**Path**: `src/app/(auth)/`

#### Layout: `layout.tsx`
- Centered card layout
- No sidebar
- Gradient background

#### Pages:
- `login/page.tsx` - Login form
- `register/page.tsx` - Registration form

### Dashboard Pages
**Path**: `src/app/(dashboard)/`

Protected layout with sidebar and header.

#### Layout: `layout.tsx`
- Sidebar navigation
- Header with user menu
- Main content area
- Redirect to login if not authenticated

#### Pages:

**Projects**:
- `/projects/page.tsx` - List projects with filters
- `/projects/new/page.tsx` - Create project form
- `/projects/[id]/page.tsx` - Project details with tabs

**Templates**:
- `/templates/page.tsx` - Browse templates

**Settings**:
- `/settings/page.tsx` - App settings (placeholder)

---

## Frontend: Components

**Path**: `src/components/`

### Layout Components
- `layout/sidebar.tsx` - Navigation sidebar
- `layout/header.tsx` - Top header with user menu
- `layout/footer.tsx` - Footer

### Auth Components
- `auth/login-form.tsx` - Login form with validation
- `auth/register-form.tsx` - Registration form

### Projects Components
- `projects/project-card.tsx` - Single project card
- `projects/project-list.tsx` - Grid of project cards
- `projects/project-form.tsx` - Create/edit form
- `projects/project-filters.tsx` - Search and filter controls
- `projects/project-tabs.tsx` - Tab navigation
- `projects/empty-projects-state.tsx` - Empty state UI

### Credentials Components
- `credentials/credentials-display.tsx` - Show API keys (masked/revealed)
- `credentials/code-snippet.tsx` - Example code for different languages
- `credentials/regenerate-dialog.tsx` - Confirm regenerate key

### Members Components
- `members/members-list.tsx` - List team members
- `members/add-member-dialog.tsx` - Add member form
- `members/member-role-select.tsx` - Change role dropdown
- `members/remove-member-dialog.tsx` - Confirm remove

### Templates Components
- `templates/template-card.tsx` - Template preview
- `templates/template-list.tsx` - Grid of templates
- `templates/template-selector.tsx` - Select template on create
- `templates/template-detail-modal.tsx` - Detailed view

### UI Components (shadcn)
- `ui/button.tsx` - Styled button
- `ui/input.tsx` - Styled input
- `ui/card.tsx` - Card container
- `ui/form.tsx` - React Hook Form wrapper
- `ui/label.tsx` - Form label
- `ui/select.tsx` - Dropdown select
- `ui/dialog.tsx` - Modal dialog
- `ui/tabs.tsx` - Tab navigation
- `ui/table.tsx` - Data table
- `ui/skeleton.tsx` - Loading placeholder
- `ui/badge.tsx` - Status badge
- `ui/checkbox.tsx` - Checkbox input
- `ui/avatar.tsx` - User avatar

### Providers
- `providers.tsx` - Provider wrapper with QueryClient

---

## Frontend: Utilities

**Path**: `src/lib/`

### `utils.ts`
**Exports**:
- `cn()` - Merge Tailwind classes
- `slugify()` - Convert text to URL-safe slug
- `formatDate()` - Format dates for display
- `formatBytes()` - Format bytes to human-readable

### `react-query.ts`
**Exports**:
- `getQueryClient()` - Configure and return QueryClient instance
**Config**:
- staleTime: 5 minutes
- gcTime: 10 minutes
- retry: 1
- refetchOnWindowFocus: false

### `api/projects.ts`
**Exports**:
- `fetchProjects()` - GET /api/projects
- `fetchProjectById(id)` - GET /api/projects/[id]
- `createProject(input)` - POST /api/projects
- `updateProject(id, input)` - PATCH /api/projects/[id]
- `deleteProject(id)` - DELETE /api/projects/[id]

### `api/templates.ts`
**Exports**:
- `fetchTemplates()` - GET /api/templates
- `fetchTemplateById(id)` - Get specific template

### `api/members.ts`
**Exports**:
- `fetchProjectMembers(projectId)`
- `addProjectMember(projectId, email, role)`
- `updateMemberRole(projectId, userId, role)`
- `removeProjectMember(projectId, userId)`

---

## Configuration Files

### `package.json`
**Key sections**:
- `dependencies` - Runtime packages (React, Next.js, Supabase, Zustand)
- `devDependencies` - Dev tools (TypeScript, Tailwind, ESLint)
- `scripts` - Commands (dev, build, start, lint, type-check)

### `next.config.js`
**Config**:
- Experimental features (allowJs: true)
- Headers security
- Redirects

### `tsconfig.json`
**Config**:
- Target ES2020
- Module system: esnext
- JSX: preserve
- Path alias: @/* → src/*

### `tailwind.config.ts`
**Config**:
- Theme colors
- Font stack
- Plugin configuration (shadcn/ui defaults)

### `.env.local` (NOT IN GIT)
**Example**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-instance.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
```

---

## Middleware

**File**: `middleware.ts` (root)

**Purpose**: Protect routes, manage auth redirects

**Logic**:
- Check if request has valid session
- If accessing auth routes while authenticated → redirect to /projects
- If accessing dashboard while not authenticated → redirect to /login
- Otherwise → allow request

**Security**: Uses cookies for auth state (secure, httpOnly)

---

## Documentation Files

### `SETUP_INSTRUCTIONS.md`
Complete setup guide:
- Prerequisites
- Environment configuration
- Database migration steps
- Edge Functions deployment
- Testing procedures
- Troubleshooting

### `TEST_SCENARIOS.md`
Comprehensive test cases:
- Auth flows (register, login, logout, session)
- Project CRUD operations
- Search and filtering
- Error handling
- Responsive design
- Database verification

### `DEPLOYMENT_GUIDE.md`
Step-by-step deployment:
- Credential retrieval
- Database setup verification
- Edge Functions deployment
- Complete end-to-end test flow
- Error troubleshooting
- Production checklist

### `PROJECT_STRUCTURE.md`
This file - complete architecture reference

### `CLAUDE.md`
Guidance for future development sessions:
- Tech stack overview
- API endpoints
- Key patterns
- Development workflow

---

## Data Flow Example: Creating a Project

```
User Interface (Browser)
        ↓
   [project-form.tsx]
        ↓
   Validate with Zod
        ↓
   Call useCreateProject() hook
        ↓
   POST /api/projects (API Route)
        ↓
   Validate input + auth check
        ↓
   Call Edge Function: provision-project
        ↓
   PostgreSQL: provision_new_project()
        ↓
   - Create schema: project_demo-project
   - Create tables from template
   - Generate credentials
   - Insert project record
   - Add owner to project_members
   - Log action to audit_logs
        ↓
   Return credentials to API route
        ↓
   API route returns to React component
        ↓
   React Query invalidates projects query
        ↓
   useProjects() refetches projects list
        ↓
   UI updates with new project card
        ↓
   Success toast notification
```

---

## Key Files by Role

### Frontend Developer
- `src/components/` - UI components to build
- `src/app/` - Pages/routes to create
- `src/hooks/use-*.ts` - Custom hooks for data

### Backend Developer
- `supabase/migrations/` - Database schemas
- `supabase/functions/` - Edge Functions
- `src/app/api/` - API route handlers

### Full-Stack Developer
- Everything! Start with data layer, then API routes, then components

### DevOps/Deployment
- `SETUP_INSTRUCTIONS.md` - Deployment steps
- `DEPLOYMENT_GUIDE.md` - Verification checklist
- `supabase/` - Database and function code

---

## File Edit Checklist

When modifying files, remember:

**Never edit directly**:
- Auto-generated files (database.types.ts)
- Compiled output files

**Always test after editing**:
- Type definitions → `pnpm type-check`
- API routes → Test with curl/Postman
- Components → Visual check in browser
- Database → Run test queries

**Always run before committing**:
- `pnpm type-check` - Check types
- `pnpm lint` - Check code style
- `pnpm test` - Run tests (if configured)

---

## Quick Reference: Common Tasks

### Add a new page
1. Create `src/app/(dashboard)/newpage/page.tsx`
2. Add to sidebar in `components/layout/sidebar.tsx`
3. Create components in `src/components/newpage/`

### Add a new API endpoint
1. Create `src/app/api/resource/route.ts`
2. Create API functions in `src/lib/api/resource.ts`
3. Create React Query hook in `src/hooks/use-resource.ts`
4. Use hook in components

### Add database functionality
1. Add SQL to migration file (new or existing)
2. Create PostgreSQL function if needed
3. Test in SQL Editor
4. Create Edge Function if needed (for heavy operations)

### Fix a bug
1. Find related files from this guide
2. Read test scenarios to understand expected behavior
3. Add test case to TEST_SCENARIOS.md
4. Fix the bug
5. Test fix manually

---

This is your complete map of the codebase! Use it as reference when:
- Debugging issues
- Adding features
- Understanding data flow
- Teaching someone else the project
