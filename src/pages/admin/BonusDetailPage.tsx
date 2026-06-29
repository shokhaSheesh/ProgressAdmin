import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

// ─── Types ────────────────────────────────────────────────────────────────────

export type BonusStatus     = 'active' | 'inactive'
export type BonusAssignTarget = 'categories' | 'products'

export interface BonusAssignment {
  target: BonusAssignTarget
  ids: number[]
}

export interface Bonus {
  id: number
  name: string
  value: number
  assignment: BonusAssignment
  status: BonusStatus
  createdAt: string
}

// ─── Shared store ─────────────────────────────────────────────────────────────

export const bonusStore: Bonus[] = [
  { id: 1, name: 'Summer Engine Promo',   value: 8,  assignment: { target: 'categories', ids: [1, 5] },                       status: 'active',   createdAt: 'Jun 10, 2026' },
  { id: 2, name: 'Brake Deal',            value: 12, assignment: { target: 'categories', ids: [2] },                          status: 'active',   createdAt: 'Jun 12, 2026' },
  { id: 3, name: 'NGK Loyalty Bonus',     value: 5,  assignment: { target: 'products',   ids: [10101, 10102, 10201] },        status: 'active',   createdAt: 'Jun 14, 2026' },
  { id: 4, name: 'Filter Week',           value: 10, assignment: { target: 'categories', ids: [4] },                          status: 'inactive', createdAt: 'Jun 15, 2026' },
  { id: 5, name: 'Suspension Mega Bonus', value: 15, assignment: { target: 'categories', ids: [2, 8] },                       status: 'active',   createdAt: 'Jun 16, 2026' },
  { id: 6, name: 'Electrical Boost',      value: 7,  assignment: { target: 'categories', ids: [3] },                          status: 'inactive', createdAt: 'Jun 17, 2026' },
  { id: 7, name: 'Brake Pads Promo',      value: 20, assignment: { target: 'products',   ids: [10301, 10302, 10601, 10602] }, status: 'active',   createdAt: 'Jun 18, 2026' },
  { id: 8, name: 'Clearance Bonus',       value: 3,  assignment: { target: 'products',   ids: [10501, 10502] },               status: 'inactive', createdAt: 'Jun 19, 2026' },
]

// ─── Mock lookup data ─────────────────────────────────────────────────────────

const MOCK_CATEGORIES = [
  { id: 1, name: 'Engine Parts' },
  { id: 2, name: 'Brakes & Suspension' },
  { id: 3, name: 'Electrical' },
  { id: 4, name: 'Filters' },
  { id: 5, name: 'Transmission' },
  { id: 6, name: 'Body & Exterior' },
  { id: 7, name: 'Interior' },
  { id: 8, name: 'Tyres & Wheels' },
]

interface ProductVariation { id: number; name: string }
interface MockProduct      { id: number; name: string; variations: ProductVariation[] }

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

// ─── Change log ───────────────────────────────────────────────────────────────

interface ChangeEntry {
  id: number
  timestamp: string
  user: string
  type: 'created' | 'status' | 'value' | 'assignment' | 'name'
  label: string
  from?: string
  to?: string
}

const MOCK_CHANGELOGS: Record<number, ChangeEntry[]> = {
  1: [
    { id: 1, timestamp: 'Jun 10, 2026 · 09:00', user: 'Admin',       type: 'created',    label: 'Bonus created' },
    { id: 2, timestamp: 'Jun 11, 2026 · 14:20', user: 'Admin',       type: 'value',      label: 'Value changed', from: '5%', to: '8%' },
    { id: 3, timestamp: 'Jun 12, 2026 · 10:05', user: 'Shokhruz S.', type: 'assignment', label: 'Transmission added to assignment' },
  ],
  2: [
    { id: 1, timestamp: 'Jun 12, 2026 · 11:00', user: 'Admin',       type: 'created',    label: 'Bonus created' },
    { id: 2, timestamp: 'Jun 13, 2026 · 09:30', user: 'Shokhruz S.', type: 'value',      label: 'Value changed', from: '10%', to: '12%' },
  ],
  3: [
    { id: 1, timestamp: 'Jun 14, 2026 · 08:45', user: 'Admin',       type: 'created',    label: 'Bonus created' },
    { id: 2, timestamp: 'Jun 14, 2026 · 09:10', user: 'Admin',       type: 'assignment', label: 'Bosch Oil Filter added to assignment' },
  ],
  4: [
    { id: 1, timestamp: 'Jun 15, 2026 · 10:00', user: 'Admin',       type: 'created',    label: 'Bonus created' },
    { id: 2, timestamp: 'Jun 16, 2026 · 15:30', user: 'Shokhruz S.', type: 'status',     label: 'Status changed', from: 'Active', to: 'Inactive' },
  ],
  5: [
    { id: 1, timestamp: 'Jun 16, 2026 · 08:00', user: 'Admin',       type: 'created',    label: 'Bonus created' },
    { id: 2, timestamp: 'Jun 16, 2026 · 08:30', user: 'Admin',       type: 'assignment', label: 'Tyres & Wheels added to assignment' },
    { id: 3, timestamp: 'Jun 17, 2026 · 11:00', user: 'Shokhruz S.', type: 'value',      label: 'Value changed', from: '12%', to: '15%' },
  ],
  6: [
    { id: 1, timestamp: 'Jun 17, 2026 · 09:15', user: 'Admin',       type: 'created',    label: 'Bonus created' },
    { id: 2, timestamp: 'Jun 18, 2026 · 16:00', user: 'Shokhruz S.', type: 'status',     label: 'Status changed', from: 'Active', to: 'Inactive' },
  ],
  7: [
    { id: 1, timestamp: 'Jun 18, 2026 · 10:00', user: 'Admin',       type: 'created',    label: 'Bonus created' },
    { id: 2, timestamp: 'Jun 18, 2026 · 10:45', user: 'Admin',       type: 'name',       label: 'Name changed', from: 'Brake Promo', to: 'Brake Pads Promo' },
    { id: 3, timestamp: 'Jun 19, 2026 · 09:00', user: 'Admin',       type: 'assignment', label: 'Bilstein variants added to assignment' },
  ],
  8: [
    { id: 1, timestamp: 'Jun 19, 2026 · 14:00', user: 'Admin',       type: 'created',    label: 'Bonus created' },
    { id: 2, timestamp: 'Jun 20, 2026 · 10:30', user: 'Shokhruz S.', type: 'status',     label: 'Status changed', from: 'Active', to: 'Inactive' },
  ],
}

function changeIcon(type: ChangeEntry['type']) {
  const wrap = (bg: string, color: string, path: React.ReactNode) => (
    <div className={`w-7 h-7 rounded-full ${bg} flex items-center justify-center shrink-0`}>
      <svg className={`w-3.5 h-3.5 ${color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">{path}</svg>
    </div>
  )
  switch (type) {
    case 'created':    return wrap('bg-blue-100',   'text-blue-600',   <><path d="M12 5v14M5 12h14" /></>)
    case 'status':     return wrap('bg-violet-100', 'text-violet-600', <><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></>)
    case 'value':      return wrap('bg-amber-100',  'text-amber-600',  <><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>)
    case 'assignment': return wrap('bg-emerald-100','text-emerald-600',<><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></>)
    default:           return wrap('bg-rose-100',   'text-rose-500',   <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>)
  }
}

function ChangeLogTab({ bonusId }: { bonusId: number | undefined }) {
  const entries = bonusId ? (MOCK_CHANGELOGS[bonusId] ?? []) : []

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#F4F5F7] flex items-center justify-center">
          <svg className="w-5 h-5 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" />
          </svg>
        </div>
        <p className="text-[14px] font-semibold text-muted-foreground">No changes recorded yet</p>
        <p className="text-[12px] font-medium text-muted-foreground/60">Changes will appear here after the bonus is saved</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      <div className="relative flex flex-col gap-0">
        <div className="absolute left-[13px] top-7 bottom-7 w-px bg-black/[0.06]" />
        {[...entries].reverse().map((entry, i) => (
          <div key={entry.id} className={['flex gap-4 relative', i > 0 ? 'mt-5' : ''].join(' ')}>
            {changeIcon(entry.type)}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-foreground">{entry.label}</p>
                  {entry.from && entry.to && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[11px] font-medium text-muted-foreground bg-[#F4F5F7] px-2 py-0.5 rounded-md">{entry.from}</span>
                      <svg className="w-3 h-3 text-muted-foreground/50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                      <span className="text-[11px] font-semibold bg-[#E8F0FE] text-blue-700 px-2 py-0.5 rounded-md">{entry.to}</span>
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">{entry.timestamp}</p>
                  <p className="text-[11px] font-semibold text-muted-foreground/70 mt-0.5">{entry.user}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
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

// ─── Form state ───────────────────────────────────────────────────────────────

type FormState = {
  name: string
  value: string
  assignTarget: BonusAssignTarget
  assignIds: number[]
  status: BonusStatus
}

function emptyForm(): FormState {
  return { name: '', value: '', assignTarget: 'categories', assignIds: [], status: 'active' }
}

function formFromBonus(b: Bonus): FormState {
  return { name: b.name, value: String(b.value), assignTarget: b.assignment.target, assignIds: [...b.assignment.ids], status: b.status }
}

// ─── Info tab (form) ──────────────────────────────────────────────────────────

function InfoTab({ form, setForm, errors, setErrors }: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
}) {
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set())
  const [assignSearch, setAssignSearch] = useState('')

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  function switchTarget(t: BonusAssignTarget) {
    setForm(f => ({ ...f, assignTarget: t, assignIds: [] }))
    setErrors(e => ({ ...e, assign: '' }))
    setAssignSearch('')
  }

  function toggleCategory(id: number) {
    setForm(f => ({ ...f, assignIds: f.assignIds.includes(id) ? f.assignIds.filter(x => x !== id) : [...f.assignIds, id] }))
    setErrors(e => ({ ...e, assign: '' }))
  }

  function isProductFull(p: MockProduct)    { return p.variations.every(v => form.assignIds.includes(v.id)) }
  function isProductPartial(p: MockProduct) { return p.variations.some(v => form.assignIds.includes(v.id)) && !isProductFull(p) }

  function toggleProduct(p: MockProduct) {
    const varIds = p.variations.map(v => v.id)
    if (isProductFull(p)) {
      setForm(f => ({ ...f, assignIds: f.assignIds.filter(id => !varIds.includes(id)) }))
    } else {
      setForm(f => ({ ...f, assignIds: [...new Set([...f.assignIds, ...varIds])] }))
    }
    setErrors(e => ({ ...e, assign: '' }))
  }

  function toggleVariation(varId: number) {
    setForm(f => ({ ...f, assignIds: f.assignIds.includes(varId) ? f.assignIds.filter(x => x !== varId) : [...f.assignIds, varId] }))
    setErrors(e => ({ ...e, assign: '' }))
  }

  function toggleExpand(id: number) {
    setExpandedProducts(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const inputCls = (err?: string) =>
    ['w-full rounded-xl px-4 py-2.5 text-[13px] font-medium bg-[#F4F5F7] border-2 outline-none transition-all',
      err ? 'border-red-400' : 'border-transparent focus:border-blue-500 focus:bg-white'].join(' ')

  const q = assignSearch.trim().toLowerCase()
  const filteredCategories = MOCK_CATEGORIES.filter(c => !q || c.name.toLowerCase().includes(q))
  const filteredProducts   = MOCK_PRODUCTS.filter(p => !q || p.name.toLowerCase().includes(q) || p.variations.some(v => v.name.toLowerCase().includes(q)))
  const selectedCount = form.assignTarget === 'categories'
    ? form.assignIds.length
    : MOCK_PRODUCTS.filter(p => p.variations.some(v => form.assignIds.includes(v.id))).length

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="grid grid-cols-[1fr_420px] gap-5 items-start">

        {/* Left: details + status */}
        <div className="flex flex-col gap-5">

          {/* Bonus details */}
          <div className="bg-card rounded-2xl border border-black/[0.06]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div className="px-6 py-4 border-b border-black/[0.06]">
              <p className="text-[14px] font-bold text-foreground">Bonus Details</p>
              <p className="text-[12px] font-medium text-muted-foreground">Name and percentage value</p>
            </div>
            <div className="p-6 flex flex-col gap-4">
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
            </div>
          </div>

          {/* Status */}
          <div className="bg-card rounded-2xl border border-black/[0.06]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div className="px-6 py-4 border-b border-black/[0.06]">
              <p className="text-[14px] font-bold text-foreground">Status</p>
              <p className="text-[12px] font-medium text-muted-foreground">Whether this bonus is active</p>
            </div>
            <div className="p-6">
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
          </div>
        </div>

        {/* Right: assignment */}
        <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-black/[0.06]">
            <div>
              <p className="text-[14px] font-bold text-foreground">Apply to</p>
              <p className="text-[12px] font-medium text-muted-foreground mt-0.5">
                {selectedCount > 0
                  ? `${selectedCount} ${form.assignTarget === 'categories' ? 'categor' + (selectedCount === 1 ? 'y' : 'ies') : 'product' + (selectedCount === 1 ? '' : 's')} selected`
                  : 'Nothing selected yet'}
              </p>
            </div>
            <div className="relative">
              <select value={form.assignTarget} onChange={e => switchTarget(e.target.value as BonusAssignTarget)}
                className="appearance-none pl-3.5 pr-8 py-2 rounded-xl bg-[#F4F5F7] border-2 border-transparent text-[12px] font-bold text-foreground outline-none focus:border-blue-500 cursor-pointer transition-all">
                <option value="categories">Specific Categories</option>
                <option value="products">Specific Products</option>
              </select>
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </div>
          </div>

          {errors.assign && <p className="px-5 pt-2 text-[11px] font-semibold text-red-500">{errors.assign}</p>}

          {/* Search */}
          <div className="px-5 py-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              <input value={assignSearch} onChange={e => setAssignSearch(e.target.value)}
                placeholder={`Search ${form.assignTarget}…`}
                className="w-full pl-8 pr-4 py-2 rounded-xl text-[12px] font-medium bg-[#F4F5F7] border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all" />
            </div>
          </div>

          {/* Categories */}
          {form.assignTarget === 'categories' && (
            <div className="px-5 pb-5 flex flex-col gap-0.5 max-h-80 overflow-y-auto">
              {filteredCategories.length === 0
                ? <p className="text-[12px] text-muted-foreground text-center py-6">No categories found</p>
                : filteredCategories.map(cat => {
                  const checked = form.assignIds.includes(cat.id)
                  return (
                    <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)}
                      className={['flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left', checked ? 'bg-blue-50' : 'hover:bg-[#F4F5F7]'].join(' ')}>
                      <Checkbox checked={checked} onChange={() => toggleCategory(cat.id)} />
                      <span className={['text-[13px] font-semibold', checked ? 'text-blue-700' : 'text-foreground'].join(' ')}>{cat.name}</span>
                    </button>
                  )
                })}
            </div>
          )}

          {/* Products */}
          {form.assignTarget === 'products' && (
            <div className="pb-5 flex flex-col gap-0 max-h-80 overflow-y-auto">
              {filteredProducts.length === 0
                ? <p className="text-[12px] text-muted-foreground text-center py-6">No products found</p>
                : filteredProducts.map(product => {
                  const full    = isProductFull(product)
                  const partial = isProductPartial(product)
                  const isOpen  = expandedProducts.has(product.id)
                  return (
                    <div key={product.id}>
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
                              {(full || partial) && <span className="ml-1.5 text-blue-600 font-bold">· {product.variations.filter(v => form.assignIds.includes(v.id)).length} selected</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                      {isOpen && (
                        <div className="border-l-2 border-blue-100 ml-10">
                          {product.variations.map(v => {
                            const vChecked = form.assignIds.includes(v.id)
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
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'info' | 'changelog'

export default function BonusDetailPage() {
  const navigate  = useNavigate()
  const { id }    = useParams<{ id: string }>()
  const isEdit    = !!id
  const existing  = isEdit ? bonusStore.find(b => b.id === Number(id)) : undefined

  const [tab,    setTab]    = useState<Tab>('info')
  const [form,   setForm]   = useState<FormState>(existing ? formFromBonus(existing) : emptyForm())
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Bonus name is required'
    const v = parseFloat(form.value)
    if (!form.value || isNaN(v) || v <= 0 || v > 100) e.value = 'Enter a value between 0.1 and 100'
    if (form.assignIds.length === 0) e.assign = 'Select at least one item'
    if (Object.keys(e).length) { setErrors(e); return false }
    return true
  }

  function handleSubmit() {
    if (!validate()) return
    const payload = {
      name: form.name.trim(),
      value: parseFloat(form.value),
      assignment: { target: form.assignTarget, ids: form.assignIds },
      status: form.status,
    }
    if (isEdit && existing) {
      const idx = bonusStore.findIndex(b => b.id === existing.id)
      if (idx >= 0) bonusStore[idx] = { ...bonusStore[idx], ...payload }
    } else {
      bonusStore.unshift({ id: Date.now(), createdAt: 'Jun 29, 2026', ...payload })
    }
    navigate('/admin/bonuses')
  }

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="px-6 pt-4 border-b border-black/[0.06] bg-card shrink-0">
        <div className="flex items-center gap-4 pb-3">
          <button onClick={() => navigate('/admin/bonuses')}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground border border-black/[0.08] hover:bg-[#F4F5F7] hover:text-foreground transition-all shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
            <button onClick={() => navigate('/admin/bonuses')} className="hover:text-foreground transition-colors">Bonuses</button>
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            <span className="text-foreground font-semibold">{isEdit ? (existing?.name ?? 'Edit Bonus') : 'New Bonus'}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {([{ key: 'info', label: 'Info' }, { key: 'changelog', label: 'Change Log' }] as { key: Tab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={['px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-all',
                tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'].join(' ')}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Change Log tab */}
      {tab === 'changelog' && (
        <div className="flex-1 overflow-auto bg-background">
          <ChangeLogTab bonusId={existing?.id} />
        </div>
      )}

      {/* Info tab */}
      {tab === 'info' && (
        <>
          <div className="flex-1 overflow-auto bg-background">
            <InfoTab form={form} setForm={setForm} errors={errors} setErrors={setErrors} />
          </div>
          <div className="shrink-0 border-t border-black/[0.06] bg-card px-6 py-4 flex items-center justify-end gap-3" style={{ boxShadow: '0 -2px 8px rgba(0,0,0,0.04)' }}>
            <button type="button" onClick={() => navigate('/admin/bonuses')}
              className="px-5 py-2.5 rounded-xl text-[13px] font-semibold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors">
              Cancel
            </button>
            <button type="button" onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl text-[13px] font-semibold bg-primary text-white hover:bg-primary-hover active:scale-[0.98] transition-all"
              style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
              {isEdit ? 'Save Changes' : 'Create Bonus'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
