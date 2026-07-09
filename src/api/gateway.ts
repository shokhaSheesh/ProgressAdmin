const DEFAULT_FUNCTION_URL =
  'https://api.admin.u-code.io/v2/invoke_function/progress-gateway?project-id=fccb33c6-8ff4-470c-85a8-3216483624b5'
const AUTH_LOGIN_URL = 'https://api.auth.u-code.io/v2/login'
const PROJECT_ID = '9384c816-bc2d-441f-a8b0-056ee3d4fd06'
const ADMIN_CLIENT_TYPE_ID = '278ced59-5cdd-4d32-b3f7-f2e8bc83f924'

const TOKEN_KEY = 'progress-admin-access-token'

export type GatewayListPayload = {
  page?: number
  limit?: number
  filter?: Record<string, unknown>
  sort?: Record<string, 1 | -1>
  search?: string
}

export type GatewayResponse<T> = {
  status: string
  data: T
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setAccessToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated() {
  return Boolean(getAccessToken())
}

function functionUrl() {
  return import.meta.env.VITE_FUNCTION_URL || DEFAULT_FUNCTION_URL
}

export async function callGateway<T>(method: string, objectData: Record<string, unknown> = {}, token = getAccessToken()): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const data: Record<string, unknown> = {
    method,
    object_data: objectData,
  }

  const res = await fetch(functionUrl(), {
    method: 'POST',
    headers,
    body: JSON.stringify({ data }),
  })

  const json = await res.json().catch(() => null)
  const payload = json?.data?.status ? json.data : json
  if (!res.ok || !payload || payload.status !== 'success') {
    const message = payload?.data?.message || payload?.data?.error || payload?.server_error || json?.description || 'Request failed'
    throw new Error(message)
  }
  return payload.data as T
}

export async function adminLogin(login: string, password: string) {
  const res = await fetch(AUTH_LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      login,
      username: login,
      password,
      project_id: PROJECT_ID,
      client_type: ADMIN_CLIENT_TYPE_ID,
    }),
  })

  const data = (await res.json().catch(() => null)) as {
    status?: string
    description?: string
    data?: { token?: { access_token?: string } }
    token?: { access_token?: string }
  } | null

  if (!res.ok || !data || (data.status && data.status !== 'CREATED' && data.status !== 'OK' && data.status !== 'done')) {
    throw new Error(data?.description || 'Login failed')
  }

  const token = data.data?.token?.access_token || data.token?.access_token
  if (!token) throw new Error('Login response did not include access token')
  setAccessToken(token)
  return data
}

export async function adminLoginViaGateway(login: string, password: string) {
  const data = await callGateway<{
    data?: { token?: { access_token?: string } }
    token?: { access_token?: string }
  }>('admin_login', { login, password }, '')

  const token = data.data?.token?.access_token || data.token?.access_token
  if (!token) throw new Error('Login response did not include access token')
  setAccessToken(token)
  return data
}

export function gatewayList<T>(method: string, payload: GatewayListPayload = {}) {
  return callGateway<T>(method, {
    page: payload.page ?? 1,
    limit: payload.limit ?? 100,
    filter: payload.filter ?? {},
    sort: payload.sort ?? { created_at: -1 },
    search: payload.search,
  })
}

export const methods = {
  products: {
    create: 'create_product',
    list: 'list_products',
    get: 'get_product',
    update: 'update_product',
    delete: 'delete_product',
  },
  categories: {
    create: 'create_category',
    list: 'list_categories',
    get: 'get_category',
    update: 'update_category',
    delete: 'delete_category',
  },
  shops: {
    create: 'create_shop',
    list: 'list_shops',
    get: 'get_shop',
    update: 'update_shop',
    delete: 'delete_shop',
  },
  manufacturerBrands: {
    create: 'create_manufacturer_brand',
    list: 'list_manufacturer_brands',
    get: 'get_manufacturer_brand',
    update: 'update_manufacturer_brand',
    delete: 'delete_manufacturer_brand',
  },
  brands: {
    create: 'create_brand',
    list: 'list_brands',
    get: 'get_brand',
    update: 'update_brand',
    delete: 'delete_brand',
  },
  models: {
    create: 'create_model',
    list: 'list_models',
    get: 'get_model',
    update: 'update_model',
    delete: 'delete_model',
  },
  locations: {
    create: 'create_location',
    list: 'list_locations',
    get: 'get_location',
    update: 'update_location',
    delete: 'delete_location',
  },
  regions: {
    create: 'create_region',
    list: 'list_regions',
    get: 'get_region',
    update: 'update_region',
    delete: 'delete_region',
  },
} as const
