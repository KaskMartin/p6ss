"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Image {
  id: number
  uid: string
  url: string
  thumb_url: string | null
  width: number | null
  height: number | null
  type: 'list_item' | 'header' | 'background' | 'invite_paper'
  created_at: string
  updated_at: string
}

export default function AdminImagesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingImage, setEditingImage] = useState<Image | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  
  // Form state
  const [imageUrl, setImageUrl] = useState("")
  const [imageThumbUrl, setImageThumbUrl] = useState("")
  const [imageType, setImageType] = useState<'list_item' | 'header' | 'background' | 'invite_paper'>('list_item')
  const [imageWidth, setImageWidth] = useState("")
  const [imageHeight, setImageHeight] = useState("")

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    if (!session.user?.isAdmin) {
      router.push("/")
      return
    }

    fetchImages()
  }, [session, status, router])

  const fetchImages = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/images")
      if (!response.ok) {
        throw new Error("Failed to fetch images")
      }
      const data = await response.json()
      setImages(data.images || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateImage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageUrl.trim()) return

    setCreating(true)
    setError(null)
    try {
      const response = await fetch("/api/images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: imageUrl,
          thumb_url: imageThumbUrl || null,
          type: imageType,
          width: imageWidth ? parseInt(imageWidth) : null,
          height: imageHeight ? parseInt(imageHeight) : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create image")
      }

      // Reset form
      setImageUrl("")
      setImageThumbUrl("")
      setImageType("list_item")
      setImageWidth("")
      setImageHeight("")
      setShowCreateForm(false)
      fetchImages() // Refresh images list
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const startEditImage = (image: Image) => {
    setEditingImage(image)
    setImageUrl(image.url)
    setImageThumbUrl(image.thumb_url || "")
    setImageType(image.type)
    setImageWidth(image.width ? image.width.toString() : "")
    setImageHeight(image.height ? image.height.toString() : "")
    setShowEditForm(true)
  }

  const cancelEditImage = () => {
    setEditingImage(null)
    setShowEditForm(false)
    // Reset form fields
    setImageUrl("")
    setImageThumbUrl("")
    setImageType("list_item")
    setImageWidth("")
    setImageHeight("")
  }

  const handleUpdateImage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageUrl.trim() || !editingImage) return

    setCreating(true)
    setError(null)
    try {
      const response = await fetch(`/api/images/${editingImage.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: imageUrl,
          thumb_url: imageThumbUrl || null,
          type: imageType,
          width: imageWidth ? parseInt(imageWidth) : null,
          height: imageHeight ? parseInt(imageHeight) : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update image")
      }

      cancelEditImage()
      fetchImages() // Refresh images list
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm("Are you sure you want to delete this image?")) return

    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete image")
      }

      fetchImages() // Refresh images list
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading images...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-center text-red-600">Error: {error}</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-center text-red-600">Access Denied: Please sign in.</p>
      </div>
    )
  }

  if (!session.user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-center text-red-600">Access Denied: Admin privileges required.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Image Management</h1>
            <p className="mt-2 text-gray-600">Manage images for events and other content</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                if (showEditForm) {
                  cancelEditImage()
                } else {
                  setShowCreateForm(!showCreateForm)
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              {showCreateForm ? 'Cancel' : showEditForm ? 'Cancel Edit' : 'Add New Image'}
            </button>
            <Link
              href="/admin"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Back to Admin
            </Link>
          </div>
        </div>

        {/* Create Image Form */}
        {showCreateForm && !showEditForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Image</h2>
            <form onSubmit={handleCreateImage} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL *
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter image URL"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thumbnail URL
                  </label>
                  <input
                    type="url"
                    value={imageThumbUrl}
                    onChange={(e) => setImageThumbUrl(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter thumbnail URL (optional)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image Type *
                  </label>
                  <select
                    value={imageType}
                    onChange={(e) => setImageType(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="list_item">List Item</option>
                    <option value="header">Header</option>
                    <option value="background">Background</option>
                    <option value="invite_paper">Invite Paper</option>
                  </select>
                </div>
                <div>
                  {/* Empty div for grid layout */}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Width (pixels)
                  </label>
                  <input
                    type="number"
                    value={imageWidth}
                    onChange={(e) => setImageWidth(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter width"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height (pixels)
                  </label>
                  <input
                    type="number"
                    value={imageHeight}
                    onChange={(e) => setImageHeight(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter height"
                  />
                </div>
              </div>

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
                  disabled={creating}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Image'}
                </button>
              </div>
            </form>
          </div>
            )}

            {/* Edit Image Form */}
            {showEditForm && editingImage && (
              <div className="bg-white shadow rounded-lg p-6 mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Edit Image</h2>
                <form onSubmit={handleUpdateImage} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Image URL *
                      </label>
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter image URL"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thumbnail URL
                      </label>
                      <input
                        type="url"
                        value={imageThumbUrl}
                        onChange={(e) => setImageThumbUrl(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter thumbnail URL (optional)"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Image Type *
                      </label>
                      <select
                        value={imageType}
                        onChange={(e) => setImageType(e.target.value as any)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      >
                        <option value="list_item">List Item</option>
                        <option value="header">Header</option>
                        <option value="background">Background</option>
                        <option value="invite_paper">Invite Paper</option>
                      </select>
                    </div>
                    <div>
                      {/* Empty div for grid layout */}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Width (pixels)
                      </label>
                      <input
                        type="number"
                        value={imageWidth}
                        onChange={(e) => setImageWidth(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter width"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Height (pixels)
                      </label>
                      <input
                        type="number"
                        value={imageHeight}
                        onChange={(e) => setImageHeight(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter height"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={cancelEditImage}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creating ? 'Updating...' : 'Update Image'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Images List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              All Images ({images.length})
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Manage all images in the system
            </p>
          </div>

          {images.length === 0 ? (
            <div className="px-4 py-5 sm:px-6">
              <p className="text-sm text-gray-500">No images found.</p>
            </div>
          ) : (
            <div className="border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {images.map((image) => (
                  <div key={image.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Image Preview */}
                    <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                      <img
                        src={image.thumb_url || image.url}
                        alt={`${image.type} image`}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder-image.png'
                        }}
                      />
                    </div>

                    {/* Image Details */}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium text-gray-900 capitalize">
                          {image.type.replace('_', ' ')}
                        </h4>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {image.uid.slice(0, 8)}...
                        </span>
                      </div>

                      <div className="text-xs text-gray-500 space-y-1">
                        <p><strong>URL:</strong> {image.url.length > 30 ? `${image.url.slice(0, 30)}...` : image.url}</p>
                        {image.thumb_url && (
                          <p><strong>Thumb:</strong> {image.thumb_url.length > 30 ? `${image.thumb_url.slice(0, 30)}...` : image.thumb_url}</p>
                        )}
                        {image.width && image.height && (
                          <p><strong>Dimensions:</strong> {image.width} × {image.height}px</p>
                        )}
                        <p><strong>Created:</strong> {new Date(image.created_at).toLocaleDateString()}</p>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex justify-between items-center">
                        <div className="flex space-x-3">
                          <a
                            href={image.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            View Full Size
                          </a>
                          <button
                            onClick={() => startEditImage(image)}
                            className="text-xs text-green-600 hover:text-green-800"
                          >
                            Edit
                          </button>
                        </div>
                        <button
                          onClick={() => handleDeleteImage(image.id)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
