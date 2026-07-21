import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { callGateway, gatewayList, methods } from '../../api/gateway'
import { formatDate } from '../../api/adminCrud'

// ─── Types ────────────────────────────────────────────────────────────────────

type BonusStatus     = 'active' | 'inactive'
type AssignTarget    = 'categories' | 'products'

interface BonusAssignment { target: AssignTarget; ids: Array<number | string> }

interface Bonus {
  id: number | string
  name: string
  value: number
  assignment: BonusAssignment
  status: BonusStatus
  createdAt: string
}

// ─── Fallback data ────────────────────────────────────────────────────────────

const initialBonuses: Bonus[] = [
  { id: 1, name: 'Summer Engine Promo', value: 8, assignment: { target: 'categories', ids: [1, 5] }, status: 'active', createdAt: 'Jun 10, 2026' },
]

interface CategoryOption { id: number | string; name: string }

const MOCK_CATEGORIES: CategoryOption[] = [
  { id: 1, name: 'Engine Parts' },
  { id: 2, name: 'Brakes & Suspension' },
  { id: 3, name: 'Electrical' },
  { id: 4, name: 'Filters' },
  { id: 5, name: 'Transmission' },
  { id: 6, name: 'Body & Exterior' },
  { id: 7, name: 'Interior' },
  { id: 8, name: 'Tyres & Wheels' },
]

interface ProductVariation { id: number | string; name: string }
interface MockProduct      { id: number | string; name: string; variations: ProductVariation[] }

const MOCK_PRODUCTS: MockProduct[] = [
  { id: 101, name: 'NGK Spark Plug BKR6E',          variations: [{ id: 10101, name: 'Single Pack' }, { id: 10102, name: 'Box of 4' }, { id: 10103, name: 'Box of 8' }] },
  { id: 102, name: 'Bosch Oil Filter 0451103316',   variations: [{ id: 10201, name: 'Standard' }, { id: 10202, name: 'Long Life Edition' }] },
  { id: 103, name: 'Brembo Front Brake Pad P06007', variations: [{ id: 10301, name: 'Standard' }, { id: 10302, name: 'Sport' }, { id: 10303, name: 'Carbon Ceramic' }] },
  { id: 104, name: 'Mann Air Filter C27006',        variations: [{ id: 10401, name: 'Standard' }, { id: 10402, name: 'Heavy Duty' }] },
  { id: 105, name: 'Gates Timing Belt K025605XS',   variations: [{ id: 10501, name: 'Belt Only' }, { id: 10502, name: 'Belt + Tensioner Kit' }, { id: 10503, name: 'Full Kit with Water Pump' }] },
  { id: 106, name: 'Bilstein Shock Absorber B4',    variations: [{ id: 10601, name: 'Front Left' }, { id: 10602, name: 'Front Right' }, { id: 10603, name: 'Rear Left' }, { id: 10604, name: 'Rear Right' }] },
  { id: 107, name: 'Hella Headlight Bulb H7',       variations: [{ id: 10701, name: 'Standard 12V 55W' }, { id: 10702, name: 'Long Life 12V 55W' }, { id: 10703, name: 'High Beam 12V 65W' }] },
  { id: 108, name: 'Febi Wheel Bearing Kit',        variations: [{ id: 10801, name: 'Front Axle' }, { id: 10802, name: 'Rear Axle' }] },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ApiBonusRow = {
  guid: string
  name?: string
  value?: string | number
  is_active?: boolean
  created_at?: string
  appliers?: Array<{ applier_name?: string; applier_id?: string }>
}
type BonusesResponse = { bonuses?: ApiBonusRow[]; data?: ApiBonusRow[]; total?: number; stats?: Record<string, number> }
type CategoryLookupResponse = { categories?: Array<{ guid: string; name?: string; name_en?: string; name_ru?: string; name_uz?: string }>; data?: Array<{ guid: string; name?: string; name_en?: string; name_ru?: string; name_uz?: string }> }
type ProductLookupResponse = { products?: Array<{ guid: string; name?: string; sku?: string }>; data?: Array<{ guid: string; name?: string; sku?: string }> }

function mapBonus(row: ApiBonusRow): Bonus {
  const appliers = row.appliers || []
  const target: AssignTarget = appliers[0]?.applier_name === 'products' ? 'products' : 'categories'
  return {
    id: row.guid,
    name: row.name || '',
    value: Number(row.value || 0),
    assignment: { target, ids: appliers.map(a => a.applier_id || '').filter(Boolean) },
    status: row.is_active === false ? 'inactive' : 'active',
    createdAt: formatDate(row.created_at) || '',
  }
}

function assignmentLabel(a: BonusAssignment): string {
  if (a.target === 'categories') {
    return a.ids.length === 1 ? '1 Category' : `${a.ids.length} Categories`
  }
  return a.ids.length === 1 ? '1 Product' : `${a.ids.length} Products`
}

function useEscClose(onClose: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
}

function useLockScroll() {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────

function Checkbox({ checked, indeterminate, onChange }: {
  checked: boolean; indeterminate?: boolean; onChange: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate }, [indeterminate])
  return (
    <div
      onClick={onChange}
      className={['w-[18px] h-[18px] rounded-[5px] border-2 shrink-0 flex items-center justify-center cursor-pointer transition-all',
        checked || indeterminate ? 'bg-blue-600 border-blue-600' : 'bg-white border-black/20 hover:border-blue-400'].join(' ')}
    >
      {checked && !indeterminate && (
        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
      )}
      {indeterminate && <span className="w-2 h-0.5 bg-white rounded-full" />}
      <input ref={ref} type="checkbox" className="sr-only" readOnly checked={checked} />
    </div>
  )
}

// ─── Bonus Modal ──────────────────────────────────────────────────────────────

type ModalState = {
  name: string
  value: string
  assignTarget: AssignTarget
  assignIds: Array<number | string>
  status: BonusStatus
}

function BonusModal({
  initial, categories, products, onSave, onClose,
}: {
  initial?: Bonus
  categories: CategoryOption[]
  products: MockProduct[]
  onSave: (data: Omit<Bonus, 'id' | 'createdAt'>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<ModalState>(
    initial
      ? { name: initial.name, value: String(initial.value), assignTarget: initial.assignment.target, assignIds: [...initial.assignment.ids], status: initial.status }
      : { name: '', value: '', assignTarget: 'categories', assignIds: [], status: 'active' }
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const [assignSearch, setAssignSearch] = useState('')
  const overlayRef = useRef<HTMLDivElement>(null)
  useEscClose(onClose)
  useLockScroll()

  function set<K extends keyof ModalState>(key: K, value: ModalState[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  function switchTarget(t: AssignTarget) {
    setForm(f => ({ ...f, assignTarget: t, assignIds: [] }))
    setErrors(e => ({ ...e, assign: '' }))
    setAssignSearch('')
  }

  function toggleCategory(id: number | string) {
    setForm(f => ({ ...f, assignIds: f.assignIds.includes(id) ? f.assignIds.filter(x => x !== id) : [...f.assignIds, id] }))
    setErrors(e => ({ ...e, assign: '' }))
  }

  function hasAssigned(id: number | string) { return form.assignIds.map(String).includes(String(id)) }
  function isProductFull(p: MockProduct)    { return p.variations.every(v => hasAssigned(v.id)) }
  function isProductPartial(p: MockProduct) { return p.variations.some(v => hasAssigned(v.id)) && !isProductFull(p) }

  function toggleProduct(p: MockProduct) {
    const varIds = p.variations.map(v => v.id)
    if (isProductFull(p)) {
      setForm(f => ({ ...f, assignIds: f.assignIds.filter(id => !varIds.map(String).includes(String(id))) }))
    } else {
      setForm(f => ({ ...f, assignIds: [...new Set([...f.assignIds, ...varIds])] }))
    }
    setErrors(e => ({ ...e, assign: '' }))
  }

  function toggleVariation(varId: number | string) {
    setForm(f => ({ ...f, assignIds: hasAssigned(varId) ? f.assignIds.filter(x => String(x) !== String(varId)) : [...f.assignIds, varId] }))
    setErrors(e => ({ ...e, assign: '' }))
  }

  function toggleExpand(id: number | string) {
    const key = String(id)
    setExpandedProducts(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  }

  function handleSave() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Bonus name is required'
    const v = parseFloat(form.value)
    if (!form.value || isNaN(v) || v <= 0 || v > 100) e.value = 'Enter a value between 0.1 and 100'
    if (form.assignIds.length === 0) e.assign = 'Select at least one item'
    if (Object.keys(e).length) { setErrors(e); return }
    onSave({ name: form.name.trim(), value: parseFloat(form.value), assignment: { target: form.assignTarget, ids: form.assignIds }, status: form.status })
  }

  const inputCls = (err?: string) =>
    ['w-full rounded-xl px-4 py-2.5 text-[13px] font-medium bg-[#F4F5F7] border-2 outline-none transition-all',
      err ? 'border-red-400' : 'border-transparent focus:border-blue-500 focus:bg-white'].join(' ')

  const q = assignSearch.trim().toLowerCase()
  const filteredCategories = categories.filter(c => !q || c.name.toLowerCase().includes(q))
  const filteredProducts   = products.filter(p => !q || p.name.toLowerCase().includes(q) || p.variations.some(v => v.name.toLowerCase().includes(q)))
  const selectedCount = form.assignTarget === 'categories'
    ? form.assignIds.length
    : products.filter(p => p.variations.some(v => hasAssigned(v.id))).length

  return createPortal(
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
      onMouseDown={e => { if (e.target === overlayRef.current) onClose() }}>
      <div className="bg-card rounded-2xl w-[640px] max-h-[90vh] flex flex-col overflow-hidden" style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-black/[0.06] flex items-center justify-between shrink-0">
          <div>
            <p className="text-[16px] font-extrabold text-foreground">{initial ? 'Edit Bonus' : 'New Bonus'}</p>
            <p className="text-[12px] font-medium text-muted-foreground mt-0.5">{initial ? 'Update bonus details' : 'Create a new bonus rule'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

          {/* Name + Value */}
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Bonus Name</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Summer Engine Promo" className={inputCls(errors.name)} />
              {errors.name && <p className="text-[11px] font-semibold text-red-500">{errors.name}</p>}
            </div>
            <div className="w-32 flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Value (%)</label>
              <div className="relative">
                <input type="number" min={0.1} max={100} step={0.1} value={form.value}
                  onChange={e => set('value', e.target.value)} placeholder="0"
                  className={inputCls(errors.value) + ' pr-8'} />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-muted-foreground">%</span>
              </div>
              {errors.value && <p className="text-[11px] font-semibold text-red-500">{errors.value}</p>}
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
            <div className="flex gap-2">
              {(['active', 'inactive'] as BonusStatus[]).map(s => (
                <button key={s} type="button" onClick={() => set('status', s)}
                  className={['flex-1 rounded-xl py-2.5 text-[13px] font-semibold border-2 transition-all capitalize',
                    form.status === s
                      ? s === 'active' ? 'bg-emerald-50 border-emerald-400 text-emerald-600' : 'bg-red-50 border-red-400 text-red-500'
                      : 'bg-[#F4F5F7] border-transparent text-muted-foreground hover:border-black/10'].join(' ')}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Assignment */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Apply To
                {selectedCount > 0 && (
                  <span className="ml-2 normal-case font-bold text-blue-600">
                    ({selectedCount} {form.assignTarget === 'categories' ? 'categor' + (selectedCount === 1 ? 'y' : 'ies') : 'product' + (selectedCount !== 1 ? 's' : '')} selected)
                  </span>
                )}
              </label>
              <div className="relative">
                <select value={form.assignTarget} onChange={e => switchTarget(e.target.value as AssignTarget)}
                  className="appearance-none pl-3 pr-7 py-1.5 rounded-xl bg-[#F4F5F7] border-2 border-transparent text-[12px] font-bold text-foreground outline-none focus:border-blue-500 cursor-pointer transition-all">
                  <option value="categories">Specific Categories</option>
                  <option value="products">Specific Products</option>
                </select>
                <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
              </div>
            </div>
            {errors.assign && <p className="text-[11px] font-semibold text-red-500">{errors.assign}</p>}

            <div className="border-2 border-black/[0.06] rounded-2xl overflow-hidden">
              {/* Search */}
              <div className="px-4 py-3 border-b border-black/[0.06]">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                  <input value={assignSearch} onChange={e => setAssignSearch(e.target.value)}
                    placeholder={`Search ${form.assignTarget}…`}
                    className="w-full pl-8 pr-4 py-2 rounded-xl text-[12px] font-medium bg-[#F4F5F7] border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all" />
                </div>
              </div>

              {/* Categories list */}
              {form.assignTarget === 'categories' && (
                <div className="max-h-52 overflow-y-auto divide-y divide-black/[0.04]">
                  {filteredCategories.length === 0
                    ? <p className="text-[12px] text-muted-foreground text-center py-6">No categories found</p>
                    : filteredCategories.map(cat => {
                      const checked = form.assignIds.includes(cat.id)
                      return (
                        <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)}
                          className={['flex items-center gap-3 w-full px-4 py-2.5 transition-colors text-left', checked ? 'bg-blue-50' : 'hover:bg-[#F4F5F7]'].join(' ')}>
                          <Checkbox checked={checked} onChange={() => toggleCategory(cat.id)} />
                          <span className={['text-[13px] font-semibold', checked ? 'text-blue-700' : 'text-foreground'].join(' ')}>{cat.name}</span>
                        </button>
                      )
                    })}
                </div>
              )}

              {/* Products tree */}
              {form.assignTarget === 'products' && (
                <div className="max-h-52 overflow-y-auto">
                  {filteredProducts.length === 0
                    ? <p className="text-[12px] text-muted-foreground text-center py-6">No products found</p>
                    : filteredProducts.map(product => {
                      const full    = isProductFull(product)
                      const partial = isProductPartial(product)
                      const isOpen  = expandedProducts.has(String(product.id))
                      return (
                        <div key={product.id} className="border-b border-black/[0.04] last:border-0">
                          <div className={['flex items-center transition-colors', full ? 'bg-blue-50/60' : 'hover:bg-[#F4F5F7]'].join(' ')}>
                            <button type="button" onClick={() => toggleExpand(product.id)}
                              className="w-10 h-10 flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                              <svg className={['w-3.5 h-3.5 transition-transform', isOpen ? 'rotate-90' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                            </button>
                            <div className="flex items-center gap-3 flex-1 pr-4 py-2.5 cursor-pointer" onClick={() => toggleProduct(product)}>
                              <Checkbox checked={full} indeterminate={partial} onChange={() => toggleProduct(product)} />
                              <div className="flex-1 min-w-0">
                                <p className={['text-[13px] font-semibold truncate', full ? 'text-blue-700' : 'text-foreground'].join(' ')}>{product.name}</p>
                                <p className="text-[11px] font-medium text-muted-foreground">
                                  {product.variations.length} variation{product.variations.length !== 1 ? 's' : ''}
                                  {(full || partial) && <span className="ml-1.5 text-blue-600 font-bold">· {product.variations.filter(v => hasAssigned(v.id)).length} selected</span>}
                                </p>
                              </div>
                            </div>
                          </div>
                          {isOpen && (
                            <div className="border-l-2 border-blue-100 ml-10">
                              {product.variations.map(v => {
                                const vChecked = hasAssigned(v.id)
                                return (
                                  <button key={v.id} type="button" onClick={() => toggleVariation(v.id)}
                                    className={['flex items-center gap-3 w-full px-4 py-2 transition-colors text-left', vChecked ? 'bg-blue-50' : 'hover:bg-[#F4F5F7]'].join(' ')}>
                                    <Checkbox checked={vChecked} onChange={() => toggleVariation(v.id)} />
                                    <span className={['text-[12px] font-semibold', vChecked ? 'text-blue-700' : 'text-muted-foreground'].join(' ')}>{v.name}</span>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-black/[0.06] flex items-center justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSave}
            className="px-6 py-2.5 rounded-xl text-[13px] font-semibold bg-primary text-white hover:bg-blue-700 active:scale-[0.98] transition-all"
            style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
            {initial ? 'Save Changes' : 'Create Bonus'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({ name, onConfirm, onClose }: { name: string; onConfirm: () => void; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null)
  useEscClose(onClose)
  useLockScroll()
  return createPortal(
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
      onMouseDown={e => { if (e.target === overlayRef.current) onClose() }}>
      <div className="bg-card rounded-2xl w-[400px] p-6 shadow-2xl flex flex-col gap-4">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
          <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
          </svg>
        </div>
        <div>
          <p className="text-[15px] font-extrabold text-foreground">Delete Bonus</p>
          <p className="text-[13px] font-medium text-muted-foreground mt-1">
            Are you sure you want to delete <span className="font-bold text-foreground">"{name}"</span>? This cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 mt-1">
          <button onClick={onClose} className="flex-1 rounded-xl py-2.5 text-[13px] font-bold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl py-2.5 text-[13px] font-bold bg-red-500 text-white hover:bg-red-600 transition-colors">Delete</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BonusesPage() {
  const [bonuses, setBonuses]         = useState<Bonus[]>(initialBonuses)
  const [categories, setCategories]   = useState<CategoryOption[]>(MOCK_CATEGORIES)
  const [products, setProducts]       = useState<MockProduct[]>(MOCK_PRODUCTS)
  const [total, setTotal]             = useState(0)
  const [stats, setStats]             = useState<Record<string, number>>({})
  const [loading, setLoading]         = useState(false)
  const [reloadKey, setReloadKey]     = useState(0)
  const [search, setSearch]           = useState('')
  const [page, setPage]               = useState(1)
  const [pageSize]                    = useState(20)
  const [editModal, setEditModal]     = useState<Bonus | null | 'new'>(null)
  const [deleteModal, setDeleteModal] = useState<{ id: number | string; name: string } | null>(null)

  const totalActive   = stats.active ?? bonuses.filter(b => b.status === 'active').length
  const totalInactive = stats.inactive ?? bonuses.filter(b => b.status === 'inactive').length

  const filtered  = bonuses
  const pageCount = Math.ceil(total / pageSize)
  const paginated = filtered

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    gatewayList<BonusesResponse>(methods.bonuses.list, {
      page,
      limit: pageSize,
      search: search.trim() || undefined,
      filter: {},
      sort: { created_at: -1 },
    }).then(res => {
      if (cancelled) return
      const rows = res.bonuses || res.data || []
      setBonuses(rows.map(mapBonus))
      setTotal(res.total ?? rows.length)
      setStats(res.stats || {})
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [page, pageSize, search, reloadKey])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      gatewayList<CategoryLookupResponse>(methods.categories.list, { page: 1, limit: 500, sort: { created_at: -1 } }),
      gatewayList<ProductLookupResponse>(methods.products.list, { page: 1, limit: 500, sort: { created_at: -1 } }),
    ]).then(([categoryRes, productRes]) => {
      if (cancelled) return
      const categoryRows = categoryRes.categories || categoryRes.data || []
      const productRows = productRes.products || productRes.data || []
      if (categoryRows.length) {
        setCategories(categoryRows.map(row => ({
          id: row.guid,
          name: row.name_en || row.name || row.name_ru || row.name_uz || row.guid,
        })))
      }
      if (productRows.length) {
        setProducts(productRows.map(row => ({
          id: row.guid,
          name: row.name || row.sku || row.guid,
          variations: [{ id: row.guid, name: row.sku || row.name || row.guid }],
        })))
      }
    }).catch(() => undefined)
    return () => { cancelled = true }
  }, [])

  async function handleSave(data: Omit<Bonus, 'id' | 'createdAt'>) {
    const payload = {
      name: data.name,
      value: String(data.value),
      status: data.status,
      appliers: data.assignment.ids.map(id => ({ applier_name: data.assignment.target, applier_id: String(id) })),
    }
    if (editModal === 'new') {
      await callGateway(methods.bonuses.create, payload)
    } else if (editModal) {
      await callGateway(methods.bonuses.update, { ...payload, guid: editModal.id })
    }
    setEditModal(null)
    setReloadKey(k => k + 1)
  }

  async function handleDelete() {
    if (!deleteModal) return
    await callGateway(methods.bonuses.delete, { guid: String(deleteModal.id) })
    setBonuses(prev => prev.filter(b => b.id !== deleteModal.id))
    setDeleteModal(null)
  }

  const thCls = 'px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap'
  const tdCls = 'px-4 py-3 text-[13px] text-foreground'

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Bonuses</h1>
        <p className="text-[13px] font-medium text-muted-foreground mt-0.5">Create and manage bonuses assigned to categories or products</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Total Bonuses', value: bonuses.length,
            icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
            iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
          },
          {
            label: 'Active', value: totalActive,
            icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>,
            iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',
          },
          {
            label: 'Inactive', value: totalInactive,
            icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M4.93 4.93l14.14 14.14" /></svg>,
            iconBg: 'bg-red-100', iconColor: 'text-red-500',
          },
        ].map(({ label, value, icon, iconBg, iconColor }) => (
          <div key={label} className="bg-card rounded-2xl p-5 flex items-center gap-4 border border-black/[0.04]">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>{icon}</div>
            <div>
              <p className="text-[12px] font-semibold text-muted-foreground">{label}</p>
              <p className="text-[22px] font-extrabold text-foreground leading-none mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-card rounded-2xl border border-black/[0.04] overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-black/[0.06]">
          <div className="relative w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search bonuses…"
              className="w-full pl-9 pr-4 py-2 rounded-xl text-[13px] font-medium bg-[#F4F5F7] border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all" />
          </div>
          <button onClick={() => setEditModal('new')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-700 active:bg-blue-800 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            Add Bonus
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8F9FB] border-b border-black/[0.06]">
              <tr>
                <th className={thCls}>Bonus Name</th>
                <th className={thCls}>Value</th>
                <th className={thCls}>Applied To</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Created At</th>
                <th className={thCls}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-[13px] font-medium text-muted-foreground">{loading ? 'Loading bonuses...' : 'No bonuses found'}</td></tr>
              ) : paginated.map(b => {
                const sc = b.status === 'active'
                  ? { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', label: 'Active' }
                  : { bg: 'bg-red-50',     text: 'text-red-500',     dot: 'bg-red-400',     label: 'Inactive' }
                return (
                  <tr key={b.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className={tdCls}><span className="font-semibold">{b.name}</span></td>
                    <td className={tdCls}>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 text-[12px] font-bold">{b.value}%</span>
                    </td>
                    <td className={tdCls}>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F4F5F7] text-[12px] font-semibold text-foreground">
                        <svg className="w-3 h-3 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          {b.assignment.target === 'categories'
                            ? <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            : <><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></>}
                        </svg>
                        {assignmentLabel(b.assignment)}
                      </span>
                    </td>
                    <td className={tdCls}>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                      </span>
                    </td>
                    <td className={`${tdCls} text-muted-foreground font-medium`}>{b.createdAt}</td>
                    <td className={tdCls}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditModal(b)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-blue-50 hover:text-blue-600 transition-colors">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button onClick={() => setDeleteModal({ id: b.id, name: b.name })}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="px-5 py-3 border-t border-black/[0.06] flex items-center justify-between">
            <p className="text-[12px] font-medium text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className={['w-8 h-8 rounded-lg text-[13px] font-semibold transition-colors', page === n ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:bg-[#F4F5F7]'].join(' ')}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {editModal !== null && (
        <BonusModal
          initial={editModal === 'new' ? undefined : editModal as Bonus}
          categories={categories}
          products={products}
          onSave={handleSave}
          onClose={() => setEditModal(null)}
        />
      )}
      {deleteModal && (
        <DeleteModal name={deleteModal.name} onConfirm={handleDelete} onClose={() => setDeleteModal(null)} />
      )}
    </div>
  )
}
