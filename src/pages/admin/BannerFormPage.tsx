import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { callGateway, gatewayList, methods } from '../../api/gateway'
import { maybeUploadImage, rowStatus } from '../../api/adminCrud'

// ─── Types (exported so BannersPage can import them) ──────────────────────────

export type BannerStatus = 'active' | 'inactive'
export type BannerAssignTarget = 'categories' | 'products'

export interface BannerData {
  id: string
  title: string
  image: string
  assignment: { target: BannerAssignTarget; ids: string[] }
  status: BannerStatus
  createdAt: string
}

type ApiAssignee = { assignee_name?: string; assignee_id?: string }
type ApiBannerRow = {
  guid: string
  image?: string
  title_en?: string
  title_ru?: string
  title_uz?: string
  is_active?: boolean
  assignees?: ApiAssignee[] | string | null
}
type ApiCategoryRow = { guid: string; name?: string; name_en?: string; name_ru?: string; name_uz?: string }
type ApiProductRow = {
  guid: string
  name?: string
  sku?: string
  variant_options?: Array<{ guid?: string; name?: string; sku?: string }> | string | null
}

interface LookupCategory { id: string; name: string }
interface ProductVariation { id: string; name: string }
interface LookupProduct { id: string; name: string; variations: ProductVariation[] }

function parseAssignees(value: ApiBannerRow['assignees']): ApiAssignee[] {
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

function parseVariantOptions(value: ApiProductRow['variant_options']): Array<{ guid?: string; name?: string; sku?: string }> {
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

function bannerToForm(row: ApiBannerRow): FormState {
  const assignees = parseAssignees(row.assignees)
  const target = assignees[0]?.assignee_name === 'products' ? 'products' : 'categories'
  return {
    title: row.title_en || row.title_ru || row.title_uz || '',
    image: row.image || '',
    assignTarget: target,
    assignIds: assignees.map(item => String(item.assignee_id || '')).filter(Boolean),
    status: rowStatus(row) as BannerStatus,
  }
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────

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
      {indeterminate && <span className="w-2 h-0.5 bg-white rounded-full" />}
      <input ref={ref} type="checkbox" className="sr-only" readOnly checked={checked} />
    </div>
  )
}

// ─── Form state ───────────────────────────────────────────────────────────────

type FormState = {
  title: string
  image: string
  assignTarget: BannerAssignTarget
  assignIds: string[]
  status: BannerStatus
}

function emptyForm(): FormState {
  return { title: '', image: '', assignTarget: 'categories', assignIds: [], status: 'active' }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BannerFormPage() {
  const navigate = useNavigate()
  const { id }   = useParams<{ id: string }>()
  const isEdit   = !!id

  const [form, setForm]                     = useState<FormState>(emptyForm())
  const [categories, setCategories]         = useState<LookupCategory[]>([])
  const [products, setProducts]             = useState<LookupProduct[]>([])
  const [loading, setLoading]               = useState(isEdit)
  const [saving, setSaving]                 = useState(false)
  const [loadError, setLoadError]           = useState('')
  const [errors, setErrors]                 = useState<Partial<Record<string, string>>>({})
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const [assignSearch, setAssignSearch]     = useState('')
  const [dragOver, setDragOver]             = useState(false)
  const fileInputRef                        = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      gatewayList<{ categories?: ApiCategoryRow[]; data?: ApiCategoryRow[] }>(methods.categories.list, { page: 1, limit: 500, sort: { created_at: -1 } }),
      gatewayList<{ products?: ApiProductRow[]; data?: ApiProductRow[] }>(methods.products.list, { page: 1, limit: 500, sort: { created_at: -1 } }),
    ]).then(([categoryResponse, productResponse]) => {
      if (cancelled) return
      const categoryRows = categoryResponse.categories || categoryResponse.data || []
      setCategories(categoryRows.map(row => ({ id: row.guid, name: row.name_en || row.name_ru || row.name_uz || row.name || row.guid })))
      const productRows = productResponse.products || productResponse.data || []
      setProducts(productRows.map(row => {
        const options = parseVariantOptions(row.variant_options)
        return {
          id: row.guid,
          name: row.name || row.sku || row.guid,
          variations: options.length > 0
            ? options.map(option => ({ id: String(option.guid || ''), name: option.name || option.sku || String(option.guid || '') })).filter(option => option.id)
            : [{ id: row.guid, name: row.name || row.sku || row.guid }],
        }
      }))
    }).catch(e => {
      if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load banner lookups')
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!isEdit || !id) return
    let cancelled = false
    setLoading(true)
    callGateway<{ banner?: ApiBannerRow }>(methods.banners.get, { guid: id })
      .then(response => {
        if (!cancelled && response.banner) setForm(bannerToForm(response.banner))
      })
      .catch(e => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load banner')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [id, isEdit])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function switchTarget(t: BannerAssignTarget) {
    setForm((f) => ({ ...f, assignTarget: t, assignIds: [] }))
    setErrors((e) => ({ ...e, assign: undefined }))
    setAssignSearch('')
  }

  // ── Image ──
  const readFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        setForm((f) => ({ ...f, image: result }))
        setErrors((e) => ({ ...e, image: undefined }))
      }
    }
    reader.readAsDataURL(file)
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) readFile(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) readFile(file)
  }

  // ── Category selection ──
  function toggleCategory(catId: string) {
    setForm((f) => ({
      ...f,
      assignIds: f.assignIds.includes(catId)
        ? f.assignIds.filter((x) => x !== catId)
        : [...f.assignIds, catId],
    }))
    setErrors((e) => ({ ...e, assign: undefined }))
  }

  // ── Product selection ──
  function isProductFull(p: LookupProduct) { return p.variations.every((v) => form.assignIds.includes(v.id)) }
  function isProductPartial(p: LookupProduct) { return p.variations.some((v) => form.assignIds.includes(v.id)) && !isProductFull(p) }

  function toggleProduct(p: LookupProduct) {
    const varIds = p.variations.map((v) => v.id)
    if (isProductFull(p)) {
      setForm((f) => ({ ...f, assignIds: f.assignIds.filter((id) => !varIds.includes(id)) }))
    } else {
      setForm((f) => ({ ...f, assignIds: [...new Set([...f.assignIds, ...varIds])] }))
    }
    setErrors((e) => ({ ...e, assign: undefined }))
  }

  function toggleVariation(varId: string) {
    setForm((f) => ({
      ...f,
      assignIds: f.assignIds.includes(varId)
        ? f.assignIds.filter((x) => x !== varId)
        : [...f.assignIds, varId],
    }))
    setErrors((e) => ({ ...e, assign: undefined }))
  }

  function toggleProductExpand(pid: string) {
    setExpandedProducts((prev) => {
      const next = new Set(prev)
      if (next.has(pid)) next.delete(pid)
      else next.add(pid)
      return next
    })
  }

  // ── Submit ──
  function validate() {
    const errs: typeof errors = {}
    if (!form.title.trim()) errs.title = 'Banner title is required'
    if (!form.image)        errs.image = 'Please upload a banner image'
    if (form.assignIds.length === 0) errs.assign = 'Select at least one item'
    if (Object.keys(errs).length) { setErrors(errs); return false }
    return true
  }

  async function handleSubmit() {
    if (!validate()) return
    setSaving(true)
    setLoadError('')
    try {
      const image = await maybeUploadImage(form.image)
      const payload = {
        title_en: form.title.trim(),
        title_ru: form.title.trim(),
        title_uz: form.title.trim(),
        image,
        status: form.status,
        assignees: form.assignIds.map(assigneeId => ({
          assignee_name: form.assignTarget,
          assignee_id: assigneeId,
        })),
      }
      await callGateway(isEdit && id ? methods.banners.update : methods.banners.create, isEdit && id ? { ...payload, guid: id } : payload)
      navigate('/admin/banners')
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to save banner')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = (err?: string) =>
    ['w-full rounded-xl px-4 py-2.5 text-[13px] font-medium bg-[#F4F5F7] border-2 outline-none transition-all',
      err ? 'border-red-400' : 'border-transparent focus:border-blue-500 focus:bg-white'].join(' ')

  const q = assignSearch.trim().toLowerCase()
  const filteredCategories = categories.filter((c) => !q || c.name.toLowerCase().includes(q))
  const filteredProducts   = products.filter((p) =>
    !q || p.name.toLowerCase().includes(q) || p.variations.some((v) => v.name.toLowerCase().includes(q))
  )
  const selectedCount = form.assignTarget === 'categories'
    ? form.assignIds.length
    : products.filter((p) => p.variations.some((v) => form.assignIds.includes(v.id))).length

  return (
    <div className="p-6 flex flex-col gap-6 max-w-5xl">
      {loadError && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-[13px] font-semibold text-red-600">{loadError}</div>
      )}
      {loading && (
        <div className="rounded-xl bg-card border border-black/[0.06] px-4 py-3 text-[13px] font-semibold text-muted-foreground">Loading banner...</div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/banners')}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-card border border-black/[0.08] transition-colors shrink-0"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div>
          <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">
            {isEdit ? 'Edit Banner' : 'New Banner'}
          </h1>
          <p className="text-[13px] font-medium text-muted-foreground mt-0.5">
            {isEdit ? 'Update the banner details' : 'Upload an image and assign it to categories or products'}
          </p>
        </div>
      </div>

      {/* Body — two-column layout */}
      <div className="flex gap-6 items-start">

        {/* Left column: image + status */}
        <div className="flex flex-col gap-4 w-80 shrink-0">

          {/* Image upload card */}
          <div className="bg-card rounded-2xl border border-black/[0.06] p-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <p className="text-[12px] font-bold text-foreground mb-3">Banner Image</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {form.image ? (
              <div className="relative rounded-xl overflow-hidden border border-black/[0.08] group" style={{ height: 160 }}>
                <img src={form.image} alt="Banner preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-[12px] font-bold text-foreground shadow-lg"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => set('image', '')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-[12px] font-bold text-red-500 shadow-lg"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                    </svg>
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={[
                  'h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all',
                  dragOver
                    ? 'border-blue-500 bg-blue-50'
                    : errors.image
                      ? 'border-red-400 bg-red-50/40'
                      : 'border-black/[0.12] bg-[#F4F5F7] hover:border-blue-400 hover:bg-blue-50/40',
                ].join(' ')}
              >
                <div className={['w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                  dragOver ? 'bg-blue-100 text-blue-600' : 'bg-white text-muted-foreground'].join(' ')}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-semibold text-foreground">
                    {dragOver ? 'Drop image here' : 'Click to upload or drag & drop'}
                  </p>
                  <p className="text-[11px] font-medium text-muted-foreground mt-0.5">PNG, JPG, WEBP up to 10 MB</p>
                </div>
              </div>
            )}

            {errors.image && <p className="text-[11px] font-semibold text-red-500 mt-1.5">{errors.image}</p>}
          </div>

          {/* Status card */}
          <div className="bg-card rounded-2xl border border-black/[0.06] p-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <p className="text-[12px] font-bold text-foreground mb-3">Status</p>
            <div className="flex gap-2">
              {(['active', 'inactive'] as BannerStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set('status', s)}
                  className={['flex-1 rounded-xl py-2.5 text-[13px] font-semibold border-2 transition-all capitalize',
                    form.status === s
                      ? s === 'active'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-600'
                        : 'bg-red-50 border-red-400 text-red-500'
                      : 'bg-[#F4F5F7] border-transparent text-muted-foreground hover:border-black/10'].join(' ')}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: title + assignment */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {/* Title card */}
          <div className="bg-card rounded-2xl border border-black/[0.06] p-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Banner Title</label>
              <input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Summer Engine Sale"
                className={inputCls(errors.title)}
              />
              {errors.title && <p className="text-[11px] font-semibold text-red-500">{errors.title}</p>}
            </div>
          </div>

          {/* Assignment card */}
          <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            {/* Section header */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-black/[0.06]">
              <div>
                <p className="text-[13px] font-bold text-foreground">Assign to</p>
                <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                  {selectedCount > 0
                    ? `${selectedCount} ${form.assignTarget === 'categories' ? 'categor' + (selectedCount === 1 ? 'y' : 'ies') : 'product' + (selectedCount === 1 ? '' : 's')} selected`
                    : 'Nothing selected yet'}
                </p>
              </div>
              <div className="relative">
                <select
                  value={form.assignTarget}
                  onChange={(e) => switchTarget(e.target.value as BannerAssignTarget)}
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
              <p className="px-5 pt-2 text-[11px] font-semibold text-red-500">{errors.assign}</p>
            )}

            {/* Search */}
            <div className="px-5 py-3">
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

            {/* Categories list */}
            {form.assignTarget === 'categories' && (
              <div className="px-5 pb-5 flex flex-col gap-0.5 max-h-72 overflow-y-auto">
                {filteredCategories.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground text-center py-6">No categories found</p>
                ) : filteredCategories.map((cat) => {
                  const checked = form.assignIds.includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={['flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left',
                        checked ? 'bg-blue-50' : 'hover:bg-[#F4F5F7]'].join(' ')}
                    >
                      <Checkbox checked={checked} onChange={() => toggleCategory(cat.id)} />
                      <span className={['text-[13px] font-semibold', checked ? 'text-blue-700' : 'text-foreground'].join(' ')}>
                        {cat.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Products tree */}
            {form.assignTarget === 'products' && (
              <div className="pb-5 flex flex-col gap-0 max-h-80 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground text-center py-6">No products found</p>
                ) : filteredProducts.map((product) => {
                  const full    = isProductFull(product)
                  const partial = isProductPartial(product)
                  const isOpen  = expandedProducts.has(product.id)
                  return (
                    <div key={product.id}>
                      <div className={['flex items-center transition-colors', full ? 'bg-blue-50/60' : 'hover:bg-[#F4F5F7]'].join(' ')}>
                        <button
                          type="button"
                          onClick={() => toggleProductExpand(product.id)}
                          className="w-11 h-11 flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <svg
                            className={['w-3.5 h-3.5 transition-transform', isOpen ? 'rotate-90' : ''].join(' ')}
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                          >
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </button>
                        <div className="flex items-center gap-3 flex-1 pr-5 py-2.5 cursor-pointer" onClick={() => toggleProduct(product)}>
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

                      {isOpen && (
                        <div className="border-l-2 border-blue-100 ml-11">
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

          {/* Footer actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/banners')}
              className="flex-1 rounded-xl py-2.5 text-[13px] font-bold border-2 border-black/[0.08] text-foreground hover:bg-card transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || loading}
              className="flex-1 rounded-xl py-2.5 text-[13px] font-bold bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Banner'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
