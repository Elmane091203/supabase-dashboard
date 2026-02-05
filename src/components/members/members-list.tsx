/**
 * Members List Component
 * Display and manage project members
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Trash2, AlertCircle } from 'lucide-react'
import type { ProjectMember, MemberRole } from '@/types/member'
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/types/member'
import { toast } from 'sonner'

interface MembersListProps {
  projectId: string
  members: ProjectMember[] | undefined
  isLoading: boolean
  currentUserId?: string
  onAddMember: (email: string, role: MemberRole) => void
  onUpdateRole: (userId: string, role: MemberRole) => void
  onRemoveMember: (userId: string) => void
  isAddingMember?: boolean
  isUpdatingRole?: boolean
  isRemovingMember?: boolean
}

export function MembersList({
  projectId,
  members,
  isLoading,
  currentUserId,
  onAddMember,
  onUpdateRole,
  onRemoveMember,
  isAddingMember,
  isUpdatingRole,
  isRemovingMember,
}: MembersListProps) {
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<MemberRole>('member')
  const [showAddForm, setShowAddForm] = useState(false)

  const handleAddMember = async () => {
    if (!newMemberEmail) {
      toast.error('Email is required')
      return
    }

    onAddMember(newMemberEmail, newMemberRole)
    setNewMemberEmail('')
    setShowAddForm(false)
  }

  const getRoleBadgeColor = (role: MemberRole) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-600'
      case 'admin':
        return 'bg-blue-600'
      case 'member':
        return 'bg-green-600'
      case 'viewer':
        return 'bg-slate-600'
      default:
        return 'bg-slate-700'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Add Member Form */}
      {showAddForm ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-base">Add New Member</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Email</label>
              <Input
                type="email"
                placeholder="member@example.com"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                disabled={isAddingMember}
                className="bg-slate-900/50 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Role</label>
              <Select
                value={newMemberRole}
                onValueChange={(value) => setNewMemberRole(value as MemberRole)}
                disabled={isAddingMember}
              >
                <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">{ROLE_DESCRIPTIONS[newMemberRole]}</p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddMember}
                disabled={isAddingMember || !newMemberEmail}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isAddingMember ? 'Adding...' : 'Add Member'}
              </Button>
              <Button
                onClick={() => setShowAddForm(false)}
                disabled={isAddingMember}
                variant="outline"
                className="border-slate-700"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      )}

      {/* Members List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-base">Team Members</CardTitle>
          <CardDescription>
            {members?.length || 0} member{(members?.length || 0) !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!members || members.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-slate-400">
              <AlertCircle className="h-4 w-4 mr-2" />
              <p className="text-sm">No members yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {member.user?.email || 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {member.role === 'owner' && 'Project Owner'}
                      {member.role === 'admin' && 'Administrator'}
                      {member.role === 'member' && 'Member'}
                      {member.role === 'viewer' && 'Viewer'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {/* Role Badge or Selector */}
                    {member.role === 'owner' ? (
                      <Badge className={`${getRoleBadgeColor(member.role)} whitespace-nowrap`}>
                        {ROLE_LABELS[member.role]}
                      </Badge>
                    ) : (
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          onUpdateRole(member.user_id, value as MemberRole)
                        }
                        disabled={isUpdatingRole || member.role === 'owner'}
                      >
                        <SelectTrigger className="h-8 w-24 bg-slate-800 border-slate-600 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    {/* Remove Button */}
                    {member.user_id !== currentUserId && member.role !== 'owner' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemoveMember(member.user_id)}
                        disabled={isRemovingMember}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
