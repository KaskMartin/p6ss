"use client"

import { useState } from "react"
import MDEditor from "@uiw/react-md-editor"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  rows?: number
  className?: string
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter text...",
  label,
  rows = 4,
  className = ""
}: RichTextEditorProps) {
  const [isPreview, setIsPreview] = useState(false)

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="border border-gray-300 rounded-md overflow-hidden">
        {/* Toolbar */}
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-300 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Editor Mode:</span>
            <button
              type="button"
              onClick={() => setIsPreview(false)}
              className={`px-3 py-1 text-xs font-medium rounded ${
                !isPreview
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Rich Text
            </button>
            <button
              type="button"
              onClick={() => setIsPreview(true)}
              className={`px-3 py-1 text-xs font-medium rounded ${
                isPreview
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Markdown
            </button>
          </div>
          <div className="text-xs text-gray-500">
            Supports: **bold**, *italic*, `code`, [links](url), # headers, - lists
          </div>
        </div>

        {/* Editor */}
        <div className="min-h-[200px]">
          <MDEditor
            value={value}
            onChange={(val) => onChange(val || "")}
            preview={isPreview ? "edit" : "live"}
            hideToolbar={false}
            data-color-mode="light"
            height={200}
            textareaProps={{
              placeholder: placeholder,
              style: {
                fontSize: 14,
                fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}
