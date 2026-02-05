-- Migration 001: Initial Schema
-- Create core tables for Supabase Multi-Project Dashboard

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  schema_name TEXT UNIQUE NOT NULL,
  database_url TEXT,
  api_url TEXT,

  settings JSONB DEFAULT '{}'::jsonb,
  features JSONB DEFAULT '{
    "auth": true,
    "storage": true,
    "realtime": true,
    "functions": true
  }'::jsonb,

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'provisioning', 'active', 'suspended', 'deleted')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  provisioned_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,

  limits JSONB DEFAULT '{
    "max_users": 1000,
    "max_storage_mb": 1024,
    "max_api_calls_per_day": 100000
  }'::jsonb,

  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create project_credentials table
CREATE TABLE IF NOT EXISTS public.project_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,

  credential_type TEXT NOT NULL CHECK (credential_type IN ('anon_key', 'service_key', 'jwt_secret')),
  credential_value TEXT NOT NULL,

  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  UNIQUE(project_id, credential_type)
);

-- Create project_templates table
CREATE TABLE IF NOT EXISTS public.project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,

  schema_structure JSONB NOT NULL,
  default_policies JSONB,
  default_buckets JSONB,
  default_functions JSONB,
  seed_data JSONB,

  is_public BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create project_members table
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),

  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,

  UNIQUE(project_id, user_id)
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),

  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,

  details JSONB,
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create project_stats table
CREATE TABLE IF NOT EXISTS public.project_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,

  date DATE NOT NULL,

  users_count INTEGER DEFAULT 0,
  api_calls_count INTEGER DEFAULT 0,
  storage_usage_mb NUMERIC DEFAULT 0,

  tables_count INTEGER DEFAULT 0,
  rows_count INTEGER DEFAULT 0,

  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_credentials_project_id ON public.project_credentials(project_id);
CREATE INDEX IF NOT EXISTS idx_project_credentials_is_active ON public.project_credentials(is_active);

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_project_id ON public.audit_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_stats_project_id ON public.project_stats(project_id);
CREATE INDEX IF NOT EXISTS idx_project_stats_date ON public.project_stats(date DESC);

-- Insert default templates
INSERT INTO public.project_templates (name, description, category, schema_structure, is_system, is_public, created_at, updated_at) VALUES
(
  'Healthcare',
  'Database template for healthcare applications with patients, appointments, and prescriptions',
  'Healthcare',
  '{
    "tables": [
      {
        "name": "patients",
        "columns": [
          {"name": "id", "type": "uuid", "primary": true, "default": "gen_random_uuid()"},
          {"name": "first_name", "type": "text", "required": true},
          {"name": "last_name", "type": "text", "required": true},
          {"name": "date_of_birth", "type": "date"},
          {"name": "email", "type": "text"},
          {"name": "phone", "type": "text"},
          {"name": "created_at", "type": "timestamptz", "default": "now()"}
        ]
      },
      {
        "name": "appointments",
        "columns": [
          {"name": "id", "type": "uuid", "primary": true, "default": "gen_random_uuid()"},
          {"name": "patient_id", "type": "uuid", "required": true, "references": "patients(id)"},
          {"name": "appointment_date", "type": "timestamptz", "required": true},
          {"name": "notes", "type": "text"},
          {"name": "status", "type": "text", "default": "scheduled"},
          {"name": "created_at", "type": "timestamptz", "default": "now()"}
        ]
      },
      {
        "name": "prescriptions",
        "columns": [
          {"name": "id", "type": "uuid", "primary": true, "default": "gen_random_uuid()"},
          {"name": "patient_id", "type": "uuid", "required": true, "references": "patients(id)"},
          {"name": "medication", "type": "text", "required": true},
          {"name": "dosage", "type": "text", "required": true},
          {"name": "instructions", "type": "text"},
          {"name": "created_at", "type": "timestamptz", "default": "now()"}
        ]
      }
    ]
  }'::jsonb,
  true,
  true,
  NOW(),
  NOW()
),
(
  'Education',
  'Database template for educational platforms with students, courses, and enrollments',
  'Education',
  '{
    "tables": [
      {
        "name": "students",
        "columns": [
          {"name": "id", "type": "uuid", "primary": true, "default": "gen_random_uuid()"},
          {"name": "first_name", "type": "text", "required": true},
          {"name": "last_name", "type": "text", "required": true},
          {"name": "email", "type": "text", "required": true},
          {"name": "enrollment_date", "type": "date"},
          {"name": "created_at", "type": "timestamptz", "default": "now()"}
        ]
      },
      {
        "name": "courses",
        "columns": [
          {"name": "id", "type": "uuid", "primary": true, "default": "gen_random_uuid()"},
          {"name": "title", "type": "text", "required": true},
          {"name": "description", "type": "text"},
          {"name": "instructor", "type": "text"},
          {"name": "credits", "type": "integer"},
          {"name": "created_at", "type": "timestamptz", "default": "now()"}
        ]
      },
      {
        "name": "enrollments",
        "columns": [
          {"name": "id", "type": "uuid", "primary": true, "default": "gen_random_uuid()"},
          {"name": "student_id", "type": "uuid", "required": true, "references": "students(id)"},
          {"name": "course_id", "type": "uuid", "required": true, "references": "courses(id)"},
          {"name": "grade", "type": "text"},
          {"name": "enrollment_date", "type": "date", "default": "CURRENT_DATE"},
          {"name": "created_at", "type": "timestamptz", "default": "now()"}
        ]
      }
    ]
  }'::jsonb,
  true,
  true,
  NOW(),
  NOW()
),
(
  'E-commerce',
  'Database template for e-commerce platforms with products, orders, and customers',
  'E-commerce',
  '{
    "tables": [
      {
        "name": "customers",
        "columns": [
          {"name": "id", "type": "uuid", "primary": true, "default": "gen_random_uuid()"},
          {"name": "name", "type": "text", "required": true},
          {"name": "email", "type": "text", "required": true},
          {"name": "phone", "type": "text"},
          {"name": "address", "type": "text"},
          {"name": "created_at", "type": "timestamptz", "default": "now()"}
        ]
      },
      {
        "name": "products",
        "columns": [
          {"name": "id", "type": "uuid", "primary": true, "default": "gen_random_uuid()"},
          {"name": "name", "type": "text", "required": true},
          {"name": "description", "type": "text"},
          {"name": "price", "type": "numeric", "required": true},
          {"name": "stock_quantity", "type": "integer"},
          {"name": "created_at", "type": "timestamptz", "default": "now()"}
        ]
      },
      {
        "name": "orders",
        "columns": [
          {"name": "id", "type": "uuid", "primary": true, "default": "gen_random_uuid()"},
          {"name": "customer_id", "type": "uuid", "required": true, "references": "customers(id)"},
          {"name": "order_date", "type": "timestamptz", "default": "now()"},
          {"name": "total_amount", "type": "numeric", "required": true},
          {"name": "status", "type": "text", "default": "pending"},
          {"name": "created_at", "type": "timestamptz", "default": "now()"}
        ]
      }
    ]
  }'::jsonb,
  true,
  true,
  NOW(),
  NOW()
),
(
  'Blank',
  'Empty database template - start from scratch',
  'General',
  '{
    "tables": []
  }'::jsonb,
  true,
  true,
  NOW(),
  NOW()
);
