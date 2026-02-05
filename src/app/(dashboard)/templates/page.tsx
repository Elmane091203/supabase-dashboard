/**
 * Templates Page
 * Browse available project templates
 */

'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTemplates } from '@/hooks/use-templates'
import { Skeleton } from '@/components/ui/skeleton'
import { Database, ArrowRight } from 'lucide-react'

export default function TemplatesPage() {
  const { data: templates, isLoading } = useTemplates()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Templates</h1>
        <p className="text-slate-400">
          Start your project with a predefined template or begin with a blank slate
        </p>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg bg-slate-800/50" />
          ))}
        </div>
      ) : !templates || templates.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <p className="text-center text-slate-400 text-sm">No templates available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors flex flex-col"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    {template.category && (
                      <CardDescription className="text-xs capitalize mt-1">
                        {template.category}
                      </CardDescription>
                    )}
                  </div>
                  {template.is_system && (
                    <Badge variant="secondary" className="text-xs whitespace-nowrap">
                      System
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <p className="text-sm text-slate-400">{template.description}</p>

                {/* Tables */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-300 flex items-center gap-2">
                    <Database className="h-3 w-3" />
                    {template.schema_structure?.tables?.length || 0} Tables
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.schema_structure?.tables && template.schema_structure.tables.length > 0 ? (
                      template.schema_structure.tables.slice(0, 5).map((table) => (
                        <Badge
                          key={table.name}
                          variant="secondary"
                          className="bg-slate-700/50 text-slate-200 text-xs"
                        >
                          {table.name}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Empty Template
                      </Badge>
                    )}
                    {template.schema_structure?.tables && template.schema_structure.tables.length > 5 && (
                      <Badge variant="secondary" className="text-xs text-slate-400">
                        +{template.schema_structure.tables.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Buckets */}
                {template.default_buckets && template.default_buckets.length > 0 && (
                  <div className="text-xs text-slate-400">
                    {template.default_buckets.length} Storage bucket{template.default_buckets.length !== 1 ? 's' : ''}
                  </div>
                )}

                {/* CTA Button */}
                <Link
                  href={`/projects/new?template=${template.id}`}
                  className="block mt-4"
                >
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Use Template
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
