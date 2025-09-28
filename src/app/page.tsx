"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"

export default function Home() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to P6SS
              </h2>
              {session ? (
                <div>
                  <p className="text-gray-600">
                    You are successfully signed in!
                  </p>
                  <Link
                  href="/generate-image"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                  Generate Image
                  </Link>
                </div>
              ) : (
                <p className="text-gray-600">
                  Please sign in to access the application.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
