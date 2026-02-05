# Supabase Configuration

This directory contains Supabase configuration, migrations, and Edge Functions.

## Migrations

### How to Run Migrations

1. **Via Supabase Dashboard SQL Editor** (Easiest for self-hosted):
   - Go to your Supabase Dashboard
   - Navigate to SQL Editor
   - Copy the contents of each migration file in order:
     1. `migrations/001_initial_schema.sql`
     2. `migrations/002_functions.sql`
     3. `migrations/003_rls_policies.sql`
   - Run each SQL script in the SQL Editor

2. **Via Supabase CLI** (If installed):
   ```bash
   supabase db push
   ```

### Migration Order

**Important**: Run migrations in this order:
1. `001_initial_schema.sql` - Creates tables and inserts default templates
2. `002_functions.sql` - Creates PostgreSQL functions
3. `003_rls_policies.sql` - Enables RLS and policies

## Edge Functions

Edge Functions are located in `functions/` and handle server-side logic.

### Deploy Edge Functions

```bash
supabase functions deploy provision-project
supabase functions deploy delete-project
supabase functions deploy get-project-stats
```

### Test Edge Functions

```bash
curl -X POST https://your-supabase-url/functions/v1/provision-project \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"project_id":"test","name":"Test Project","template_id":null,"owner_id":"..."}'
```

## Verification

After running migrations, verify the setup:

```sql
-- Check tables created
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check templates inserted
SELECT name, is_system FROM public.project_templates;

-- Check functions created
SELECT routinename FROM information_schema.routines WHERE routine_schema = 'public';

-- Check RLS enabled
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;
```
