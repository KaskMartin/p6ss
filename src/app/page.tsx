"use client"

import { useSession, signIn, signOut } from "next-auth/react"
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
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">P6SS</h1>
            </div>
            <div className="flex items-center space-x-4">
              {session ? (
                <>
                  <span className="text-gray-700">
                    Welcome, {session.user?.email}
                    {(session.user as any)?.isAdmin && (
                      <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Admin
                      </span>
                    )}
                  </span>
                  {(session.user as any)?.isAdmin && (
                    <Link
                      href="/admin"
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => signOut()}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/signin"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

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
