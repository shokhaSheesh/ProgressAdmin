import { callGateway, gatewayList } from './gateway'
import { uploadProductImage } from './uploadImage'

export type Status = 'active' | 'inactive'

export type ListResponse<T> = {
  data?: T[]
  total?: number
  page?: number
  limit?: number
  [key: string]: unknown
}

export type ApiRow = {
  guid: string
  name?: string
  images?: string[] | null
  is_active?: boolean
  created_at?: string
  owner_name?: string
  owner_phone?: string
  manager_name?: string
  manager_phone?: string
  type?: string
  address?: string
  lat?: number
  lng?: number
  [key: string]: unknown
}

export function rowStatus(row: ApiRow): Status {
  return row.is_active === false ? 'inactive' : 'active'
}

export function formatDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function listRows<T>(response: ListResponse<T>, key: string) {
  const value = response[key]
  if (Array.isArray(value)) return value as T[]
  return response.data || []
}

export async function maybeUploadImage(value: string) {
  if (!value || !value.startsWith('data:')) return value
  const response = await fetch(value)
  const blob = await response.blob()
  const file = new File([blob], `upload-${Date.now()}.${blob.type.split('/')[1] || 'png'}`, { type: blob.type || 'image/png' })
  return uploadProductImage(file)
}

export function imageFromRow(row: ApiRow) {
  return Array.isArray(row.images) ? row.images[0] || '' : ''
}

export async function loadCrudRows<T>(
  method: string,
  key: string,
  page: number,
  limit: number,
  filter: Record<string, unknown>,
  search: string,
) {
  const response = await gatewayList<ListResponse<T>>(method, {
    page,
    limit,
    filter,
    search: search.trim() || undefined,
    sort: { created_at: -1 },
  })
  return {
    rows: listRows<T>(response, key),
    total: response.total ?? listRows<T>(response, key).length,
  }
}

export async function saveCrudRow(
  methods: { create: string; update: string },
  guid: string | undefined,
  payload: Record<string, unknown>,
) {
  if (guid) return callGateway(methods.update, { ...payload, guid })
  return callGateway(methods.create, payload)
}
