/**
 * Project Creation Form
 * Form for creating a new project
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { TemplateSelector } from '@/components/templates/template-selector'
import { useCreateProject } from '@/hooks/use-projects'
import { useTemplates } from '@/hooks/use-templates'
import { Loader2 } from 'lucide-react'
import { slugify } from '@/lib/utils'

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  id: z
    .string()
    .min(1, 'Project ID is required')
    .max(63)
    .regex(/^[a-z0-9-]+$/, 'Project ID must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  template_id: z.string().uuid('Invalid template').optional(),
})

type CreateProjectFormValues = z.infer<typeof createProjectSchema>

export function ProjectForm() {
  const router = useRouter()
  const { data: templates, isLoading: templatesLoading } = useTemplates()
  const { mutate: createProject, isPending } = useCreateProject()
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>()

  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      id: '',
      description: '',
      template_id: undefined,
    },
  })

  function onNameChange(value: string) {
    form.setValue('name', value)
    // Auto-generate ID from name
    const autoId = slugify(value)
    form.setValue('id', autoId)
  }

  function onSubmit(values: CreateProjectFormValues) {
    createProject(
      {
        id: values.id,
        name: values.name,
        description: values.description,
        template_id: selectedTemplateId,
      },
      {
        onSuccess: (project) => {
          toast.success(`Project "${project.name}" created successfully!`)
          router.push(`/projects/${project.id}`)
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

  if (templatesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Project Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Project Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="My Awesome Project"
                  disabled={isPending}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 transition-all duration-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e)
                    onNameChange(e.target.value)
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Project ID */}
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Project ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="my-awesome-project"
                  disabled={isPending}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 font-mono text-sm transition-all duration-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50"
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-slate-400">
                Unique identifier for your project (lowercase, numbers, hyphens only)
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Description (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="A brief description of your project..."
                  disabled={isPending}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 transition-all duration-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Template Selection */}
        {templates && templates.length > 0 && (
          <TemplateSelector
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onTemplateSelect={setSelectedTemplateId}
          />
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          disabled={isPending}
          className="w-full font-medium py-2 h-auto"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? 'Creating project...' : 'Create Project'}
        </Button>
      </form>
    </Form>
  )
}
