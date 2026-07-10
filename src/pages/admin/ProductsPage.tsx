import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { type Product, type Status } from '../../data/productsStore'
import { callGateway, gatewayList, methods } from '../../api/gateway'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString('en-US') + ' UZS'

function displayPrice(p: Product) {
  if (p.hasVariants && p.variants.length > 0) {
    const prices = p.variants.map(v => Number(v.price) || 0)
    const lo = Math.min(...prices), hi = Math.max(...prices)
    return lo === hi ? fmt(lo) : `${fmt(lo)} – ${fmt(hi)}`
  }
  return fmt(p.price)
}

const statusConfig: Record<Status, { label: string; bg: string; text: string }> = {
  active:   { label: 'Active',   bg: 'bg-emerald-50', text: 'text-emerald-600' },
  inactive: { label: 'Inactive', bg: 'bg-red-50',     text: 'text-red-500'     },
}

const avatarColors = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-pink-500', 'bg-cyan-500', 'bg-orange-500', 'bg-indigo-500',
]
const initials = (name: string) => name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useEscClose(fn: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') fn() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [fn])
}
function useLockScroll() {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])
}

// ─── DeleteModal ──────────────────────────────────────────────────────────────

function DeleteModal({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: () => void }) {
  useEscClose(onClose)
  useLockScroll()
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-card rounded-2xl w-[460px] max-w-full overflow-hidden" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
        <div className="flex flex-col items-center gap-4 px-8 pt-8 pb-6 text-center">
          <span className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </span>
          <div>
            <p className="text-[18px] font-extrabold text-foreground">Delete Product</p>
            <p className="text-[13px] font-medium text-muted-foreground mt-2 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-foreground">{name}</span>? This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3 px-8 pb-8">
          <button onClick={onClose} className="flex-1 rounded-xl py-3 text-[13px] font-semibold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl py-3 text-[13px] font-semibold bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] transition-all" style={{ boxShadow: '0 2px 8px rgba(239,68,68,0.3)' }}>Yes, Delete</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Dropdowns ────────────────────────────────────────────────────────────────

const PAGE_SIZES = [20, 30, 40]

function PageSizeDropdown({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} className={['flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all', open ? 'border-primary text-primary bg-primary/5' : 'border-black/[0.08] text-muted-foreground hover:border-black/20 hover:text-foreground'].join(' ')}>
        {value}
        <svg className={['w-3.5 h-3.5 transition-transform', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="absolute bottom-full mb-1.5 left-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-20 min-w-[72px]" style={{ boxShadow: '0 -6px 20px rgba(0,0,0,0.12)' }}>
          {PAGE_SIZES.map(s => <button key={s} onClick={() => { onChange(s); setOpen(false) }} className={['w-full text-center px-4 py-2 text-[12px] font-semibold transition-colors', s === value ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>{s}</button>)}
        </div>
      )}
    </div>
  )
}

type StatusFilter   = 'all' | Status
type CategoryFilter = 'all' | string
type ProductRow = {
  guid: string
  name?: string
  sku?: string
  description?: string
  images?: string[]
  is_active?: boolean
  categories_id?: string
  locations_id?: string
  manufacturer_brands_id?: string
  brands_id?: string
  models_id?: string
  category_name?: string
  location_name?: string
  manufacturer_brand_name?: string
  brand_name?: string
  model_name?: string
  variant_count?: number | string
  variant_options?: VariantOptionRow[] | string | null
  created_at?: string
}
type VariantOptionRow = {
  guid?: string
  name?: string
  sku?: string
  price?: string | number
  quantity?: string | number
  image?: string
  is_enabled?: boolean
}

type ProductListResponse = {
  products?: ProductRow[]
  data?: ProductRow[]
  page?: number
  limit?: number
  total?: number
}
type ApiProduct = Product & { guid: string; variantCount: number }
type CategoryOption = { id: string; name: string }
type CategoryListResponse = {
  categories?: Array<{ guid: string; name?: string }>
  data?: Array<{ guid: string; name?: string }>
}

function productNumericId(guid: string) {
  const numeric = guid.replace(/\D/g, '').slice(0, 12)
  return Number(numeric) || Date.now()
}

function parseVariantOptions(value: ProductRow['variant_options']): VariantOptionRow[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function mapProduct(row: ProductRow): ApiProduct {
  const variantOptions = parseVariantOptions(row.variant_options)
  const variantCount = Number(row.variant_count) || variantOptions.length
  return {
    guid: row.guid,
    id: productNumericId(row.guid),
    name: row.name || '',
    sku: row.sku || '',
    category: row.category_name || row.categories_id || '',
    brand: row.brand_name || row.brands_id || '',
    manufacturerBrand: row.manufacturer_brand_name || row.manufacturer_brands_id || '',
    model: row.model_name || row.models_id || '',
    location: row.location_name || row.locations_id || '',
    description: row.description || '',
    specifications: [],
    price: Number(variantOptions[0]?.price) || 0,
    image: row.images?.[0] || '',
    images: row.images || [],
    status: row.is_active === false ? 'inactive' : 'active',
    hasVariants: variantCount > 0,
    variantCount,
    attributes: [],
    variants: variantOptions.map((option) => ({
      key: option.name || '',
      attributes: {},
      sku: option.sku || '',
      brandName: row.brand_name || '',
      price: String(option.price || 0),
      quantity: String(option.quantity || 0),
      image: option.image || '',
      selected: option.is_enabled !== false,
    })),
    createdAt: row.created_at || '',
  }
}

function StatusFilterDropdown({ value, onChange }: { value: StatusFilter; onChange: (v: StatusFilter) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const opts: { value: StatusFilter; label: string; dot?: string }[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active',   label: 'Active',   dot: 'bg-emerald-500' },
    { value: 'inactive', label: 'Inactive', dot: 'bg-red-500' },
  ]
  const cur = opts.find(o => o.value === value)!
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} className={['flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-semibold border-2 transition-all whitespace-nowrap', open || value !== 'all' ? 'border-primary text-primary bg-primary/5' : 'border-black/[0.08] text-foreground bg-card hover:border-black/20'].join(' ')}>
        {cur.dot && <span className={`w-2 h-2 rounded-full shrink-0 ${cur.dot}`} />}
        {cur.label}
        <svg className={['w-4 h-4 transition-transform', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 right-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-20 min-w-[160px]" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {opts.map(opt => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }} className={['w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors', opt.value === value ? 'bg-primary/[0.08] text-primary font-semibold' : 'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>
              {opt.dot ? <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} /> : <span className="w-2 h-2 rounded-full shrink-0 border-2 border-black/20" />}
              {opt.label}
              {opt.value === value && <svg className="w-3.5 h-3.5 text-primary ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryFilterDropdown({ value, options, onChange }: { value: CategoryFilter; options: CategoryOption[]; onChange: (v: CategoryFilter) => void }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQ('') } }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  const selected = options.find(option => option.id === value)
  const filtered = q ? options.filter(c => c.name.toLowerCase().includes(q.toLowerCase())) : options
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} className={['flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-semibold border-2 transition-all whitespace-nowrap', open || value !== 'all' ? 'border-primary text-primary bg-primary/5' : 'border-black/[0.08] text-foreground bg-card hover:border-black/20'].join(' ')}>
        {value === 'all' ? 'All Categories' : selected?.name || 'Category'}
        <svg className={['w-4 h-4 transition-transform', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 right-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-20 min-w-[190px]" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          <div className="p-2 border-b border-black/[0.06]">
            <input autoFocus type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Search…"
              className="w-full bg-[#F4F5F7] rounded-lg px-3 py-1.5 text-[12px] font-medium text-foreground focus:outline-none" />
          </div>
          <div className="overflow-y-auto max-h-[220px]">
            <button onClick={() => { onChange('all'); setOpen(false); setQ('') }} className={['w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors', value === 'all' ? 'bg-primary/[0.08] text-primary font-semibold' : 'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>
              All Categories
            </button>
            {filtered.map(cat => (
              <button key={cat.id} onClick={() => { onChange(cat.id); setOpen(false); setQ('') }} className={['w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors', cat.id === value ? 'bg-primary/[0.08] text-primary font-semibold' : 'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [deleting, setDeleting] = useState<ApiProduct | null>(null)
  const [page, setPage]         = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch]     = useState('')
  const [catFilter, setCatFilter]       = useState<CategoryFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  useEffect(() => {
    let cancelled = false
    gatewayList<CategoryListResponse>(methods.categories.list, {
      page: 1,
      limit: 500,
      filter: {},
      sort: { created_at: -1 },
    }).then(response => {
      if (cancelled) return
      const rows = response.categories || response.data || []
      setCategoryOptions(rows.map(row => ({ id: row.guid, name: row.name || row.guid })))
    }).catch(() => {
      if (!cancelled) setCategoryOptions([])
    })

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    const filter: Record<string, unknown> = {}
    if (statusFilter !== 'all') filter.status = statusFilter === 'active'
    if (catFilter !== 'all') filter.categories_id = catFilter

    setLoading(true)
    setError('')
    gatewayList<ProductListResponse>(methods.products.list, {
      page,
      limit: pageSize,
      filter,
      sort: { created_at: -1 },
      search: search.trim(),
    }).then(response => {
      if (cancelled) return
      const rows = response.products || response.data || []
      const mapped = rows.map(mapProduct)
      setProducts(mapped)
      setTotal(response.total ?? mapped.length)
    }).catch(err => {
      if (cancelled) return
      setError(err instanceof Error ? err.message : 'Failed to load products')
      setProducts([])
      setTotal(0)
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [page, pageSize, search, catFilter, statusFilter])

  const filtered = products
  const pageCount = Math.ceil(total / pageSize)
  const paginated = products

  const resetPage = () => setPage(1)

  const delta = 2
  const pStart = Math.max(1, page - delta), pEnd = Math.min(pageCount, page + delta)
  const range  = Array.from({ length: pEnd - pStart + 1 }, (_, i) => pStart + i)

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Products</h1>
          <p className="text-[13px] font-medium text-muted-foreground mt-0.5">Manage your product catalogue and variations</p>
        </div>
        <button onClick={() => navigate('/admin/products/new')}
          className="bg-primary text-white rounded-xl px-4 py-2.5 text-[13px] font-semibold hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center gap-1.5 shrink-0"
          style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add Product
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-black/[0.06] flex items-center gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); resetPage() }} placeholder="Search by name, SKU, brand…"
              className="w-full h-9 pl-9 pr-8 bg-[#F4F5F7] rounded-xl text-[13px] font-medium text-foreground border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            {search && (
              <button onClick={() => { setSearch(''); resetPage() }} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors">
                <svg className="w-2.5 h-2.5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <CategoryFilterDropdown value={catFilter} options={categoryOptions} onChange={v => { setCatFilter(v); resetPage() }} />
          <StatusFilterDropdown value={statusFilter} onChange={v => { setStatusFilter(v); resetPage() }} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.05]">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-10">#</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">SKU</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Brand / Model</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Price</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center">
                  <p className="text-[13px] font-semibold text-muted-foreground">Loading products...</p>
                </td></tr>
              ) : error ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-[13px] font-semibold text-red-500">{error}</p>
                    <button onClick={resetPage} className="text-[12px] font-semibold text-primary hover:underline">Retry</button>
                  </div>
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-muted-foreground/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <p className="text-[13px] font-semibold text-muted-foreground">No products match your search</p>
                    <button onClick={() => { setSearch(''); setCatFilter('all'); setStatusFilter('all'); resetPage() }} className="text-[12px] font-semibold text-primary hover:underline">Clear filters</button>
                  </div>
                </td></tr>
              ) : paginated.map((p, i) => {
                const sc  = statusConfig[p.status]
                const col = avatarColors[filtered.indexOf(p) % avatarColors.length]
                return (
                  <tr key={p.guid} onClick={() => navigate(`/admin/products/${p.guid}/edit`)} className="border-b border-black/[0.04] hover:bg-[#F4F5F7]/70 transition-colors last:border-0 cursor-pointer">
                    <td className="px-5 py-3.5 text-[13px] font-medium text-muted-foreground">{(page - 1) * pageSize + i + 1}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {(p.image || p.images?.[0])
                          ? <img src={p.image || p.images[0]} alt={p.name} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                          : <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white text-[11px] font-bold ${col}`}>{initials(p.name)}</span>
                        }
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-[13px] font-semibold text-foreground whitespace-nowrap">{p.name}</span>
                          {p.hasVariants && (
                            <span className="text-[11px] font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md self-start whitespace-nowrap">
                              {p.variantCount} variants
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[12px] font-semibold text-muted-foreground bg-[#F4F5F7] px-2.5 py-1 rounded-lg">{p.sku}</span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-medium text-muted-foreground whitespace-nowrap">{p.category}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] font-semibold text-foreground">{p.brand}</span>
                        {p.model && <span className="text-[11px] font-medium text-muted-foreground">{p.model}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] font-semibold text-foreground whitespace-nowrap">
                        {p.hasVariants && p.variants.length > 0 ? <span className="text-[11px] font-medium text-muted-foreground mr-1">from</span> : null}
                        {displayPrice(p)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl ${sc.bg} ${sc.text}`}>{sc.label}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button title="Edit" onClick={e => { e.stopPropagation(); navigate(`/admin/products/${p.guid}/edit`) }} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" /></svg>
                        </button>
                        <button title="Delete" onClick={e => { e.stopPropagation(); setDeleting(p) }} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-4 border-t border-black/[0.06] flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-medium text-muted-foreground">
              Showing {total === 0 ? 0 : Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-muted-foreground">Rows per page:</span>
              <PageSizeDropdown value={pageSize} onChange={s => { setPageSize(s); resetPage() }} />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            {range[0] > 1 && (<><button onClick={() => setPage(1)} className="w-8 h-8 rounded-lg text-[13px] font-semibold text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">1</button>{range[0] > 2 && <span className="w-8 h-8 flex items-center justify-center text-[13px] text-muted-foreground">…</span>}</>)}
            {range.map(pg => <button key={pg} onClick={() => setPage(pg)} className={['w-8 h-8 rounded-lg text-[13px] font-semibold transition-all', pg === page ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground'].join(' ')}>{pg}</button>)}
            {range[range.length - 1] < pageCount && (<>{range[range.length - 1] < pageCount - 1 && <span className="w-8 h-8 flex items-center justify-center text-[13px] text-muted-foreground">…</span>}<button onClick={() => setPage(pageCount)} className="w-8 h-8 rounded-lg text-[13px] font-semibold text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">{pageCount}</button></>)}
            <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount || pageCount === 0} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>
      </div>

      {deleting && (
        <DeleteModal
          name={deleting.name}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            callGateway(methods.products.delete, { guid: deleting.guid }).finally(() => {
              setDeleting(null)
              resetPage()
            })
          }}
        />
      )}
    </div>
  )
}
