# Supabase Multi-Project Dashboard - Setup Instructions

## Prerequisites

- Node.js 18+ and pnpm
- A self-hosted Supabase instance (or Cloud project)
- Supabase credentials (URL, Anon Key, Service Key)

## Step 1: Environment Variables

Create a `.env.local` file in the root directory with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-instance.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here
```

You can find these in your Supabase project settings.

## Step 2: Deploy Database Schema & Functions

### Option A: Via Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run each migration file in order:
   - `supabase/migrations/001_initial_schema.sql` - Creates all tables
   - `supabase/migrations/002_functions.sql` - Creates PostgreSQL functions
   - `supabase/migrations/003_rls_policies.sql` - Enables Row Level Security

### Option B: Via Supabase CLI

```bash
supabase db push
```

## Step 3: Deploy Edge Functions

Deploy the Deno Edge Functions to handle project provisioning:

```bash
supabase functions deploy provision-project
supabase functions deploy delete-project
supabase functions deploy get-project-stats
```

## Step 4: Start the Application

```bash
# Install dependencies (if not done yet)
pnpm install

# Run development server
pnpm dev
```

The application will be available at `http://localhost:3000`

## Step 5: Test the Application

### Create a Test Account

1. Go to `http://localhost:3000/auth/register`
2. Create a new account with:
   - Email: `test@example.com`
   - Password: `TestPassword123` (minimum 8 characters)

### Test User Flow

1. **Login**: Navigate to `/auth/login` and sign in with your credentials
2. **Create Project**: Click "New Project" and create a project:
   - Name: `My First Project`
   - ID: `my-first-project` (auto-generated from name)
   - Template: Select "Blank" or any template
3. **View Project**: Click the project card to see its details
4. **Check API Keys**: Go to the "API Keys" tab to see credentials (masked by default)
5. **View Templates**: Go to `/templates` to see available templates
6. **List Projects**: Go back to `/projects` to see your created project in the list

### Verification

Check that:
- ✅ Projects table is populated in Supabase SQL
- ✅ New PostgreSQL schema is created (named `project_my-first-project`)
- ✅ Credentials are generated and stored
- ✅ User can view, search, and filter projects
- ✅ Error messages display for invalid inputs
- ✅ Loading states appear during operations

## Troubleshooting

### Database Connection Error

**Problem**: "Failed to connect to database"

**Solution**:
1. Verify your `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check that your Supabase instance is running
3. Verify network connectivity to the instance

### Authentication Fails

**Problem**: "Invalid credentials" or "User not found"

**Solution**:
1. Make sure you ran the database migrations (Step 2)
2. Verify email format is valid
3. Check that Supabase Auth is enabled in your instance

### Project Creation Fails

**Problem**: "Failed to provision project"

**Solution**:
1. Verify Edge Functions are deployed (Step 3)
2. Check that the `SUPABASE_SERVICE_KEY` has sufficient permissions
3. Look at browser console for detailed error messages
4. Verify the project ID format is valid (lowercase, numbers, hyphens only)

### Schema Not Created

**Problem**: PostgreSQL schema `project_*` not created after project creation

**Solution**:
1. Check Edge Function logs in Supabase Dashboard
2. Verify the `provision_new_project()` PostgreSQL function exists
3. Check database RLS policies are not blocking the operation

## Development Commands

```bash
# Run development server
pnpm dev

# Type check
pnpm type-check

# Format code
pnpm format

# Lint code
pnpm lint

# Build for production
pnpm build

# Run production build
pnpm start
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages and API routes
├── components/       # React components (organized by feature)
├── hooks/            # Custom React hooks (React Query, auth)
├── lib/              # Utilities, API clients, Supabase config
├── stores/           # Zustand stores (global state)
├── types/            # TypeScript type definitions
└── styles/           # Global CSS

supabase/
├── migrations/       # SQL migrations (schema, functions, RLS)
└── functions/        # Deno Edge Functions
```

## Architecture Overview

1. **Frontend**: Next.js 14 with React 18, TypeScript, Tailwind CSS
2. **State**: Zustand for auth, React Query for server state
3. **Forms**: React Hook Form with Zod validation
4. **API**: Next.js API routes that call Edge Functions
5. **Backend**: Deno Edge Functions + PostgreSQL functions
6. **Database**: Supabase PostgreSQL with RLS policies
7. **Auth**: Supabase Auth with email/password

## Next Steps

After verifying the MVP works:

1. **Deploy Edge Functions** to production Supabase instance
2. **Configure Environment Variables** for production
3. **Run Database Migrations** on production database
4. **Deploy Frontend** to Vercel, Netlify, or your hosting service
5. **Monitor and Test** the application in production

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review Supabase documentation: https://supabase.com/docs
3. Check Next.js documentation: https://nextjs.org/docs
4. Review application logs in browser DevTools and server console

## Notes

- The application uses PostgreSQL Row Level Security (RLS) to enforce data isolation
- All credentials (API keys) are masked by default and require "Reveal" action
- Projects are stored in PostgreSQL schema format for true isolation
- Soft delete is used for projects (status = 'deleted') to maintain audit trail
