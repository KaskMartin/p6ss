"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Invitation {
  id: number
  group_id: number
  description: string | null
  status: string
  created_at: string
  group_name: string
  group_description: string | null
  invited_by_name: string | null
  invited_by_email: string | null
}

export default function InvitationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [responding, setResponding] = useState<number | null>(null)

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    fetchInvitations()
  }, [session, status, router])

  const fetchInvitations = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/invitations")
      if (!response.ok) {
        throw new Error("Failed to fetch invitations")
      }
      const data = await response.json()
      setInvitations(data.invitations || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRespondToInvitation = async (invitationId: number, action: 'accept' | 'decline') => {
    setResponding(invitationId)
    setError(null)
    try {
      const response = await fetch(`/api/invitations/${invitationId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} invitation`)
      }

      fetchInvitations() // Refresh invitations list
    } catch (err: any) {
      setError(err.message)
    } finally {
      setResponding(null)
    }
  }

  if (status === "loading" || loading) {
    return <p className="text-center mt-8">Loading invitations...</p>
  }

  if (error) {
    return <p className="text-center mt-8 text-red-600">Error: {error}</p>
  }

  if (!session) {
    return <p className="text-center mt-8 text-red-600">Access Denied: Please sign in.</p>
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">My Invitations</h1>
          <Link
            href="/groups"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Back to Groups
          </Link>
        </div>

        {invitations.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-center text-gray-500">You have no pending invitations.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      Invitation to join "{invitation.group_name}"
                    </h3>
                    {invitation.group_description && (
                      <p className="text-sm text-gray-600 mt-1">{invitation.group_description}</p>
                    )}
                    {invitation.description && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Message from {invitation.invited_by_name || invitation.invited_by_email}:</span>
                        </p>
                        <div className="mt-2 prose prose-sm max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {invitation.description}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                    <div className="mt-3 text-sm text-gray-500">
                      <p>Invited by: {invitation.invited_by_name || invitation.invited_by_email}</p>
                      <p>Sent: {new Date(invitation.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="ml-6 flex space-x-3">
                    <button
                      onClick={() => handleRespondToInvitation(invitation.id, 'accept')}
                      disabled={responding === invitation.id}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {responding === invitation.id ? 'Processing...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => handleRespondToInvitation(invitation.id, 'decline')}
                      disabled={responding === invitation.id}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {responding === invitation.id ? 'Processing...' : 'Decline'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
