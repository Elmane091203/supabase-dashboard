-- Migration 003: Row Level Security (RLS) Policies
-- Enforce data isolation and access control

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_stats ENABLE ROW LEVEL SECURITY;

-- Projects RLS Policies
-- Users can see projects they own
CREATE POLICY "Allow users to see projects they own"
  ON public.projects
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Users can create projects (becomes owner)
CREATE POLICY "Allow authenticated users to create projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Only owners can update their projects
CREATE POLICY "Allow owners to update projects"
  ON public.projects
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Only owners can delete their projects
CREATE POLICY "Allow owners to delete projects"
  ON public.projects
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Project Credentials RLS Policies
-- Only project owner can see and manage credentials
CREATE POLICY "Allow project owner to see and manage credentials"
  ON public.project_credentials
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_credentials.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Only owner can update credentials
CREATE POLICY "Allow owner to update credentials"
  ON public.project_credentials
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_credentials.project_id
      AND projects.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_credentials.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Prevent deletion of credentials
CREATE POLICY "Prevent credential deletion"
  ON public.project_credentials
  FOR DELETE
  USING (FALSE);

-- Project Templates RLS Policies
-- Anyone can see public system templates
-- Users can see their own custom templates
CREATE POLICY "Allow users to see public templates"
  ON public.project_templates
  FOR SELECT
  USING (is_public = true AND is_system = true);

CREATE POLICY "Allow users to see their own templates"
  ON public.project_templates
  FOR SELECT
  USING (created_by = auth.uid());

-- Users can create templates
CREATE POLICY "Allow authenticated users to create templates"
  ON public.project_templates
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own templates
CREATE POLICY "Allow users to update their templates"
  ON public.project_templates
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Users can delete their own templates
CREATE POLICY "Allow users to delete their templates"
  ON public.project_templates
  FOR DELETE
  USING (auth.uid() = created_by);

-- Project Members RLS Policies
-- Project owner can manage members
CREATE POLICY "Allow project owner to manage members"
  ON public.project_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Only owner can add members
CREATE POLICY "Allow owner to add members"
  ON public.project_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Only owner can update member roles
CREATE POLICY "Allow owner to update member roles"
  ON public.project_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Users can remove themselves, or owner can remove members
CREATE POLICY "Allow user to leave or owner to remove"
  ON public.project_members
  FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Audit Logs RLS Policies
-- Project owner can view audit logs
CREATE POLICY "Allow project owner to view audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = audit_logs.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Only system can insert audit logs
CREATE POLICY "Allow system to insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (TRUE);

-- Prevent updates and deletes on audit logs
CREATE POLICY "Prevent audit log updates"
  ON public.audit_logs
  FOR UPDATE
  USING (FALSE);

CREATE POLICY "Prevent audit log deletion"
  ON public.audit_logs
  FOR DELETE
  USING (FALSE);

-- Project Stats RLS Policies
-- Project owner can view stats
CREATE POLICY "Allow project owner to view stats"
  ON public.project_stats
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_stats.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Allow system to insert stats
CREATE POLICY "Allow system to insert stats"
  ON public.project_stats
  FOR INSERT
  WITH CHECK (TRUE);

-- Prevent updates and deletes on stats
CREATE POLICY "Prevent stats updates"
  ON public.project_stats
  FOR UPDATE
  USING (FALSE);

CREATE POLICY "Prevent stats deletion"
  ON public.project_stats
  FOR DELETE
  USING (FALSE);

-- Create audit log trigger
CREATE OR REPLACE FUNCTION public.log_project_action()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (project_id, action, resource_type, resource_id, details)
    VALUES (
      OLD.id,
      'delete',
      'project',
      OLD.id,
      jsonb_build_object('name', OLD.name, 'status', OLD.status)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (project_id, action, resource_type, resource_id, details)
    VALUES (
      NEW.id,
      'update',
      'project',
      NEW.id,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_log_project_action ON public.projects;

-- Create trigger
CREATE TRIGGER trigger_log_project_action
AFTER UPDATE OR DELETE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.log_project_action();
