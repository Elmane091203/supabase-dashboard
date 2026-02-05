/**
 * Templates API
 * API calls for template management
 */

import { getSupabaseClient } from '@/lib/supabase/client'
import { DEFAULT_TEMPLATES } from '@/types/template'
import type { ProjectTemplate } from '@/types/template'

export async function fetchTemplates(): Promise<ProjectTemplate[]> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('project_templates')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (error) {
      // Return default templates if table doesn't exist yet
      if (error.code === 'PGRST116' || error.code === 'PGRST301') {
        return DEFAULT_TEMPLATES
      }
      throw error
    }

    return data && data.length > 0 ? data : DEFAULT_TEMPLATES
  } catch (error) {
    // Fallback to hardcoded defaults
    console.error('Error fetching templates:', error)
    return DEFAULT_TEMPLATES
  }
}

export async function fetchTemplateById(id: string): Promise<ProjectTemplate | null> {
  try {
    // Check if it's a default template
    const defaultTemplate = DEFAULT_TEMPLATES.find((t) => t.id === id)
    if (defaultTemplate) return defaultTemplate

    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('project_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  } catch (error) {
    console.error('Error fetching template:', error)
    return null
  }
}

export async function createTemplate(template: Omit<ProjectTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<ProjectTemplate> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('project_templates')
    .insert([template])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateTemplate(id: string, template: Partial<ProjectTemplate>): Promise<ProjectTemplate> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('project_templates')
    .update(template)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteTemplate(id: string): Promise<void> {
  const supabase = getSupabaseClient()
  const { error } = await supabase
    .from('project_templates')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}
