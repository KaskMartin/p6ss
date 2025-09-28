"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { useState } from "react"

export default function GenerateImage() {
  const { data: session, status } = useSession()
  const [prompt, setPrompt] = useState("")
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt for image generation")
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedImage(null)
    setEnhancedPrompt(null)

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate image")
      }

      const data = await response.json()

      console.log('#########################')
      console.log(data)
      console.log('#########################')

      setGeneratedImage("data:image/jpg;base64, " + data.image.imageBytes)
      setEnhancedPrompt(data.enhancedPrompt)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">Please sign in to access this page.</p>
          <Link
            href="/auth/signin"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-gray-700">
                P6SS
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {session.user?.email}
                {(session.user as any)?.isAdmin && (
                  <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Admin
                  </span>
                )}
              </span>
              <button
                onClick={() => signOut()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Generate Image with Gemini AI</h1>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                  Image Prompt
                </label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  rows={4}
                />
              </div>

              <button
                onClick={handleGenerateImage}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                {isGenerating ? "Generating..." : "Generate Image"}
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {generatedImage && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-900">Generated Image</h2>
                  
                  {enhancedPrompt && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-blue-900 mb-2">Enhanced Prompt (Generated by Gemini AI):</h3>
                      <p className="text-blue-800 text-sm">{enhancedPrompt}</p>
                    </div>
                  )}
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <img
                      src={generatedImage}
                      alt="Generated image"
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                  
                  <div className="flex space-x-4">
                    <a
                      href={generatedImage}
                      download="generated-image.png"
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Download Image
                    </a>
                    <button
                      onClick={() => {
                        setGeneratedImage(null)
                        setEnhancedPrompt(null)
                        setPrompt("")
                        setError(null)
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Generate Another
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
