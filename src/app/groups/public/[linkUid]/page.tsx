"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { PublicGroup } from "@/types/db"

export default function PublicGroupPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [group, setGroup] = useState<PublicGroup | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const linkUid = params.linkUid as string

  useEffect(() => {
    const fetchGroup = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/groups/public/${linkUid}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Group not found')
        }

        setGroup(data.group)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchGroup()
  }, [linkUid])

  const handleGroupAction = async (action: 'accept' | 'decline') => {
    if (!session?.user?.id || !group?.id) {
      setError("You must be logged in to respond to this group invitation.")
      return
    }

    setActionLoading(true)
    setActionMessage(null)
    try {
      // This would typically be an API call to join/decline the group
      // For now, we'll simulate it
      console.log(`User ${session.user.id} ${action}ed invitation for group ${group.id}`)
      setActionMessage(`You have successfully ${action}ed the invitation for "${group.name}".`)
      
      // In a real app, you'd redirect to the group page or show success message
      setTimeout(() => {
        router.push('/groups')
      }, 2000)
    } catch (err: any) {
      setActionMessage(`Failed to ${action} invitation: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-lg">Loading group...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Group Not Found</h1>
            <p className="text-gray-600 mb-4">{error || 'This group is not publicly accessible'}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Group Header */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="p-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{group.name}</h1>
              
              {group.description && (
                <div className="prose prose-lg max-w-none text-black mb-6">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {group.description}
                  </ReactMarkdown>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Organized by:</strong> {group.creator_name || 'Unknown'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Created:</strong> {new Date(group.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>


        {/* Join Group Section */}
        <div className="bg-white shadow rounded-lg p-8 text-center">
          {session?.user?.id ? (
            <>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Join This Group</h3>
              <p className="text-gray-600 mb-6">
                You have been invited to "{group.name}". Please accept or decline.
              </p>
              
              {actionMessage && (
                <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded relative" role="alert">
                  <strong className="font-bold">Success!</strong>
                  <span className="block sm:inline"> {actionMessage}</span>
                </div>
              )}
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => handleGroupAction('accept')}
                  disabled={actionLoading}
                  className="px-6 py-3 bg-green-600 text-white text-lg font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading ? 'Accepting...' : 'Accept Invitation'}
                </button>
                <button
                  onClick={() => handleGroupAction('decline')}
                  disabled={actionLoading}
                  className="px-6 py-3 bg-red-600 text-white text-lg font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading ? 'Declining...' : 'Decline Invitation'}
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Want to Join This Group?</h3>
              <p className="text-gray-600 mb-6">
                Sign up or sign in to join this group and participate in events.
              </p>
              <div className="flex justify-center space-x-4">
                <a
                  href={`/auth/signin?redirect=${encodeURIComponent(window.location.pathname)}`}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium"
                >
                  Sign In
                </a>
                <a
                  href={`/auth/signin?mode=signup&redirect=${encodeURIComponent(window.location.pathname)}`}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-medium"
                >
                  Sign Up
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
