import { randomBytes } from 'crypto'

export function generateLinkUID(): string {
  return randomBytes(16).toString('hex')
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

export function generateImageUID(): string {
  return randomBytes(16).toString('hex')
}

export function generateImageThumbnailUrl(url: string): string {
  // This is a placeholder - in a real implementation, you'd use an image processing service
  // like Cloudinary, ImageKit, or AWS Lambda to generate thumbnails
  return url.replace(/(\.[^.]+)$/, '_thumb$1')
}
