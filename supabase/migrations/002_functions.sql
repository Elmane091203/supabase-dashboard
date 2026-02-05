-- Migration 002: PostgreSQL Functions
-- Core functions for managing projects and credentials

-- Function: provision_new_project
-- Creates a new project with schema, credentials, and initial data
CREATE OR REPLACE FUNCTION public.provision_new_project(
  p_project_id TEXT,
  p_project_name TEXT,
  p_template_id UUID DEFAULT NULL,
  p_owner_id UUID DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, project_id TEXT, schema_name TEXT, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schema_name TEXT;
  v_owner_id UUID;
  v_anon_key TEXT;
  v_service_key TEXT;
  v_jwt_secret TEXT;
  v_template_id UUID;
  v_template_structure JSONB;
  v_table JSONB;
  v_column JSONB;
  v_sql TEXT;
  v_table_name TEXT;
  v_column_defs TEXT[];
BEGIN
  -- Get owner ID (use current user if not provided)
  v_owner_id := COALESCE(p_owner_id, auth.uid());

  IF v_owner_id IS NULL THEN
    RETURN QUERY SELECT false, p_project_id, NULL, 'No authenticated user provided'::TEXT;
    RETURN;
  END IF;

  -- Validate project ID format
  IF p_project_id !~ '^[a-z0-9-]+$' THEN
    RETURN QUERY SELECT false, p_project_id, NULL, 'Invalid project ID format. Use lowercase letters, numbers, and hyphens only.'::TEXT;
    RETURN;
  END IF;

  -- Generate schema name
  v_schema_name := 'project_' || p_project_id;

  -- Generate credentials (using md5 + random for simplicity without pgcrypto)
  v_anon_key := 'sk-anon-' || substring(md5(random()::text || clock_timestamp()::text), 1, 32);
  v_service_key := 'sk-service-' || substring(md5(random()::text || clock_timestamp()::text || gen_random_uuid()::text), 1, 40);
  v_jwt_secret := substring(md5(random()::text || clock_timestamp()::text || gen_random_uuid()::text), 1, 32);

  BEGIN
    -- Start transaction
    -- Create project record
    INSERT INTO public.projects (
      id, name, owner_id, schema_name, status, settings
    ) VALUES (
      p_project_id, p_project_name, v_owner_id, v_schema_name, 'provisioning', '{}'::jsonb
    );

    -- Create schema
    EXECUTE 'CREATE SCHEMA IF NOT EXISTS ' || quote_ident(v_schema_name);

    -- Get template structure if template_id is provided
    IF p_template_id IS NOT NULL THEN
      SELECT schema_structure INTO v_template_structure
      FROM public.project_templates
      WHERE id = p_template_id;

      IF v_template_structure IS NOT NULL THEN
        -- Create tables from template
        FOR v_table IN SELECT jsonb_array_elements(v_template_structure->'tables')
        LOOP
          v_table_name := v_table->>'name';
          v_column_defs := ARRAY[]::TEXT[];

          -- Build column definitions
          FOR v_column IN SELECT jsonb_array_elements(v_table->'columns')
          LOOP
            v_column_defs := array_append(
              v_column_defs,
              quote_ident(v_column->>'name') || ' ' || v_column->>'type'
            );
          END LOOP;

          -- Create table
          v_sql := 'CREATE TABLE IF NOT EXISTS ' || quote_ident(v_schema_name) || '.' || quote_ident(v_table_name) ||
                   ' (' || array_to_string(v_column_defs, ', ') || ')';
          EXECUTE v_sql;
        END LOOP;

        -- Store template ID in project metadata
        UPDATE public.projects
        SET metadata = jsonb_set(metadata, '{template_id}', to_jsonb(p_template_id))
        WHERE id = p_project_id;
      END IF;
    END IF;

    -- Store credentials
    INSERT INTO public.project_credentials (project_id, credential_type, credential_value, created_by)
    VALUES
      (p_project_id, 'anon_key', v_anon_key, v_owner_id),
      (p_project_id, 'service_key', v_service_key, v_owner_id),
      (p_project_id, 'jwt_secret', v_jwt_secret, v_owner_id);

    -- Add owner to project members
    INSERT INTO public.project_members (project_id, user_id, role, invited_at, joined_at)
    VALUES (p_project_id, v_owner_id, 'owner', NOW(), NOW());

    -- Log audit entry
    INSERT INTO public.audit_logs (project_id, user_id, action, resource_type, resource_id, details)
    VALUES (
      p_project_id,
      v_owner_id,
      'create',
      'project',
      p_project_id,
      jsonb_build_object('project_name', p_project_name, 'schema_name', v_schema_name)
    );

    -- Update project status to active
    UPDATE public.projects
    SET status = 'active', provisioned_at = NOW(), updated_at = NOW()
    WHERE id = p_project_id;

    RETURN QUERY SELECT true, p_project_id, v_schema_name, 'Project provisioned successfully'::TEXT;

  EXCEPTION WHEN OTHERS THEN
    -- Clean up on error
    BEGIN
      EXECUTE 'DROP SCHEMA IF EXISTS ' || quote_ident(v_schema_name) || ' CASCADE';
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    DELETE FROM public.projects WHERE id = p_project_id;
    RETURN QUERY SELECT false, p_project_id, NULL, 'Error provisioning project: ' || SQLERRM;
  END;
END;
$$;

-- Function: delete_project
-- Safely delete a project and all associated data
CREATE OR REPLACE FUNCTION public.delete_project(
  p_project_id TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schema_name TEXT;
  v_owner_id UUID;
BEGIN
  -- Get current user
  v_owner_id := auth.uid();

  IF v_owner_id IS NULL THEN
    RETURN QUERY SELECT false, 'No authenticated user'::TEXT;
    RETURN;
  END IF;

  -- Check if user is owner
  IF NOT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id AND user_id = v_owner_id AND role = 'owner'
  ) THEN
    RETURN QUERY SELECT false, 'Only project owner can delete project'::TEXT;
    RETURN;
  END IF;

  -- Get schema name
  SELECT schema_name INTO v_schema_name FROM public.projects WHERE id = p_project_id;

  IF v_schema_name IS NULL THEN
    RETURN QUERY SELECT false, 'Project not found'::TEXT;
    RETURN;
  END IF;

  BEGIN
    -- Drop project schema
    EXECUTE 'DROP SCHEMA IF EXISTS ' || quote_ident(v_schema_name) || ' CASCADE';

    -- Delete related data
    DELETE FROM public.project_credentials WHERE project_id = p_project_id;
    DELETE FROM public.project_members WHERE project_id = p_project_id;
    DELETE FROM public.project_stats WHERE project_id = p_project_id;

    -- Soft delete project
    UPDATE public.projects
    SET status = 'deleted', updated_at = NOW()
    WHERE id = p_project_id;

    -- Log audit entry
    INSERT INTO public.audit_logs (project_id, user_id, action, resource_type, resource_id)
    VALUES (p_project_id, v_owner_id, 'delete', 'project', p_project_id);

    RETURN QUERY SELECT true, 'Project deleted successfully'::TEXT;

  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error deleting project: ' || SQLERRM;
  END;
END;
$$;

-- Function: regenerate_credentials
-- Generate new credentials for a project
CREATE OR REPLACE FUNCTION public.regenerate_credentials(
  p_project_id TEXT,
  p_credential_type TEXT
)
RETURNS TABLE(success BOOLEAN, new_credential TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_credential TEXT;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT;
    RETURN;
  END IF;

  -- Check if user has permission
  IF NOT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id AND user_id = v_user_id AND role IN ('owner', 'admin')
  ) THEN
    RETURN QUERY SELECT false, NULL::TEXT;
    RETURN;
  END IF;

  -- Generate new credential
  v_new_credential := 'sk-' || p_credential_type || '-' || substring(md5(random()::text || clock_timestamp()::text || gen_random_uuid()::text), 1, 40);

  BEGIN
    -- Invalidate old credential
    UPDATE public.project_credentials
    SET is_active = false
    WHERE project_id = p_project_id AND credential_type = p_credential_type;

    -- Insert new credential
    INSERT INTO public.project_credentials (
      project_id, credential_type, credential_value, created_by
    ) VALUES (
      p_project_id, p_credential_type, v_new_credential, v_user_id
    );

    -- Log audit entry
    INSERT INTO public.audit_logs (project_id, user_id, action, resource_type, resource_id)
    VALUES (p_project_id, v_user_id, 'regenerate', 'credential', p_credential_type);

    RETURN QUERY SELECT true, v_new_credential::TEXT;

  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::TEXT;
  END;
END;
$$;

-- Function: get_project_stats
-- Retrieve statistics for a project
CREATE OR REPLACE FUNCTION public.get_project_stats(
  p_project_id TEXT,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  users_count INTEGER,
  api_calls_count INTEGER,
  storage_usage_mb NUMERIC,
  tables_count INTEGER,
  rows_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schema_name TEXT;
  v_total_rows INTEGER := 0;
  v_total_tables INTEGER := 0;
  v_table RECORD;
BEGIN
  -- Get schema name
  SELECT schema_name INTO v_schema_name FROM public.projects WHERE id = p_project_id;

  IF v_schema_name IS NULL THEN
    RETURN QUERY SELECT 0, 0, 0::NUMERIC, 0, 0;
    RETURN;
  END IF;

  -- Count tables in schema
  SELECT COUNT(*) INTO v_total_tables
  FROM information_schema.tables
  WHERE table_schema = v_schema_name AND table_type = 'BASE TABLE';

  -- Count total rows across all tables
  FOR v_table IN
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = v_schema_name AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE 'SELECT COUNT(*) FROM ' || quote_ident(v_schema_name) || '.' || quote_ident(v_table.table_name)
    INTO v_total_rows;
  END LOOP;

  -- Get stats from project_stats table if available
  RETURN QUERY
  SELECT
    COALESCE((SELECT users_count FROM public.project_stats WHERE project_id = p_project_id ORDER BY date DESC LIMIT 1), 0)::INTEGER,
    COALESCE((SELECT api_calls_count FROM public.project_stats WHERE project_id = p_project_id ORDER BY date DESC LIMIT 1), 0)::INTEGER,
    COALESCE((SELECT storage_usage_mb FROM public.project_stats WHERE project_id = p_project_id ORDER BY date DESC LIMIT 1), 0)::NUMERIC,
    v_total_tables,
    v_total_rows;
END;
$$;

-- Function: add_project_member
-- Add a new member to a project
CREATE OR REPLACE FUNCTION public.add_project_member(
  p_project_id TEXT,
  p_user_id UUID,
  p_role TEXT,
  p_invited_by UUID DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inviter_id UUID;
  v_inviter_role TEXT;
BEGIN
  v_inviter_id := COALESCE(p_invited_by, auth.uid());

  IF v_inviter_id IS NULL THEN
    RETURN QUERY SELECT false, 'No authenticated user'::TEXT;
    RETURN;
  END IF;

  -- Check if inviter has permission
  SELECT role INTO v_inviter_role
  FROM public.project_members
  WHERE project_id = p_project_id AND user_id = v_inviter_id;

  IF v_inviter_role NOT IN ('owner', 'admin') THEN
    RETURN QUERY SELECT false, 'Only owner or admin can invite members'::TEXT;
    RETURN;
  END IF;

  -- Validate role
  IF p_role NOT IN ('owner', 'admin', 'member', 'viewer') THEN
    RETURN QUERY SELECT false, 'Invalid role'::TEXT;
    RETURN;
  END IF;

  BEGIN
    INSERT INTO public.project_members (
      project_id, user_id, role, invited_by, invited_at
    ) VALUES (
      p_project_id, p_user_id, p_role, v_inviter_id, NOW()
    );

    INSERT INTO public.audit_logs (project_id, user_id, action, resource_type, resource_id, details)
    VALUES (
      p_project_id, v_inviter_id, 'add_member', 'member', p_user_id::TEXT,
      jsonb_build_object('role', p_role)
    );

    RETURN QUERY SELECT true, 'Member added successfully'::TEXT;

  EXCEPTION
    WHEN unique_violation THEN
      RETURN QUERY SELECT false, 'User is already a member'::TEXT;
    WHEN OTHERS THEN
      RETURN QUERY SELECT false, 'Error adding member: ' || SQLERRM;
  END;
END;
$$;

-- Function: update_member_role
-- Update a member's role in a project
CREATE OR REPLACE FUNCTION public.update_member_role(
  p_project_id TEXT,
  p_user_id UUID,
  p_new_role TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_admin_role TEXT;
  v_current_role TEXT;
  v_owner_count INTEGER;
BEGIN
  v_admin_id := auth.uid();

  IF v_admin_id IS NULL THEN
    RETURN QUERY SELECT false, 'No authenticated user'::TEXT;
    RETURN;
  END IF;

  -- Check if admin has permission
  SELECT role INTO v_admin_role
  FROM public.project_members
  WHERE project_id = p_project_id AND user_id = v_admin_id;

  IF v_admin_role NOT IN ('owner', 'admin') THEN
    RETURN QUERY SELECT false, 'Only owner or admin can update member roles'::TEXT;
    RETURN;
  END IF;

  -- Get current role
  SELECT role INTO v_current_role
  FROM public.project_members
  WHERE project_id = p_project_id AND user_id = p_user_id;

  IF v_current_role IS NULL THEN
    RETURN QUERY SELECT false, 'Member not found'::TEXT;
    RETURN;
  END IF;

  -- Prevent removing last owner
  IF v_current_role = 'owner' AND p_new_role != 'owner' THEN
    SELECT COUNT(*) INTO v_owner_count
    FROM public.project_members
    WHERE project_id = p_project_id AND role = 'owner';

    IF v_owner_count <= 1 THEN
      RETURN QUERY SELECT false, 'Cannot remove the last owner'::TEXT;
      RETURN;
    END IF;
  END IF;

  BEGIN
    UPDATE public.project_members
    SET role = p_new_role
    WHERE project_id = p_project_id AND user_id = p_user_id;

    INSERT INTO public.audit_logs (project_id, user_id, action, resource_type, resource_id, details)
    VALUES (
      p_project_id, v_admin_id, 'update_member_role', 'member', p_user_id::TEXT,
      jsonb_build_object('new_role', p_new_role, 'old_role', v_current_role)
    );

    RETURN QUERY SELECT true, 'Member role updated successfully'::TEXT;

  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error updating member role: ' || SQLERRM;
  END;
END;
$$;
