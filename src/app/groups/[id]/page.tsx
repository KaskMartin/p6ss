"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import RichTextEditor from "@/components/RichTextEditor"
import { GroupData } from "@/types/db"

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
  const [editPublicLink, setEditPublicLink] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteDescription, setInviteDescription] = useState("")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [invitations, setInvitations] = useState<any[]>([])
  const [showInvitations, setShowInvitations] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [leavingGroup, setLeavingGroup] = useState(false)
  const [events, setEvents] = useState<any[]>([])
  const [showEvents, setShowEvents] = useState(false)
  const [showCreateEventForm, setShowCreateEventForm] = useState(false)
  const [eventTitle, setEventTitle] = useState("")
  const [eventSubtitle, setEventSubtitle] = useState("")
  const [eventDescription, setEventDescription] = useState("")
  const [eventStartDateTime, setEventStartDateTime] = useState("")
  const [eventEndDateTime, setEventEndDateTime] = useState("")
  const [eventAddress, setEventAddress] = useState("")
  const [eventLocationLat, setEventLocationLat] = useState("")
  const [eventLocationLng, setEventLocationLng] = useState("")
  const [eventListItemPicture, setEventListItemPicture] = useState("")
  const [eventHeaderPicture, setEventHeaderPicture] = useState("")
  const [eventBackgroundPicture, setEventBackgroundPicture] = useState("")
  const [eventInvitePaperImage, setEventInvitePaperImage] = useState("")
  const [eventPublicLink, setEventPublicLink] = useState(false)
  const [eventMessengerLink, setEventMessengerLink] = useState("")
  const [eventLoading, setEventLoading] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any | null>(null)
  const [showEditEventForm, setShowEditEventForm] = useState(false)

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

  useEffect(() => {
    if (showEvents) {
      fetchEvents()
    }
  }, [showEvents])

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

  const handleLeaveGroup = () => {
    setShowLeaveModal(true)
  }

  const confirmLeaveGroup = async () => {
    setLeavingGroup(true)
    setError(null)
    try {
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to leave group")
      }

      setShowLeaveModal(false)
      router.push("/groups")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLeavingGroup(false)
    }
  }

  const cancelLeaveGroup = () => {
    setShowLeaveModal(false)
  }

  const fetchEvents = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/events`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (err) {
      console.error('Error fetching events:', err)
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventTitle.trim() || !eventStartDateTime || !eventEndDateTime) return

    setEventLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: eventTitle,
          subtitle: eventSubtitle || null,
          description: eventDescription || null,
          start_datetime: eventStartDateTime,
          end_datetime: eventEndDateTime,
          address: eventAddress || null,
          location_lat: eventLocationLat || null,
          location_lng: eventLocationLng || null,
          list_item_picture: eventListItemPicture || null,
          header_picture: eventHeaderPicture || null,
          background_picture: eventBackgroundPicture || null,
          invite_paper_image: eventInvitePaperImage || null,
          public_link: eventPublicLink,
          messenger_link: eventMessengerLink || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create event")
      }

      // Reset form
      setEventTitle("")
      setEventSubtitle("")
      setEventDescription("")
      setEventStartDateTime("")
      setEventEndDateTime("")
      setEventAddress("")
      setEventLocationLat("")
      setEventLocationLng("")
      setEventListItemPicture("")
      setEventHeaderPicture("")
      setEventBackgroundPicture("")
      setEventInvitePaperImage("")
      setEventPublicLink(false)
      setShowCreateEventForm(false)
      fetchEvents() // Refresh events list
    } catch (err: any) {
      setError(err.message)
    } finally {
      setEventLoading(false)
    }
  }

  const startEditEvent = (event: any) => {
    setEditingEvent(event)
    setEventTitle(event.title)
    setEventSubtitle(event.subtitle || "")
    setEventDescription(event.description || "")
    setEventStartDateTime(new Date(event.start_datetime).toISOString().slice(0, 16))
    setEventEndDateTime(new Date(event.end_datetime).toISOString().slice(0, 16))
    setEventAddress(event.address || "")
    setEventLocationLat(event.location_lat ? event.location_lat.toString() : "")
    setEventLocationLng(event.location_lng ? event.location_lng.toString() : "")
    setEventListItemPicture(event.list_item_picture || "")
    setEventHeaderPicture(event.header_picture || "")
    setEventBackgroundPicture(event.background_picture || "")
    setEventInvitePaperImage(event.invite_paper_image || "")
    setEventPublicLink(event.public_link || false)
    setEventMessengerLink(event.messenger_link || "")
    setShowEditEventForm(true)
  }

  const cancelEditEvent = () => {
    setEditingEvent(null)
    setShowEditEventForm(false)
    // Reset form fields
    setEventTitle("")
    setEventSubtitle("")
    setEventDescription("")
    setEventStartDateTime("")
    setEventEndDateTime("")
    setEventAddress("")
    setEventLocationLat("")
    setEventLocationLng("")
    setEventListItemPicture("")
    setEventHeaderPicture("")
    setEventBackgroundPicture("")
    setEventInvitePaperImage("")
    setEventPublicLink(false)
    setEventMessengerLink("")
  }

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventTitle.trim() || !eventStartDateTime || !eventEndDateTime || !editingEvent) return

    setEventLoading(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/events/${editingEvent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: eventTitle,
          subtitle: eventSubtitle || null,
          description: eventDescription || null,
          start_datetime: eventStartDateTime,
          end_datetime: eventEndDateTime,
          address: eventAddress || null,
          location_lat: eventLocationLat || null,
          location_lng: eventLocationLng || null,
          list_item_picture: eventListItemPicture || null,
          header_picture: eventHeaderPicture || null,
          background_picture: eventBackgroundPicture || null,
          invite_paper_image: eventInvitePaperImage || null,
          public_link: eventPublicLink,
          messenger_link: eventMessengerLink || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update event")
      }

      cancelEditEvent()
      fetchEvents() // Refresh events list
    } catch (err: any) {
      setError(err.message)
    } finally {
      setEventLoading(false)
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
          public_link: editPublicLink,
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
      setEditPublicLink(groupData.group.public_link || false)
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

  const handleMemberApproval = async (memberId: number, action: 'approve' | 'decline') => {
    try {
      const endpoint = action === 'approve' 
        ? `/api/groups/${groupId}/members/${memberId}/approve`
        : `/api/groups/${groupId}/members/${memberId}/decline`
      
      const method = action === 'approve' ? 'POST' : 'DELETE'
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${action} member`)
      }

      // Refresh the group details to update the members list
      fetchGroupDetails()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const canEdit = groupData?.userRole?.role_name === 'admin' || 
                  (groupData?.group.created_by === parseInt(session?.user?.id || '0')) ||
                  session?.user?.isAdmin
  
  const canInvite = canEdit // Same permissions as editing

  console.log('XXX GroupData', groupData);

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
            {group.public_link && group.link_uid && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-2">Public Group Link:</p>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/groups/public/${group.link_uid}`}
                    readOnly
                    className="flex-1 text-xs bg-white border border-green-300 rounded px-2 py-1 text-gray-700"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${typeof window !== 'undefined' ? window.location.origin : ''}/groups/public/${group.link_uid}`)
                      alert('Public link copied to clipboard!')
                    }}
                    className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Share this link to allow anyone to view this group and its public events
                </p>
              </div>
            )}
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
            <button 
              onClick={() => setShowEvents(!showEvents)} 
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              {showEvents ? 'Hide Events' : 'View Events'}
            </button>
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
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editPublicLink}
                    onChange={(e) => setEditPublicLink(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Enable public link (allows anyone to view this group)
                  </span>
                </label>
              </div>
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

        {/* Invite Form Modal */}
        {showInviteForm && (
          <div className="fixed inset-0 bg-[rgba(75,85,99,0.5)] overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Invite User to Group</h3>
                  <button
                    onClick={() => setShowInviteForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
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
                  <div className="flex justify-end space-x-3 pt-4">
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
            </div>
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

        {/* Events Section */}
        {showEvents && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Group Events</h2>
              <button
                onClick={() => setShowCreateEventForm(!showCreateEventForm)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                {showCreateEventForm ? 'Cancel' : 'Create Event'}
              </button>
            </div>

            {/* Create Event Form */}
            {showCreateEventForm && (
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">Create New Event</h3>
                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Title *
                      </label>
                      <input
                        type="text"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter event title"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subtitle
                      </label>
                      <input
                        type="text"
                        value={eventSubtitle}
                        onChange={(e) => setEventSubtitle(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter event subtitle"
                      />
                    </div>
                  </div>

                  <RichTextEditor
                    label="Event Description"
                    value={eventDescription}
                    onChange={setEventDescription}
                    placeholder="Enter event description (supports Markdown formatting)"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={eventStartDateTime}
                        onChange={(e) => setEventStartDateTime(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={eventEndDateTime}
                        onChange={(e) => setEventEndDateTime(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={eventAddress}
                      onChange={(e) => setEventAddress(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter event address"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={eventLocationLat}
                        onChange={(e) => setEventLocationLat(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter latitude"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={eventLocationLng}
                        onChange={(e) => setEventLocationLng(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter longitude"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        List Item Picture URL
                      </label>
                      <input
                        type="url"
                        value={eventListItemPicture}
                        onChange={(e) => setEventListItemPicture(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter image URL"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Header Picture URL
                      </label>
                      <input
                        type="url"
                        value={eventHeaderPicture}
                        onChange={(e) => setEventHeaderPicture(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter image URL"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Background Picture URL
                      </label>
                      <input
                        type="url"
                        value={eventBackgroundPicture}
                        onChange={(e) => setEventBackgroundPicture(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter image URL"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Invite Paper Image URL
                      </label>
                      <input
                        type="url"
                        value={eventInvitePaperImage}
                        onChange={(e) => setEventInvitePaperImage(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter image URL"
                      />
                    </div>
                  </div>

                  {/* Messenger Link */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Messenger Link (WhatsApp/Telegram)
                    </label>
                    <input
                      type="url"
                      value={eventMessengerLink}
                      onChange={(e) => setEventMessengerLink(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter WhatsApp or Telegram group link"
                    />
                  </div>

                  {/* Public Link Toggle */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="eventPublicLink"
                      checked={eventPublicLink}
                      onChange={(e) => setEventPublicLink(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="eventPublicLink" className="text-sm font-medium text-gray-700">
                      Make this event publicly accessible (generates a shareable link)
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateEventForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={eventLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {eventLoading ? 'Creating...' : 'Create Event'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Edit Event Form */}
            {showEditEventForm && editingEvent && (
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">Edit Event</h3>
                <form onSubmit={handleUpdateEvent} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Title *
                      </label>
                      <input
                        type="text"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter event title"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subtitle
                      </label>
                      <input
                        type="text"
                        value={eventSubtitle}
                        onChange={(e) => setEventSubtitle(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter event subtitle"
                      />
                    </div>
                  </div>

                  <RichTextEditor
                    label="Event Description"
                    value={eventDescription}
                    onChange={setEventDescription}
                    placeholder="Enter event description (supports Markdown formatting)"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={eventStartDateTime}
                        onChange={(e) => setEventStartDateTime(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={eventEndDateTime}
                        onChange={(e) => setEventEndDateTime(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={eventAddress}
                      onChange={(e) => setEventAddress(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter event address"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={eventLocationLat}
                        onChange={(e) => setEventLocationLat(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter latitude"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={eventLocationLng}
                        onChange={(e) => setEventLocationLng(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter longitude"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        List Item Picture URL
                      </label>
                      <input
                        type="url"
                        value={eventListItemPicture}
                        onChange={(e) => setEventListItemPicture(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter image URL"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Header Picture URL
                      </label>
                      <input
                        type="url"
                        value={eventHeaderPicture}
                        onChange={(e) => setEventHeaderPicture(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter image URL"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Background Picture URL
                      </label>
                      <input
                        type="url"
                        value={eventBackgroundPicture}
                        onChange={(e) => setEventBackgroundPicture(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter image URL"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Invite Paper Image URL
                      </label>
                      <input
                        type="url"
                        value={eventInvitePaperImage}
                        onChange={(e) => setEventInvitePaperImage(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter image URL"
                      />
                    </div>
                  </div>

                  {/* Messenger Link */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Messenger Link (WhatsApp/Telegram)
                    </label>
                    <input
                      type="url"
                      value={eventMessengerLink}
                      onChange={(e) => setEventMessengerLink(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter WhatsApp or Telegram group link"
                    />
                  </div>

                  {/* Public Link Toggle */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="editEventPublicLink"
                      checked={eventPublicLink}
                      onChange={(e) => setEventPublicLink(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="editEventPublicLink" className="text-sm font-medium text-gray-700">
                      Make this event publicly accessible (generates a shareable link)
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={cancelEditEvent}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={eventLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {eventLoading ? 'Updating...' : 'Update Event'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Events List */}
            {events.length === 0 ? (
              <p className="text-gray-500">No events created yet.</p>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
                        {event.subtitle && (
                          <p className="text-sm text-gray-600 mt-1">{event.subtitle}</p>
                        )}
                        {event.description && (
                          <div className="mt-2 prose prose-sm max-w-none text-black">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {event.description}
                            </ReactMarkdown>
                          </div>
                        )}
                        <div className="mt-2 text-sm text-gray-500">
                          <p><strong>Start:</strong> {new Date(event.start_datetime).toLocaleString()}</p>
                          <p><strong>End:</strong> {new Date(event.end_datetime).toLocaleString()}</p>
                          {event.address && <p><strong>Address:</strong> {event.address}</p>}
                          {event.location_lat && event.location_lng && (
                            <p><strong>Location:</strong> {event.location_lat}, {event.location_lng}</p>
                          )}
                          {event.messenger_link && (
                            <p><strong>Messenger:</strong> <a href={event.messenger_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Join Group</a></p>
                          )}
                          {event.public_link && event.link_uid && (
                            <p><strong>Share Link:</strong> <a href={`/events/invite/${event.link_uid}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800 underline">Share Event Invitation</a></p>
                          )}
                          <p><strong>Created by:</strong> {event.created_by_name || event.created_by_email}</p>
                          {event.public_link && event.link_uid && (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                              <p className="text-sm font-medium text-green-800 mb-2">Public Link:</p>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={`${window.location.origin}/events/public/${event.link_uid}`}
                                  readOnly
                                  className="flex-1 text-xs bg-white border border-green-300 rounded px-2 py-1 text-gray-700"
                                />
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/events/public/${event.link_uid}`)
                                    alert('Link copied to clipboard!')
                                  }}
                                  className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                >
                                  Copy
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        {event.list_item_picture && (
                          <div className="mb-2">
                            <img
                              src={event.list_item_picture}
                              alt={event.title}
                              className="w-20 h-20 object-cover rounded-md"
                            />
                          </div>
                        )}
                        <button
                          onClick={() => startEditEvent(event)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Edit Event
                        </button>
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
                          {member.need_admin_approve && (<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">AN USER FROM PUBLIC LINK</span>)}
                          {member.need_admin_approve && canEdit && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleMemberApproval(member.id, 'approve')}
                                className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleMemberApproval(member.id, 'decline')}
                                className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                          {member.need_admin_approve && !canEdit && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Pending Approval
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

        {/* Leave Group Confirmation Modal */}
        {showLeaveModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-4">Leave Group</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to leave this group? This action cannot be undone.
                  </p>
                </div>
                <div className="flex justify-center space-x-3 mt-4">
                  <button
                    onClick={cancelLeaveGroup}
                    disabled={leavingGroup}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmLeaveGroup}
                    disabled={leavingGroup}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {leavingGroup ? 'Leaving...' : 'Leave Group'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
