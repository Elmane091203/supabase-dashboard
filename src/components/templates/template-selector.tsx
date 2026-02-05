/**
 * Template Selector Component
 * Select a template for new project creation
 */

'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ProjectTemplate } from '@/types/template'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TemplateSelectorProps {
  templates: ProjectTemplate[]
  selectedTemplateId: string | undefined
  onTemplateSelect: (templateId: string) => void
}

export function TemplateSelector({
  templates,
  selectedTemplateId,
  onTemplateSelect,
}: TemplateSelectorProps) {
  return (
    <div>
      <label className="text-sm font-medium text-white mb-3 block">
        Choose a template
      </label>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplateSelect(template.id)}
            className="text-left"
          >
            <Card
              className={cn(
                'cursor-pointer border-2 transition-all',
                selectedTemplateId === template.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              )}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-white">{template.name}</h3>
                  {selectedTemplateId === template.id && (
                    <Check className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <p className="text-sm text-slate-400 mb-3">
                  {template.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {template.schema_structure.tables.length > 0 ? (
                    <>
                      <Badge variant="secondary" className="bg-slate-700/50 text-slate-200 text-xs">
                        {template.schema_structure.tables.length} table
                        {template.schema_structure.tables.length !== 1 ? 's' : ''}
                      </Badge>
                      {template.schema_structure.tables.map((table) => (
                        <Badge
                          key={table.name}
                          variant="secondary"
                          className="bg-slate-700/50 text-slate-200 text-xs"
                        >
                          {table.name}
                        </Badge>
                      ))}
                    </>
                  ) : (
                    <Badge variant="secondary" className="bg-slate-700/50 text-slate-200 text-xs">
                      Empty
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          </button>
        ))}
      </div>
    </div>
  )
}
