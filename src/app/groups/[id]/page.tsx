"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import RichTextEditor from "@/components/RichTextEditor"

interface Group {
  id: number
  name: string
  description: string | null
  created_by: number
  created_at: string
  updated_at: string
}

interface Member {
  id: number
  email: string
  name: string | null
  is_admin: boolean
  joined_at: string
  role_name: string | null
  permissions: string | null
}

interface GroupData {
  group: Group
  members: Member[]
  userRole: {
    role_name: string
    permissions: string
  } | null
}

export default function GroupDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [groupData, setGroupData] = useState<GroupData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editLoading, setEditLoading] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteDescription, setInviteDescription] = useState("")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [invitations, setInvitations] = useState<any[]>([])
  const [showInvitations, setShowInvitations] = useState(false)

  const groupId = params.id as string

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    fetchGroupDetails()
    fetchInvitations()
  }, [session, status, router, groupId])

  const fetchGroupDetails = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/groups/${groupId}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Group not found")
        } else if (response.status === 403) {
          throw new Error("You are not a member of this group")
        } else {
          throw new Error("Failed to fetch group details")
        }
      }
      const data = await response.json()
      setGroupData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this group?")) {
      return
    }

    try {
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to leave group")
      }

      router.push("/groups")
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim()) return

    setEditLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName,
          description: editDescription || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update group")
      }

      setShowEditForm(false)
      fetchGroupDetails() // Refresh the group data
    } catch (err: any) {
      setError(err.message)
    } finally {
      setEditLoading(false)
    }
  }

  const startEdit = () => {
    if (groupData) {
      setEditName(groupData.group.name)
      setEditDescription(groupData.group.description || "")
      setShowEditForm(true)
    }
  }

  const fetchInvitations = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/invitations`)
      if (response.ok) {
        const data = await response.json()
        setInvitations(data.invitations || [])
      }
    } catch (err) {
      console.error('Error fetching invitations:', err)
    }
  }

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setInviteLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invited_email: inviteEmail,
          description: inviteDescription || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create invitation")
      }

      setInviteEmail("")
      setInviteDescription("")
      setShowInviteForm(false)
      fetchInvitations() // Refresh invitations
    } catch (err: any) {
      setError(err.message)
    } finally {
      setInviteLoading(false)
    }
  }

  const canEdit = groupData?.userRole?.role_name === 'admin' || 
                  (groupData?.group.created_by === parseInt(session?.user?.id || '0'))
  
  const canInvite = canEdit // Same permissions as editing

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center mt-8">Loading group details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link
              href="/groups"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Back to Groups
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center mt-8 text-red-600">Access Denied: Please sign in.</p>
        </div>
      </div>
    )
  }

  if (!groupData) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center mt-8">No group data available.</p>
        </div>
      </div>
    )
  }

  const { group, members, userRole } = groupData

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">{group.name}</h1>
            {group.description && (
              <div className="mt-2 text-gray-600 prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {group.description}
                </ReactMarkdown>
              </div>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Created: {new Date(group.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex space-x-3">
            {canEdit && (
              <button
                onClick={startEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Edit Group
              </button>
            )}
            {canInvite && (
              <button
                onClick={() => setShowInviteForm(!showInviteForm)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                {showInviteForm ? 'Cancel Invite' : 'Invite User'}
              </button>
            )}
            {canInvite && (
              <button
                onClick={() => setShowInvitations(!showInvitations)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                {showInvitations ? 'Hide Invitations' : 'View Invitations'}
              </button>
            )}
            <Link
              href="/groups"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Back to Groups
            </Link>
            <button
              onClick={handleLeaveGroup}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Leave Group
            </button>
          </div>
        </div>

        {/* Edit Form */}
        {showEditForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Edit Group</h2>
            <form onSubmit={handleEditGroup} className="space-y-4">
              <div>
                <label htmlFor="editName" className="block text-sm font-medium text-gray-700">
                  Group Name *
                </label>
                <input
                  type="text"
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter group name"
                  required
                />
              </div>
              <RichTextEditor
                label="Description"
                value={editDescription}
                onChange={setEditDescription}
                placeholder="Enter group description (supports Markdown formatting)"
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editLoading ? 'Updating...' : 'Update Group'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Invite Form */}
        {showInviteForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Invite User to Group</h2>
            <form onSubmit={handleCreateInvitation} className="space-y-4">
              <div>
                <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="inviteEmail"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter user's email address"
                  required
                />
              </div>
              <RichTextEditor
                label="Invitation Message"
                value={inviteDescription}
                onChange={setInviteDescription}
                placeholder="Optional message for the invitation (supports Markdown)"
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Invitations List */}
        {showInvitations && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Group Invitations</h2>
            {invitations.length === 0 ? (
              <p className="text-gray-500">No invitations sent yet.</p>
            ) : (
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{invitation.invited_email}</p>
                        {invitation.description && (
                          <div className="mt-1 prose prose-sm max-w-none prose-gray">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {invitation.description}
                            </ReactMarkdown>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Sent: {new Date(invitation.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Status: <span className={`font-medium ${
                            invitation.status === 'pending' ? 'text-yellow-600' :
                            invitation.status === 'accepted' ? 'text-green-600' :
                            'text-red-600'
                          }`}>
                            {invitation.status}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        {invitation.status === 'accepted' && invitation.accepted_at && (
                          <p className="text-xs text-green-600">
                            Accepted: {new Date(invitation.accepted_at).toLocaleDateString()}
                          </p>
                        )}
                        {invitation.status === 'declined' && invitation.declined_at && (
                          <p className="text-xs text-red-600">
                            Declined: {new Date(invitation.declined_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User Role Info */}
        {userRole && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {userRole.role_name}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Your role: <strong>{userRole.role_name}</strong>
                </p>
                {userRole.permissions && (
                  <p className="text-xs text-blue-600 mt-1">
                    Permissions: {JSON.parse(userRole.permissions).join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Members Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Group Members ({members.length})
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              All members of this group
            </p>
          </div>
          <div className="border-t border-gray-200">
            {members.length === 0 ? (
              <div className="px-4 py-5 sm:px-6">
                <p className="text-sm text-gray-500">No members found.</p>
              </div>
            ) : (
              <dl>
                {members.map((member) => (
                  <div key={member.id} className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-4 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Member</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{member.name || member.email}</div>
                          <div className="text-gray-600">{member.email}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Joined: {new Date(member.joined_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          {member.is_admin && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Site Admin
                            </span>
                          )}
                          {member.role_name && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {member.role_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
