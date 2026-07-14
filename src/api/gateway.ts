const DEFAULT_FUNCTION_URL =
  'https://api.admin.u-code.io/v2/invoke_function/progress-gateway?project-id=fccb33c6-8ff4-470c-85a8-3216483624b5'
const AUTH_LOGIN_URL = 'https://api.auth.u-code.io/v2/login'
const PROJECT_ID = '9384c816-bc2d-441f-a8b0-056ee3d4fd06'
const ADMIN_CLIENT_TYPE_ID = '278ced59-5cdd-4d32-b3f7-f2e8bc83f924'

const TOKEN_KEY = 'progress-admin-access-token'
const REFRESH_TOKEN_KEY = 'progress-admin-refresh-token'
const TOKEN_EXPIRES_AT_KEY = 'progress-admin-token-expires-at'
const TOKEN_CREATED_AT_KEY = 'progress-admin-token-created-at'
const REFRESH_IN_SECONDS_KEY = 'progress-admin-refresh-in-seconds'

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

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || ''
}

type TokenData = {
  access_token?: string
  token?: string
  refresh_token?: string
  expires_at?: string
  created_at?: string
  refresh_in_seconds?: number | string
}

function storeTokenData(tokenData: TokenData) {
  const accessToken = tokenData.access_token || tokenData.token
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken)
  if (tokenData.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, tokenData.refresh_token)
  if (tokenData.expires_at) localStorage.setItem(TOKEN_EXPIRES_AT_KEY, tokenData.expires_at)
  if (tokenData.created_at) localStorage.setItem(TOKEN_CREATED_AT_KEY, tokenData.created_at)
  if (tokenData.refresh_in_seconds !== undefined) {
    localStorage.setItem(REFRESH_IN_SECONDS_KEY, String(tokenData.refresh_in_seconds))
  }
}

export function setAccessToken(token: string) {
  storeTokenData({ access_token: token })
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRES_AT_KEY)
  localStorage.removeItem(TOKEN_CREATED_AT_KEY)
  localStorage.removeItem(REFRESH_IN_SECONDS_KEY)
}

export function isAuthenticated() {
  return Boolean(getAccessToken())
}

function functionUrl() {
  return import.meta.env.VITE_FUNCTION_URL || DEFAULT_FUNCTION_URL
}

function extractTokenData(value: unknown): TokenData {
  if (!value || typeof value !== 'object') return {}
  const root = (value || {}) as {
    token?: TokenData
    data?: { token?: TokenData } | TokenData
  }
  if (root.token && typeof root.token === 'object') return root.token
  const nestedData = root.data
  if (nestedData && typeof nestedData === 'object' && 'token' in nestedData && nestedData.token && typeof nestedData.token === 'object') {
    return nestedData.token
  }
  return nestedData && typeof nestedData === 'object' ? nestedData as TokenData : {}
}

function isAuthFailure(res: Response, payload: Record<string, unknown> | null, json: Record<string, unknown> | null) {
  if (res.status === 401) return true
  const text = [
    payload?.server_error,
    (payload?.data as { message?: string; error?: string } | undefined)?.message,
    (payload?.data as { message?: string; error?: string } | undefined)?.error,
    json?.description,
    json?.data,
  ].map(String).join(' ').toLowerCase()
  return text.includes('unauthenticated') || text.includes('token') && (text.includes('expired') || text.includes('invalid'))
}

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) throw new Error('No refresh token stored')

    const res = await fetch(functionUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          method: 'refresh_token',
          object_data: {
            refresh_token: refreshToken,
            project_id: PROJECT_ID,
          },
        },
      }),
    })

    const json = await res.json().catch(() => null)
    const payload = json?.data?.status ? json.data : json
    if (!res.ok || !payload || payload.status !== 'success') {
      throw new Error(payload?.data?.message || payload?.data?.error || payload?.server_error || json?.description || 'Refresh token failed')
    }

    const tokenData = extractTokenData(payload.data)
    const newAccess = tokenData.access_token || tokenData.token
    if (!newAccess) throw new Error('Refresh response did not include access token')
    storeTokenData(tokenData)
    return newAccess
  })().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

export async function callGateway<T>(
  method: string,
  objectData: Record<string, unknown> = {},
  token = getAccessToken(),
  retryOnAuthFailure = true,
): Promise<T> {
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
    if (retryOnAuthFailure && isAuthFailure(res, payload, json)) {
      try {
        const newToken = await refreshAccessToken()
        return callGateway<T>(method, objectData, newToken, false)
      } catch (err) {
        clearAccessToken()
        throw err
      }
    }
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
    data?: { token?: TokenData }
    token?: TokenData
  } | null

  if (!res.ok || !data || (data.status && data.status !== 'CREATED' && data.status !== 'OK' && data.status !== 'done')) {
    throw new Error(data?.description || 'Login failed')
  }

  const tokenData = data.data?.token || data.token || {}
  const token = tokenData.access_token || tokenData.token
  if (!token) throw new Error('Login response did not include access token')
  storeTokenData(tokenData)
  return data
}

export async function adminLoginViaGateway(login: string, password: string) {
  const data = await callGateway<{
    data?: { token?: TokenData }
    token?: TokenData
  }>('admin_login', { login, password }, '')

  const tokenData = data.data?.token || data.token || {}
  const token = tokenData.access_token || tokenData.token
  if (!token) throw new Error('Login response did not include access token')
  storeTokenData(tokenData)
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
  orders: {
    create: 'create_order',
    list: 'list_orders',
    get: 'get_order',
    update: 'update_order',
    delete: 'delete_order',
  },
  users: {
    create: 'create_user',
    list: 'list_users',
    get: 'get_user',
    update: 'update_user',
    delete: 'delete_user',
  },
  adminUsers: {
    create: 'create_admin_user',
    list: 'list_admin_users',
    get: 'get_admin_user',
    update: 'update_admin_user',
    delete: 'delete_admin_user',
  },
  banners: {
    create: 'create_banner',
    list: 'list_banners',
    get: 'get_banner',
    update: 'update_banner',
    delete: 'delete_banner',
  },
  notifications: {
    create: 'create_notification',
    list: 'list_notifications',
    get: 'get_notification',
    update: 'update_notification',
    delete: 'delete_notification',
  },
} as const
