import { getAccessToken } from './gateway'

const FILES_URL = 'https://api.admin.u-code.io/v1/files'
const CDN_BASE_URL = 'https://cdn.u-code.io'
const ENVIRONMENT_ID = 'f08eb23b-c14a-4ebf-bcb8-6fabe5125d62'

type FolderUploadResponseData = {
  link?: string
}

function uploadFormat(file: File) {
  const mime = file.type.toLowerCase()
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  const formats: Record<string, string> = {
    'image/jpeg': 'JPEG',
    'image/jpg': 'JPEG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'image/webp': 'WEBP',
    'image/svg+xml': 'SVG',
    jpg: 'JPEG',
    jpeg: 'JPEG',
    png: 'PNG',
    gif: 'GIF',
    webp: 'WEBP',
    svg: 'SVG',
  }
  return formats[mime] || formats[ext] || 'PNG'
}

export function buildCdnUrl(link: string) {
  const trimmed = link.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `${CDN_BASE_URL}/${trimmed.replace(/^\//, '')}`
}

export async function uploadProductImage(file: File) {
  const token = getAccessToken()
  if (!token) throw new Error('Login required before uploading images')

  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${FILES_URL}/folder_upload?folder_name=media&format=${encodeURIComponent(uploadFormat(file))}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'environment-id': ENVIRONMENT_ID,
    },
    body: formData,
  })

  const json = await res.json().catch(() => null) as { data?: FolderUploadResponseData; description?: string } | null
  const link = json?.data?.link
  if (!res.ok || !link) throw new Error(json?.description || 'Image upload failed')
  return buildCdnUrl(link)
}
