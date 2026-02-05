/**
 * Credentials Display Component
 * Show and manage project API credentials
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import type { ProjectCredentials } from '@/types/credentials'

interface CredentialsDisplayProps {
  projectId: string
  credentials: {
    api_url: string
    anon_key?: ProjectCredentials
    service_key?: ProjectCredentials
    jwt_secret?: ProjectCredentials
    database_url?: string
  } | null
  isLoading: boolean
  onRegenerateClick: (type: string) => void
}

export function CredentialsDisplay({
  projectId,
  credentials,
  isLoading,
  onRegenerateClick,
}: CredentialsDisplayProps) {
  const [showSecrets, setShowSecrets] = useState(false)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const CredentialRow = ({
    label,
    type,
    credential,
  }: {
    label: string
    type: string
    credential?: ProjectCredentials
  }) => {
    if (!credential) return null

    const displayValue = showSecrets
      ? credential.credential_value
      : '•'.repeat(Math.min(credential.credential_value.length, 32))

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-white">{label}</label>
          {type !== 'anon_key' && (
            <Badge variant="outline" className="text-xs">
              {credential.is_active ? 'Active' : 'Inactive'}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 bg-slate-900/50 rounded px-3 py-2">
          <code className="flex-1 text-xs text-slate-300 font-mono break-all">
            {displayValue}
          </code>
          <button
            onClick={() => copyToClipboard(credential.credential_value, label)}
            className="text-slate-400 hover:text-white transition-colors"
            title="Copy to clipboard"
          >
            <Copy className="h-4 w-4" />
          </button>
          {type !== 'anon_key' && (
            <button
              onClick={() => onRegenerateClick(type)}
              className="text-slate-400 hover:text-yellow-400 transition-colors"
              title="Regenerate key"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    )
  }

  if (!credentials) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-6">
          <p className="text-slate-400 text-sm">Failed to load credentials</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* API URL */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-base">API Endpoint</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 bg-slate-900/50 rounded px-3 py-2">
            <code className="flex-1 text-xs text-slate-300 font-mono break-all">
              {credentials.api_url}
            </code>
            <button
              onClick={() => copyToClipboard(credentials.api_url, 'API URL')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Credentials */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">API Keys</CardTitle>
              <CardDescription>Your project credentials</CardDescription>
            </div>
            <button
              onClick={() => setShowSecrets(!showSecrets)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              {showSecrets ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Show
                </>
              )}
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <CredentialRow
            label="Anon Key (Public)"
            type="anon_key"
            credential={credentials.anon_key}
          />
          <div className="border-t border-slate-700 pt-4">
            <CredentialRow
              label="Service Key (Secret)"
              type="service_key"
              credential={credentials.service_key}
            />
          </div>
          {credentials.jwt_secret && (
            <div className="border-t border-slate-700 pt-4">
              <CredentialRow
                label="JWT Secret"
                type="jwt_secret"
                credential={credentials.jwt_secret}
              />
            </div>
          )}
          {credentials.database_url && (
            <div className="border-t border-slate-700 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Database URL</label>
                <div className="flex items-center gap-2 bg-slate-900/50 rounded px-3 py-2">
                  <code className="flex-1 text-xs text-slate-300 font-mono break-all">
                    {showSecrets ? credentials.database_url : '•'.repeat(40)}
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(credentials.database_url || '', 'Database URL')
                    }
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <div className="rounded-lg border border-blue-800/50 bg-blue-950/20 p-4 text-sm text-blue-300">
        <p className="font-medium mb-2">🔒 Security Tips</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Never share your service key or JWT secret</li>
          <li>Regenerate keys if compromised</li>
          <li>Use anon key for browser clients only</li>
          <li>Service key should only be used server-side</li>
        </ul>
      </div>
    </div>
  )
}
