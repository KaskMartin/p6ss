"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { formatDateTime, formatDate, formatTime } from "@/lib/utils"
import { PublicEvent } from "@/types/db"

export default function PublicEventPage() {
  const params = useParams()
  const linkUid = params.linkUid as string
  const [event, setEvent] = useState<PublicEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvent()
  }, [linkUid])

  const fetchEvent = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/events/public/${linkUid}`)
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to fetch event")
      }
      const data = await response.json()
      setEvent(data.event)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
          <p className="text-gray-600">{error || "This event is not available or has been removed."}</p>
        </div>
      </div>
    )
  }

  const startDate = new Date(event.start_datetime)
  const endDate = new Date(event.end_datetime)
  const isSameDay = startDate.toDateString() === endDate.toDateString()

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundImage: event.background_picture ? `url(${event.background_picture})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Print Button - Hidden in print */}
      <div className="print:hidden fixed top-4 right-4 z-10">
        <button
          onClick={handlePrint}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-lg"
        >
          Print Event
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-0">
        {/* Header Section */}
        <div 
          className="relative py-16 px-4 sm:px-6 lg:px-8"
          style={{
            backgroundImage: event.header_picture ? `url(${event.header_picture})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          
          <div className="relative max-w-4xl mx-auto text-center">
            {/* Event Image - Circular */}
            {event.list_item_picture && (
              <div className="mb-6">
                <img
                  src={event.list_item_picture}
                  alt={event.title}
                  className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
                />
              </div>
            )}

            {/* Event Title */}
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {event.title}
            </h1>

            {/* Event Subtitle */}
            {event.subtitle && (
              <h2 className="text-xl md:text-2xl text-white mb-6 opacity-90">
                {event.subtitle}
              </h2>
            )}

            {/* Group Name */}
            <p className="text-lg text-white opacity-80 mb-8">
              Organized by {event.group_name}
            </p>
          </div>
        </div>

        {/* Event Details */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Date & Time Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold mb-4">Event Date & Time</h3>
                  <div className="space-y-2">
                    <p className="text-lg">
                      <strong>Start:</strong> {formatDateTime(startDate)}
                    </p>
                    <p className="text-lg">
                      <strong>End:</strong> {isSameDay ? formatTime(endDate) : formatDateTime(endDate)}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {event.address && (
                  <div>
                    <h3 className="text-2xl font-bold mb-4">Location</h3>
                    <p className="text-lg">{event.address}</p>
                    {event.location_lat && event.location_lng && (
                      <p className="text-sm mt-2 opacity-80">
                        Coordinates: {event.location_lat}, {event.location_lng}
                      </p>
                    )}
                  </div>
                )}

                {/* Messenger Link */}
                {event.messenger_link && (
                  <div>
                    <h3 className="text-2xl font-bold mb-4">Join the Conversation</h3>
                    <a
                      href={event.messenger_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-6 py-3 bg-green-600 text-white text-lg font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.214-.38a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                      Join WhatsApp Group
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Description Section */}
            {event.description && (
              <div className="p-8">
                <h3 className="text-2xl font-bold text-black mb-6">Event Description</h3>
                <div className="prose prose-lg max-w-none text-black">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {event.description}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Event Images */}
            {(event.header_picture || event.invite_paper_image) && (
              <div className="p-8 border-t border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Event Images</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {event.header_picture && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-700 mb-2">Header Image</h4>
                      <img
                        src={event.header_picture}
                        alt="Event header"
                        className="w-full h-48 object-cover rounded-lg shadow-md"
                      />
                    </div>
                  )}
                  {event.invite_paper_image && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-700 mb-2">Invitation Image</h4>
                      <img
                        src={event.invite_paper_image}
                        alt="Event invitation"
                        className="w-full h-48 object-cover rounded-lg shadow-md"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Footer */}
            <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
              <div className="text-center text-gray-600">
                <p>Created by {event.created_by_name || event.created_by_email}</p>
                <p className="text-sm mt-1">
                  Created on {new Date(event.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          
          body {
            background: white !important;
            color: black !important;
          }
          
          .bg-gradient-to-r {
            background: #4f46e5 !important;
            color: white !important;
          }
          
          .shadow-xl, .shadow-lg, .shadow-md {
            box-shadow: none !important;
          }
          
          .rounded-lg, .rounded-full {
            border-radius: 0 !important;
          }
          
          .border {
            border: 1px solid #000 !important;
          }
        }
      `}</style>
    </div>
  )
}
