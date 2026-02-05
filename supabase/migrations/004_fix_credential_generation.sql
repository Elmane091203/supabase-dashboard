-- Migration 004: Fix credential generation (replace gen_random_bytes with md5)

-- Drop and recreate provision_new_project function
DROP FUNCTION IF EXISTS public.provision_new_project CASCADE;

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

-- Drop and recreate regenerate_credentials function
DROP FUNCTION IF EXISTS public.regenerate_credentials CASCADE;

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
BEGIN
  -- Validate credential type
  IF p_credential_type NOT IN ('anon_key', 'service_key', 'jwt_secret') THEN
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
    INSERT INTO public.project_credentials (project_id, credential_type, credential_value, created_by)
    VALUES (p_project_id, p_credential_type, v_new_credential, auth.uid());

    RETURN QUERY SELECT true, v_new_credential;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::TEXT;
  END;
END;
$$;
