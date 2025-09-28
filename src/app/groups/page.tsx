"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
  joined_at?: string
  role_name?: string
  permissions?: string
}

interface GroupsData {
  userGroups: Group[]
  allGroups: Group[]
  isGlobalAdmin: boolean
}

export default function GroupsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [groupsData, setGroupsData] = useState<GroupsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupDescription, setNewGroupDescription] = useState("")

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    fetchGroups()
  }, [session, status, router])

  const fetchGroups = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/groups")
      if (!response.ok) {
        throw new Error("Failed to fetch groups")
      }
      const data = await response.json()
      setGroupsData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) return

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDescription || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create group")
      }

      setNewGroupName("")
      setNewGroupDescription("")
      setShowCreateForm(false)
      fetchGroups() // Refresh the groups list
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleJoinGroup = async (groupId: number) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to join group")
      }

      fetchGroups() // Refresh the groups list
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleLeaveGroup = async (groupId: number) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to leave group")
      }

      fetchGroups() // Refresh the groups list
    } catch (err: any) {
      setError(err.message)
    }
  }

  const isUserMember = (groupId: number) => {
    return groupsData?.userGroups.some(group => group.id === groupId) || false
  }

  if (status === "loading" || loading) {
    return <p className="text-center mt-8">Loading groups...</p>
  }

  if (error) {
    return <p className="text-center mt-8 text-red-600">Error: {error}</p>
  }

  if (!session) {
    return <p className="text-center mt-8 text-red-600">Access Denied: Please sign in.</p>
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Groups</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            {showCreateForm ? 'Cancel' : 'Create Group'}
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Group</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">
                  Group Name *
                </label>
                <input
                  type="text"
                  id="groupName"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter group name"
                  required
                />
              </div>
                    <RichTextEditor
                      label="Description"
                      value={newGroupDescription}
                      onChange={setNewGroupDescription}
                      placeholder="Enter group description (supports Markdown formatting)"
                    />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Groups */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                My Groups ({groupsData?.userGroups.length || 0})
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Groups you are a member of
              </p>
            </div>
            <div className="border-t border-gray-200">
              {groupsData?.userGroups.length === 0 ? (
                <div className="px-4 py-5 sm:px-6">
                  <p className="text-sm text-gray-500">You are not a member of any groups yet.</p>
                </div>
              ) : (
                <dl>
                  {groupsData?.userGroups.map((group) => (
                    <div key={group.id} className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Group</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <div className="font-medium">
                          <Link 
                            href={`/groups/${group.id}`}
                            className="text-indigo-600 hover:text-indigo-500"
                          >
                            {group.name}
                          </Link>
                        </div>
                        {group.description && (
                          <div className="text-gray-600 mt-1 prose prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {group.description}
                            </ReactMarkdown>
                          </div>
                        )}
                        {group.role_name && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mt-1">
                            {group.role_name}
                          </span>
                        )}
                      </dd>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-1 text-right">
                        <button
                          onClick={() => handleLeaveGroup(group.id)}
                          className="text-red-600 hover:text-red-500 text-sm font-medium"
                        >
                          Leave Group
                        </button>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>

          {/* All Groups - Only for Global Admins */}
          {groupsData?.isGlobalAdmin && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  All Groups ({groupsData?.allGroups.length || 0})
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  As a global admin, you can see all groups in the system
                </p>
              </div>
            <div className="border-t border-gray-200">
              {groupsData?.allGroups.length === 0 ? (
                <div className="px-4 py-5 sm:px-6">
                  <p className="text-sm text-gray-500">No groups available.</p>
                </div>
              ) : (
                <dl>
                  {groupsData?.allGroups.map((group) => (
                    <div key={group.id} className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Group</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <div className="font-medium">
                          <Link 
                            href={`/groups/${group.id}`}
                            className="text-indigo-600 hover:text-indigo-500"
                          >
                            {group.name}
                          </Link>
                        </div>
                        {group.description && (
                          <div className="text-gray-600 mt-1 prose prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {group.description}
                            </ReactMarkdown>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          Created: {new Date(group.created_at).toLocaleDateString()}
                        </div>
                      </dd>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-1 text-right">
                        {isUserMember(group.id) ? (
                          <span className="text-green-600 text-sm font-medium">Member</span>
                        ) : (
                          <button
                            onClick={() => handleJoinGroup(group.id)}
                            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                          >
                            Join Group
                          </button>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
