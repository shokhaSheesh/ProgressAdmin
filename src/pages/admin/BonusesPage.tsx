import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

// ─── Types ────────────────────────────────────────────────────────────────────

type BonusStatus = 'active' | 'inactive'
type AssignTarget = 'categories' | 'products'

interface ProductVariation {
  id: number
  name: string
}

interface MockProduct {
  id: number
  name: string
  variations: ProductVariation[]
}

interface BonusAssignment {
  target: AssignTarget
  ids: number[]
}

interface Bonus {
  id: number
  name: string
  value: number
  assignment: BonusAssignment
  status: BonusStatus
  createdAt: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

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

const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: 101, name: 'NGK Spark Plug BKR6E',
    variations: [
      { id: 10101, name: 'Single Pack' },
      { id: 10102, name: 'Box of 4' },
      { id: 10103, name: 'Box of 8' },
    ],
  },
  {
    id: 102, name: 'Bosch Oil Filter 0451103316',
    variations: [
      { id: 10201, name: 'Standard' },
      { id: 10202, name: 'Long Life Edition' },
    ],
  },
  {
    id: 103, name: 'Brembo Front Brake Pad P06007',
    variations: [
      { id: 10301, name: 'Standard' },
      { id: 10302, name: 'Sport' },
      { id: 10303, name: 'Carbon Ceramic' },
    ],
  },
  {
    id: 104, name: 'Mann Air Filter C27006',
    variations: [
      { id: 10401, name: 'Standard' },
      { id: 10402, name: 'Heavy Duty' },
    ],
  },
  {
    id: 105, name: 'Gates Timing Belt K025605XS',
    variations: [
      { id: 10501, name: 'Belt Only' },
      { id: 10502, name: 'Belt + Tensioner Kit' },
      { id: 10503, name: 'Full Kit with Water Pump' },
    ],
  },
  {
    id: 106, name: 'Bilstein Shock Absorber B4',
    variations: [
      { id: 10601, name: 'Front Left' },
      { id: 10602, name: 'Front Right' },
      { id: 10603, name: 'Rear Left' },
      { id: 10604, name: 'Rear Right' },
    ],
  },
  {
    id: 107, name: 'Hella Headlight Bulb H7',
    variations: [
      { id: 10701, name: 'Standard 12V 55W' },
      { id: 10702, name: 'Long Life 12V 55W' },
      { id: 10703, name: 'High Beam 12V 65W' },
    ],
  },
  {
    id: 108, name: 'Febi Wheel Bearing Kit',
    variations: [
      { id: 10801, name: 'Front Axle' },
      { id: 10802, name: 'Rear Axle' },
    ],
  },
]

const initialBonuses: Bonus[] = [
  { id: 1, name: 'Summer Engine Promo',   value: 8,  assignment: { target: 'categories', ids: [1, 5] },                       status: 'active',   createdAt: 'Jun 10, 2026' },
  { id: 2, name: 'Brake Deal',            value: 12, assignment: { target: 'categories', ids: [2] },                          status: 'active',   createdAt: 'Jun 12, 2026' },
  { id: 3, name: 'NGK Loyalty Bonus',     value: 5,  assignment: { target: 'products',   ids: [10101, 10102, 10201] },        status: 'active',   createdAt: 'Jun 14, 2026' },
  { id: 4, name: 'Filter Week',           value: 10, assignment: { target: 'categories', ids: [4] },                          status: 'inactive', createdAt: 'Jun 15, 2026' },
  { id: 5, name: 'Suspension Mega Bonus', value: 15, assignment: { target: 'categories', ids: [2, 8] },                       status: 'active',   createdAt: 'Jun 16, 2026' },
  { id: 6, name: 'Electrical Boost',      value: 7,  assignment: { target: 'categories', ids: [3] },                          status: 'inactive', createdAt: 'Jun 17, 2026' },
  { id: 7, name: 'Brake Pads Promo',      value: 20, assignment: { target: 'products',   ids: [10301, 10302, 10601, 10602] }, status: 'active',   createdAt: 'Jun 18, 2026' },
  { id: 8, name: 'Clearance Bonus',       value: 3,  assignment: { target: 'products',   ids: [10501, 10502] },               status: 'inactive', createdAt: 'Jun 19, 2026' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assignmentLabel(a: BonusAssignment): string {
  if (a.target === 'categories') {
    return a.ids.length === 1 ? '1 Category' : `${a.ids.length} Categories`
  }
  // Count distinct parent products that have at least one variation selected
  const count = MOCK_PRODUCTS.filter((p) => p.variations.some((v) => a.ids.includes(v.id))).length
  return count === 1 ? '1 Product' : `${count} Products`
}

function useEscClose(onClose: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])
}

function useLockScroll() {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])
}

// ─── Checkbox component ───────────────────────────────────────────────────────

function Checkbox({ checked, indeterminate, onChange }: {
  checked: boolean
  indeterminate?: boolean
  onChange: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate
  }, [indeterminate])

  return (
    <div
      onClick={onChange}
      className={[
        'w-[18px] h-[18px] rounded-[5px] border-2 shrink-0 flex items-center justify-center cursor-pointer transition-all',
        checked || indeterminate
          ? 'bg-blue-600 border-blue-600'
          : 'bg-white border-black/20 hover:border-blue-400',
      ].join(' ')}
    >
      {checked && !indeterminate && (
        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      )}
      {indeterminate && (
        <span className="w-2 h-0.5 bg-white rounded-full" />
      )}
      <input ref={ref} type="checkbox" className="sr-only" readOnly checked={checked} />
    </div>
  )
}

// ─── Form types ───────────────────────────────────────────────────────────────

type BonusForm = {
  name: string
  value: string
  assignTarget: AssignTarget
  assignIds: number[]
  status: BonusStatus
}

function emptyForm(): BonusForm {
  return { name: '', value: '', assignTarget: 'categories', assignIds: [], status: 'active' }
}

function formFromBonus(b: Bonus): BonusForm {
  return {
    name: b.name,
    value: String(b.value),
    assignTarget: b.assignment.target,
    assignIds: [...b.assignment.ids],
    status: b.status,
  }
}

// ─── Bonus Modal ──────────────────────────────────────────────────────────────

function BonusModal({
  initial,
  onSave,
  onClose,
}: {
  initial: Bonus | 'new'
  onSave: (data: Omit<Bonus, 'id' | 'createdAt'>) => void
  onClose: () => void
}) {
  const isEdit = initial !== 'new'
  const [form, setForm] = useState<BonusForm>(isEdit ? formFromBonus(initial) : emptyForm())
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set())
  const [assignSearch, setAssignSearch] = useState('')
  const overlayRef = useRef<HTMLDivElement>(null)

  useEscClose(onClose)
  useLockScroll()

  function set<K extends keyof BonusForm>(key: K, value: BonusForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function switchTarget(t: AssignTarget) {
    setForm((f) => ({ ...f, assignTarget: t, assignIds: [] }))
    setErrors((e) => ({ ...e, assign: undefined }))
    setAssignSearch('')
  }

  // ── Category selection ──
  function toggleCategoryId(id: number) {
    setForm((f) => ({
      ...f,
      assignIds: f.assignIds.includes(id)
        ? f.assignIds.filter((x) => x !== id)
        : [...f.assignIds, id],
    }))
    setErrors((e) => ({ ...e, assign: undefined }))
  }

  // ── Product selection ──
  function isProductFull(p: MockProduct) {
    return p.variations.every((v) => form.assignIds.includes(v.id))
  }
  function isProductPartial(p: MockProduct) {
    return p.variations.some((v) => form.assignIds.includes(v.id)) && !isProductFull(p)
  }

  function toggleProduct(p: MockProduct) {
    const varIds = p.variations.map((v) => v.id)
    if (isProductFull(p)) {
      setForm((f) => ({ ...f, assignIds: f.assignIds.filter((id) => !varIds.includes(id)) }))
    } else {
      setForm((f) => ({ ...f, assignIds: [...new Set([...f.assignIds, ...varIds])] }))
    }
    setErrors((e) => ({ ...e, assign: undefined }))
  }

  function toggleVariation(varId: number) {
    setForm((f) => ({
      ...f,
      assignIds: f.assignIds.includes(varId)
        ? f.assignIds.filter((x) => x !== varId)
        : [...f.assignIds, varId],
    }))
    setErrors((e) => ({ ...e, assign: undefined }))
  }

  function toggleProductExpand(id: number) {
    setExpandedProducts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ── Validation ──
  function validate() {
    const errs: typeof errors = {}
    if (!form.name.trim()) errs.name = 'Bonus name is required'
    const v = parseFloat(form.value)
    if (!form.value || isNaN(v) || v <= 0 || v > 100) errs.value = 'Enter a value between 0.1 and 100'
    if (form.assignIds.length === 0) errs.assign = 'Select at least one item'
    if (Object.keys(errs).length) { setErrors(errs); return false }
    return true
  }

  function handleSubmit() {
    if (!validate()) return
    onSave({
      name: form.name.trim(),
      value: parseFloat(form.value),
      assignment: { target: form.assignTarget, ids: form.assignIds },
      status: form.status,
    })
  }

  const inputCls = (err?: string) =>
    ['w-full rounded-xl px-4 py-2.5 text-[13px] font-medium bg-[#F4F5F7] border-2 outline-none transition-all',
      err ? 'border-red-400' : 'border-transparent focus:border-blue-500 focus:bg-white'].join(' ')

  // Filtered lists
  const q = assignSearch.trim().toLowerCase()
  const filteredCategories = MOCK_CATEGORIES.filter((c) => !q || c.name.toLowerCase().includes(q))
  const filteredProducts = MOCK_PRODUCTS.filter((p) =>
    !q || p.name.toLowerCase().includes(q) || p.variations.some((v) => v.name.toLowerCase().includes(q))
  )

  const selectedCount = form.assignTarget === 'categories'
    ? form.assignIds.length
    : MOCK_PRODUCTS.filter((p) => p.variations.some((v) => form.assignIds.includes(v.id))).length

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="bg-card rounded-2xl w-[640px] max-w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-black/[0.06]">
          <div>
            <p className="text-[16px] font-extrabold text-foreground">{isEdit ? 'Edit Bonus' : 'New Bonus'}</p>
            <p className="text-[12px] font-medium text-muted-foreground mt-0.5">
              {isEdit ? 'Update the bonus details' : 'Create a new bonus and assign it to categories or products'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5 max-h-[72vh] overflow-y-auto">
          {/* Name + Value */}
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Bonus Name</label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Summer Engine Promo" className={inputCls(errors.name)} />
              {errors.name && <p className="text-[11px] font-semibold text-red-500">{errors.name}</p>}
            </div>
            <div className="w-32 flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Value (%)</label>
              <div className="relative">
                <input type="number" min={0.1} max={100} step={0.1} value={form.value}
                  onChange={(e) => set('value', e.target.value)} placeholder="0"
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
              {(['active', 'inactive'] as BonusStatus[]).map((s) => (
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

          {/* Assignment section */}
          <div className="flex flex-col gap-3 rounded-2xl border border-black/[0.08] overflow-hidden">
            {/* Section header */}
            <div className="px-4 pt-4 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-bold text-foreground">Apply to</p>
                <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                  {selectedCount > 0
                    ? `${selectedCount} ${form.assignTarget === 'categories' ? 'categor' + (selectedCount === 1 ? 'y' : 'ies') : 'product' + (selectedCount === 1 ? '' : 's')} selected`
                    : 'Nothing selected yet'}
                </p>
              </div>
              {/* Dropdown target selector */}
              <div className="relative">
                <select
                  value={form.assignTarget}
                  onChange={(e) => switchTarget(e.target.value as AssignTarget)}
                  className="appearance-none pl-3.5 pr-8 py-2 rounded-xl bg-[#F4F5F7] border-2 border-transparent text-[12px] font-bold text-foreground outline-none focus:border-blue-500 cursor-pointer transition-all"
                >
                  <option value="categories">Specific Categories</option>
                  <option value="products">Specific Products</option>
                </select>
                <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>

            {errors.assign && (
              <p className="px-4 text-[11px] font-semibold text-red-500 -mt-1">{errors.assign}</p>
            )}

            {/* Search */}
            <div className="px-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  placeholder={`Search ${form.assignTarget}…`}
                  className="w-full pl-8 pr-4 py-2 rounded-xl text-[12px] font-medium bg-[#F4F5F7] border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            {/* ── Categories list ── */}
            {form.assignTarget === 'categories' && (
              <div className="px-4 pb-4 flex flex-col gap-0.5 max-h-56 overflow-y-auto">
                {filteredCategories.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground text-center py-6">No categories found</p>
                ) : filteredCategories.map((cat) => {
                  const checked = form.assignIds.includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategoryId(cat.id)}
                      className={['flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left',
                        checked ? 'bg-blue-50' : 'hover:bg-[#F4F5F7]'].join(' ')}
                    >
                      <Checkbox checked={checked} onChange={() => toggleCategoryId(cat.id)} />
                      <span className={['text-[13px] font-semibold', checked ? 'text-blue-700' : 'text-foreground'].join(' ')}>
                        {cat.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* ── Products tree ── */}
            {form.assignTarget === 'products' && (
              <div className="pb-4 flex flex-col gap-0 max-h-64 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground text-center py-6">No products found</p>
                ) : filteredProducts.map((product) => {
                  const full = isProductFull(product)
                  const partial = isProductPartial(product)
                  const isOpen = expandedProducts.has(product.id)
                  return (
                    <div key={product.id}>
                      {/* Product row */}
                      <div className={['flex items-center gap-0 transition-colors', full ? 'bg-blue-50/60' : 'hover:bg-[#F4F5F7]'].join(' ')}>
                        {/* Expand toggle */}
                        <button
                          type="button"
                          onClick={() => toggleProductExpand(product.id)}
                          className="w-10 h-10 flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <svg
                            className={['w-3.5 h-3.5 transition-transform', isOpen ? 'rotate-90' : ''].join(' ')}
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                          >
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </button>
                        <div className="flex items-center gap-3 flex-1 pr-4 py-2.5 cursor-pointer" onClick={() => toggleProduct(product)}>
                          <Checkbox checked={full} indeterminate={partial} onChange={() => toggleProduct(product)} />
                          <div className="flex-1 min-w-0">
                            <p className={['text-[13px] font-semibold truncate', full ? 'text-blue-700' : 'text-foreground'].join(' ')}>
                              {product.name}
                            </p>
                            <p className="text-[11px] font-medium text-muted-foreground">
                              {product.variations.length} variation{product.variations.length !== 1 ? 's' : ''}
                              {(full || partial) && (
                                <span className="ml-1.5 text-blue-600 font-bold">
                                  · {product.variations.filter((v) => form.assignIds.includes(v.id)).length} selected
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Variations (expanded) */}
                      {isOpen && (
                        <div className="border-l-2 border-blue-100 ml-10">
                          {product.variations.map((v) => {
                            const vChecked = form.assignIds.includes(v.id)
                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => toggleVariation(v.id)}
                                className={['flex items-center gap-3 w-full px-4 py-2 transition-colors text-left',
                                  vChecked ? 'bg-blue-50' : 'hover:bg-[#F4F5F7]'].join(' ')}
                              >
                                <Checkbox checked={vChecked} onChange={() => toggleVariation(v.id)} />
                                <span className={['text-[12px] font-semibold', vChecked ? 'text-blue-700' : 'text-muted-foreground'].join(' ')}>
                                  {v.name}
                                </span>
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

        {/* Footer */}
        <div className="px-6 py-4 border-t border-black/[0.06] flex gap-3">
          <button onClick={onClose}
            className="flex-1 rounded-xl py-2.5 text-[13px] font-bold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit}
            className="flex-1 rounded-xl py-2.5 text-[13px] font-bold bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 transition-colors">
            {isEdit ? 'Save Changes' : 'Create Bonus'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({ name, onConfirm, onClose }: { name: string; onConfirm: () => void; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null)
  useEscClose(onClose)
  useLockScroll()

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
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

// ─── Row Actions ──────────────────────────────────────────────────────────────

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={onEdit}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-blue-50 hover:text-blue-600 transition-colors">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button onClick={onDelete}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
        </svg>
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BonusesPage() {
  const [bonuses, setBonuses]           = useState<Bonus[]>(initialBonuses)
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(1)
  const [pageSize]                      = useState(20)
  const [editModal, setEditModal]       = useState<Bonus | 'new' | null>(null)
  const [deleteModal, setDeleteModal]   = useState<{ id: number; name: string } | null>(null)

  const totalActive   = bonuses.filter((b) => b.status === 'active').length
  const totalInactive = bonuses.filter((b) => b.status === 'inactive').length

  const filtered  = bonuses.filter((b) => !search.trim() || b.name.toLowerCase().includes(search.trim().toLowerCase()))
  const pageCount = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  function handleSave(data: Omit<Bonus, 'id' | 'createdAt'>) {
    if (editModal === 'new') {
      setBonuses((prev) => [{ id: Date.now(), createdAt: 'Jun 22, 2026', ...data }, ...prev])
    } else if (editModal) {
      setBonuses((prev) => prev.map((b) => b.id === editModal.id ? { ...b, ...data } : b))
    }
    setEditModal(null)
  }

  function handleDelete() {
    if (!deleteModal) return
    setBonuses((prev) => prev.filter((b) => b.id !== deleteModal.id))
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
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search bonuses…"
              className="w-full pl-9 pr-4 py-2 rounded-xl text-[13px] font-medium bg-[#F4F5F7] border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all" />
          </div>
          <button onClick={() => setEditModal('new')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-700 active:bg-blue-800 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
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
                <tr><td colSpan={6} className="px-4 py-12 text-center text-[13px] font-medium text-muted-foreground">No bonuses found</td></tr>
              ) : paginated.map((b) => {
                const sc = b.status === 'active'
                  ? { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', label: 'Active' }
                  : { bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-400', label: 'Inactive' }
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
                            : <><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></>
                          }
                        </svg>
                        {assignmentLabel(b.assignment)}
                      </span>
                    </td>
                    <td className={tdCls}>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </span>
                    </td>
                    <td className={`${tdCls} text-muted-foreground font-medium`}>{b.createdAt}</td>
                    <td className={tdCls}>
                      <RowActions onEdit={() => setEditModal(b)} onDelete={() => setDeleteModal({ id: b.id, name: b.name })} />
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
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setPage(n)}
                  className={['w-8 h-8 rounded-lg text-[13px] font-semibold transition-colors', page === n ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:bg-[#F4F5F7]'].join(' ')}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {editModal !== null && (
        <BonusModal initial={editModal} onSave={handleSave} onClose={() => setEditModal(null)} />
      )}
      {deleteModal !== null && (
        <DeleteModal name={deleteModal.name} onConfirm={handleDelete} onClose={() => setDeleteModal(null)} />
      )}
    </div>
  )
}
