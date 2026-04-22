import React, { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

// ─── AlignUI FileUpload ──────────────────────────────────────────────────────
//
// Drag-and-drop file upload zone with file list preview.
//
// States:
//   idle     → dashed border, muted text
//   dragging → purple border + bg tint (visual feedback)
//   error    → red border (on invalid file type)
//
// Props:
//   accept      — MIME types or extensions, e.g. ".pdf,.png,image/*"
//   multiple    — allow multiple file selection
//   maxSizeMB   — reject files larger than N MB (shows error hint)
//   onFiles     — called with accepted File[] list
//
// Renders a file list below the drop zone showing name + size + remove button.
//
// Usage:
//   <FileUpload
//     accept=".pdf,.docx"
//     onFiles={files => console.log(files)}
//   />

interface UploadedFile {
  file: File
  id:   string
}

interface FileUploadProps {
  accept?:     string
  multiple?:   boolean
  maxSizeMB?:  number
  onFiles?:    (files: File[]) => void
  className?:  string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)         return `${bytes} B`
  if (bytes < 1024 ** 2)    return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

export function FileUpload({ accept, multiple = false, maxSizeMB, onFiles, className }: FileUploadProps) {
  const [files, setFiles]     = useState<UploadedFile[]>([])
  const [dragging, setDragging] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const accept_ = (incoming: File[]) => {
    setError(null)
    const filtered = incoming.filter(f => {
      if (maxSizeMB && f.size > maxSizeMB * 1024 ** 2) {
        setError(`${f.name} exceeds ${maxSizeMB} MB limit`)
        return false
      }
      return true
    })
    if (!filtered.length) return

    const next: UploadedFile[] = multiple
      ? [...files, ...filtered.map(f => ({ file: f, id: crypto.randomUUID() }))]
      : filtered.slice(0, 1).map(f => ({ file: f, id: crypto.randomUUID() }))

    setFiles(next)
    onFiles?.(next.map(u => u.file))
  }

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    accept_(Array.from(e.dataTransfer.files))
  }
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) accept_(Array.from(e.target.files))
    e.target.value = ''
  }
  const remove = (id: string) => {
    const next = files.filter(f => f.id !== id)
    setFiles(next)
    onFiles?.(next.map(u => u.file))
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed',
          'px-6 py-8 cursor-pointer transition-colors duration-150',
          dragging
            ? 'border-purple-500 bg-purple-500/5'
            : error
              ? 'border-red-500/40 bg-red-500/5'
              : 'border-neutral-700 hover:border-neutral-600 hover:bg-neutral-900/50',
        )}
      >
        <i className={cn(
          'text-2xl leading-none',
          dragging ? 'ri-upload-cloud-2-line text-purple-400' : 'ri-file-upload-line text-neutral-500',
        )} />
        <div className="text-center">
          <p className="text-sm font-medium text-neutral-300">
            {dragging ? 'Drop to upload' : 'Drop files here or '}
            {!dragging && (
              <span className="text-purple-400 hover:underline">browse</span>
            )}
          </p>
          {accept && (
            <p className="text-xs text-neutral-600 mt-0.5">{accept}</p>
          )}
          {maxSizeMB && (
            <p className="text-xs text-neutral-600">Max {maxSizeMB} MB</p>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={onInputChange}
      />

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <i className="ri-error-warning-line" />{error}
        </p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <ul className="flex flex-col gap-1">
          {files.map(({ file, id }) => (
            <li key={id} className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2">
              <i className="ri-file-line text-sm text-neutral-500 shrink-0" />
              <span className="flex-1 text-sm text-neutral-300 truncate">{file.name}</span>
              <span className="text-xs text-neutral-600 tabular-nums shrink-0">{formatBytes(file.size)}</span>
              <button
                onClick={e => { e.stopPropagation(); remove(id) }}
                className="shrink-0 text-neutral-600 hover:text-neutral-300 transition-colors"
                aria-label="Remove file"
              >
                <i className="ri-close-line text-sm leading-none" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
