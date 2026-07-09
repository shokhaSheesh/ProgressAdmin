import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  generateVariants, hasValidVariants,
  DEFAULT_VARIANT_KEY,
  type Status, type AttrDef, type Variant, type ProductInput, type VariantBase, type Specification,
} from '../../data/productsStore'
import { callGateway, gatewayList, methods } from '../../api/gateway'
import { uploadProductImage } from '../../api/uploadImage'

// ─── Form state ────────────────────────────────────────────────────────────────

interface FormData {
  name: string; sku: string
  category: string; brand: string; manufacturerBrand: string; model: string
  location: string; description: string
  specifications: Specification[]
  images: string[]; status: Status
  attributes: AttrDef[]; variants: Variant[]
}

type SelectOption = { value: string; label: string }
type ApiListResponse = {
  data?: Array<{ guid: string; name?: string }>
  categories?: Array<{ guid: string; name?: string }>
  locations?: Array<{ guid: string; name?: string }>
  manufacturer_brands?: Array<{ guid: string; name?: string }>
  brands?: Array<{ guid: string; name?: string }>
  models?: Array<{ guid: string; name?: string }>
}
type ProductDetailResponse = {
  product?: {
    guid?: string
    name?: string
    sku?: string
    categories_id?: string
    locations_id?: string
    manufacturer_brands_id?: string
    brands_id?: string
    models_id?: string
    description?: string
    images?: string[]
    is_active?: boolean
    product_specifications?: Array<{ guid?: string; attribute_name?: string; value?: string }>
    product_variants?: Array<{
      guid?: string
      name?: string
      product_variant_options?: Array<{
        guid?: string
        name?: string
        image?: string
        sku?: string
        price?: string[] | string
        quantity?: number | string
        is_enabled?: boolean
      }>
    }>
  }
  product_specifications?: Array<{ guid?: string; attribute_name?: string; value?: string }>
  product_variants?: Array<{
    guid?: string
    name?: string
    product_variant_options?: Array<{
      guid?: string
      name?: string
      image?: string
      sku?: string
      price?: string[] | string
      quantity?: number | string
      is_enabled?: boolean
    }>
  }>
}

const emptyForm: FormData = {
  name: '', sku: '',
  category: '', brand: '', manufacturerBrand: '', model: '',
  location: '', description: '',
  specifications: [],
  images: [], status: 'active',
  attributes: [], variants: [],
}

type Step = 1 | 2

const labelCls = 'text-[13px] font-bold text-foreground'
const inputCls = 'w-full bg-card text-foreground rounded-xl px-4 py-3 text-[13px] font-medium border border-black/[0.1] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/60'

function listRows(response: ApiListResponse, key: keyof ApiListResponse) {
  return response[key] || response.data || []
}

function toOptions(rows: Array<{ guid: string; name?: string }>): SelectOption[] {
  return rows.map(row => ({ value: row.guid, label: row.name || row.guid }))
}

function firstPrice(value: string[] | string | undefined) {
  if (Array.isArray(value)) return value[0] || ''
  return value || ''
}

function productVariantsToForm(variants: NonNullable<ProductDetailResponse['product_variants']>) {
  const attributes: AttrDef[] = variants.map(variant => ({
    id: variant.guid || String(Date.now()),
    name: variant.name || '',
    values: (variant.product_variant_options || []).map(option => option.name || '').filter(Boolean),
  })).filter(attribute => attribute.name && attribute.values.length > 0)

  const formVariants: Variant[] = []
  for (const variant of variants) {
    const attributeName = variant.name || ''
    for (const option of variant.product_variant_options || []) {
      const optionName = option.name || ''
      if (!attributeName || !optionName) continue
      formVariants.push({
        key: `${attributeName}:${optionName}`,
        attributes: { [attributeName]: optionName },
        sku: option.sku || '',
        brandName: '',
        price: firstPrice(option.price),
        quantity: String(option.quantity ?? ''),
        image: option.image || '',
        selected: option.is_enabled !== false,
      })
    }
  }

  return { attributes, variants: formVariants }
}

// ─── Rich text editor (lightweight) ─────────────────────────────────────────────

function RichText({ value, onChange, placeholder }: { value: string; onChange: (html: string) => void; placeholder: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value
  }, [value])

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus()
    document.execCommand(cmd, false, arg)
    onChange(ref.current?.innerHTML ?? '')
  }

  const tools: { cmd: string; arg?: string; label: React.ReactNode; title: string }[] = [
    { cmd: 'bold',          title: 'Bold',          label: <span className="font-bold text-[13px]">B</span> },
    { cmd: 'italic',        title: 'Italic',        label: <span className="italic text-[13px]">I</span> },
    { cmd: 'underline',     title: 'Underline',     label: <span className="underline text-[13px]">U</span> },
    { cmd: 'strikeThrough', title: 'Strikethrough', label: <span className="line-through text-[13px]">S</span> },
    { cmd: 'insertOrderedList',   title: 'Numbered list', label: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" /><path d="M4 6h1v4M4 10h2M6 18H4l2-2.5V14" /></svg> },
    { cmd: 'insertUnorderedList', title: 'Bullet list',   label: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="6" x2="21" y2="6" /><line x1="9" y1="12" x2="21" y2="12" /><line x1="9" y1="18" x2="21" y2="18" /><circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" /></svg> },
  ]

  return (
    <div className={['rounded-xl border bg-card overflow-hidden transition-all', focused ? 'border-primary ring-2 ring-primary/15' : 'border-black/[0.1]'].join(' ')}>
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-black/[0.07] bg-[#FAFBFC]">
        {tools.map((t, i) => (
          <button key={i} type="button" title={t.title} onMouseDown={e => e.preventDefault()} onClick={() => exec(t.cmd, t.arg)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground hover:bg-black/[0.06] transition-colors">
            {t.label}
          </button>
        ))}
        <div className="w-px h-5 bg-black/[0.1] mx-1" />
        <button type="button" title="Link" onMouseDown={e => e.preventDefault()}
          onClick={() => { const url = window.prompt('Enter URL'); if (url) exec('createLink', url) }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground hover:bg-black/[0.06] transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
        </button>
        <button type="button" title="Clear formatting" onMouseDown={e => e.preventDefault()} onClick={() => exec('removeFormat')}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground hover:bg-black/[0.06] transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h12M9 4l-2 16M15 20H8" /><line x1="16" y1="14" x2="22" y2="20" /><line x1="22" y1="14" x2="16" y2="20" /></svg>
        </button>
      </div>
      <div className="relative">
        {(!value || value === '<br>') && <span className="absolute left-4 top-3 text-[13px] text-muted-foreground/60 pointer-events-none italic">{placeholder}</span>}
        <div
          ref={ref}
          contentEditable
          onInput={e => onChange((e.target as HTMLDivElement).innerHTML)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="min-h-[120px] px-4 py-3 text-[13px] font-medium text-foreground focus:outline-none leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline"
        />
      </div>
    </div>
  )
}

// ─── Searchable dropdown ────────────────────────────────────────────────────────

function SearchableDropdown({
  value, options, placeholder, onChange, allowCustom = false,
}: { value: string; options: SelectOption[]; placeholder: string; onChange: (v: string) => void; allowCustom?: boolean }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQ('') } }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const selected = options.find(o => o.value === value)
  const filtered = q ? options.filter(o => o.label.toLowerCase().includes(q.toLowerCase())) : options

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => { setOpen(o => !o); setQ('') }}
        className={['w-full flex items-center justify-between bg-card rounded-xl px-4 py-3 text-[13px] font-medium border transition-all', open ? 'border-primary ring-2 ring-primary/15' : 'border-black/[0.1]'].join(' ')}>
        <span className={value ? 'text-foreground font-medium' : 'text-muted-foreground/60'}>{selected?.label || value || placeholder}</span>
        <svg className={['w-4 h-4 text-muted-foreground transition-transform shrink-0', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-30" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.14)' }}>
          <div className="p-2 border-b border-black/[0.06]">
            <input autoFocus type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Search…"
              onKeyDown={e => { if (e.key === 'Enter' && allowCustom && q.trim()) { onChange(q.trim()); setOpen(false); setQ('') } }}
              className="w-full bg-[#F4F5F7] rounded-lg px-3 py-2 text-[12px] font-medium text-foreground focus:outline-none" />
          </div>
          <div className="overflow-y-auto max-h-[200px]">
            {filtered.length === 0
              ? <p className="px-4 py-3 text-[12px] text-muted-foreground">{allowCustom ? 'Press Enter to add' : 'No results'}</p>
              : filtered.map(opt => (
                <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false); setQ('') }}
                  className={['w-full text-left px-4 py-2.5 text-[13px] transition-colors', opt.value === value ? 'bg-primary/[0.08] text-primary font-semibold' : 'text-foreground hover:bg-[#F4F5F7] font-medium'].join(' ')}>
                  {opt.label}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Card ───────────────────────────────────────────────────────────────────────

function Card({ title, children, right }: { title?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-black/[0.06] p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      {title && (
        <div className="flex items-center justify-between mb-5">
          <p className="text-[16px] font-extrabold text-foreground">{title}</p>
          {right}
        </div>
      )}
      {children}
    </div>
  )
}

// ─── Variant field columns ───────────────────────────────────────────────────────

const variantCols = [
  { key: 'price' as const,    label: 'Price',    w: 'w-[140px]', type: 'number', ph: '0' },
  { key: 'quantity' as const, label: 'Quantity', w: 'w-[120px]', type: 'number', ph: '0' },
  { key: 'sku' as const,      label: 'SKU',      w: 'w-[180px]', type: 'text',   ph: 'Auto', mono: true },
]

// ─── Page ────────────────────────────────────────────────────────────────────────

export default function ProductFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const productGuid = id || ''
  const isEdit = Boolean(productGuid)

  const [step, setStep] = useState<Step>(1)
  const [attempted, setAttempted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [categories, setCategories] = useState<SelectOption[]>([])
  const [locations, setLocations] = useState<SelectOption[]>([])
  const [manufacturerBrands, setManufacturerBrands] = useState<SelectOption[]>([])
  const [brands, setBrands] = useState<SelectOption[]>([])
  const [models, setModels] = useState<SelectOption[]>([])
  const attrIdRef = useRef(Date.now())
  const imgInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormData>(emptyForm)

  const base = (): VariantBase => ({ sku: form.sku, brandName: form.brand, price: '' })

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    callGateway<ProductDetailResponse>(methods.products.get, { guid: productGuid })
      .then(response => {
        if (cancelled) return
        const product = response.product
        if (!product?.guid) {
          navigate('/admin/products', { replace: true })
          return
        }
        const rawSpecifications = product.product_specifications || response.product_specifications || []
        const rawVariants = product.product_variants || response.product_variants || []
        const mappedVariants = productVariantsToForm(rawVariants)
        setForm({
          name: product.name || '',
          sku: product.sku || '',
          category: product.categories_id || '',
          brand: product.brands_id || '',
          manufacturerBrand: product.manufacturer_brands_id || '',
          model: product.models_id || '',
          location: product.locations_id || '',
          description: product.description || '',
          specifications: rawSpecifications.map(spec => ({
            key: spec.attribute_name || '',
            value: spec.value || '',
          })),
          images: product.images || [],
          status: product.is_active === false ? 'inactive' : 'active',
          attributes: mappedVariants.attributes,
          variants: mappedVariants.variants,
        })
      })
      .catch(() => {
        if (!cancelled) navigate('/admin/products', { replace: true })
      })
    return () => { cancelled = true }
  }, [isEdit, productGuid, navigate])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      gatewayList<ApiListResponse>(methods.categories.list, { page: 1, limit: 500, sort: { created_at: -1 } }),
      gatewayList<ApiListResponse>(methods.locations.list, { page: 1, limit: 500, sort: { created_at: -1 } }),
      gatewayList<ApiListResponse>(methods.manufacturerBrands.list, { page: 1, limit: 500, sort: { created_at: -1 } }),
      gatewayList<ApiListResponse>(methods.brands.list, { page: 1, limit: 500, sort: { created_at: -1 } }),
      gatewayList<ApiListResponse>(methods.models.list, { page: 1, limit: 500, sort: { created_at: -1 } }),
    ]).then(([catRes, locationRes, manufacturerRes, brandRes, modelRes]) => {
      if (cancelled) return
      setCategories(toOptions(listRows(catRes, 'categories')))
      setLocations(toOptions(listRows(locationRes, 'locations')))
      setManufacturerBrands(toOptions(listRows(manufacturerRes, 'manufacturer_brands')))
      setBrands(toOptions(listRows(brandRes, 'brands')))
      setModels(toOptions(listRows(modelRes, 'models')))
    }).catch(() => {
      if (!cancelled) setSaveError('Failed to load product relation lists')
    })

    return () => { cancelled = true }
  }, [])

  // Ensure a default variant exists for a no-option product
  useEffect(() => {
    if (form.variants.length === 0) {
      setForm(p => ({ ...p, variants: generateVariants(p.attributes, base(), []) }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const patch = (p: Partial<FormData>) => setForm(prev => ({ ...prev, ...p }))

  const hasVariants = hasValidVariants(form.attributes)

  // ── Options handlers ──
  const updateAttr = (attrId: string, p: Partial<AttrDef>) =>
    setForm(prev => {
      const attributes = prev.attributes.map(a => a.id === attrId ? { ...a, ...p } : a)
      return { ...prev, attributes, variants: generateVariants(attributes, base(), prev.variants) }
    })

  const addAttr = () =>
    setForm(prev => ({ ...prev, attributes: [...prev.attributes, { id: String(++attrIdRef.current), name: '', values: [] }] }))

  const removeAttr = (attrId: string) =>
    setForm(prev => {
      const attributes = prev.attributes.filter(a => a.id !== attrId)
      return { ...prev, attributes, variants: generateVariants(attributes, base(), prev.variants) }
    })

  const updateVariant = (key: string, p: Partial<Variant>) =>
    setForm(prev => ({ ...prev, variants: prev.variants.map(v => v.key === key ? { ...v, ...p } : v) }))

  // ── Images ──
  const addImages = async (files: FileList) => {
    const selected = Array.from(files).slice(0, 10 - form.images.length)
    if (selected.length === 0) return

    setUploadingImages(true)
    setSaveError('')
    try {
      const urls = await Promise.all(selected.map(file => uploadProductImage(file)))
      patch({ images: [...form.images, ...urls] })
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Image upload failed')
    } finally {
      setUploadingImages(false)
    }
  }
  const removeImage = (idx: number) => patch({ images: form.images.filter((_, i) => i !== idx) })

  // ── Validation & save ──
  const basicValid = form.name.trim() && form.category.trim() && form.location.trim() && form.description.trim() && form.images.length > 0
  const invalid = (cond: boolean) => attempted && cond

  const goNext = () => { setAttempted(true); if (basicValid) { setAttempted(false); setStep(2) } }

  const handleSave = async () => {
    setAttempted(true)
    setSaveError('')
    if (uploadingImages) {
      setSaveError('Wait for image upload to finish')
      return
    }
    if (!basicValid) { setStep(1); return }

    const input: ProductInput = {
      name: form.name.trim(), sku: form.sku.trim(),
      category: form.category, brand: form.brand.trim(),
      manufacturerBrand: form.manufacturerBrand,
      model: form.model.trim(),
      location: form.location, description: form.description,
      specifications: form.specifications.filter(s => s.key.trim() && s.value.trim()),
      images: form.images, image: form.images[0] ?? '', status: form.status,
      hasVariants,
      attributes: hasVariants ? form.attributes : [],
      variants: hasVariants ? form.variants.filter(v => v.selected) : [],
    }
    // For a no-variant product carry over the default variant's pricing fields
    if (!hasVariants) {
      const def = form.variants.find(v => v.key === DEFAULT_VARIANT_KEY) ?? form.variants[0]
      if (def) {
        input.sku = def.sku.trim() || input.sku
        input.variants = [def]   // keep one for price derivation; list hides badge since hasVariants=false
      }
    }

    const productVariants = hasVariants
      ? form.attributes
          .filter(attr => attr.name.trim() && attr.values.length > 0)
          .map(attr => ({
            name: attr.name.trim(),
            product_variant_options: attr.values.map(value => {
              const matching = form.variants.find(variant => variant.selected && variant.attributes[attr.name] === value)
              return {
                name: value,
                image: matching?.image || '',
                sku: matching?.sku || '',
                price: matching?.price ? [matching.price] : [],
                quantity: Number(matching?.quantity || 0),
                is_enabled: Boolean(matching?.selected),
              }
            }),
          }))
      : []

    const payload: Record<string, unknown> = {
      name: input.name,
      sku: input.sku,
      categories_id: form.category,
      locations_id: form.location,
      description: input.description,
      images: input.images,
      status: input.status,
      product_specifications: input.specifications.map(spec => ({
        attribute_name: spec.key,
        value: spec.value,
      })),
      product_variants: productVariants,
    }
    if (form.manufacturerBrand) payload.manufacturer_brands_id = form.manufacturerBrand
    if (form.brand) payload.brands_id = form.brand
    if (form.model) payload.models_id = form.model

    setSaving(true)
    try {
      await callGateway(isEdit ? methods.products.update : methods.products.create, isEdit && productGuid ? { ...payload, guid: productGuid } : payload)
      navigate('/admin/products')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const selectedCount = form.variants.filter(v => v.selected).length

  // ── Variant grouping (by first option) ──
  const firstAttr = form.attributes.find(a => a.name.trim() && a.values.length > 0)
  const groups = useMemo(() => {
    if (!hasVariants || !firstAttr) return [{ label: '', items: form.variants }]
    const map = new Map<string, Variant[]>()
    for (const val of firstAttr.values) map.set(val, [])
    for (const v of form.variants) {
      const val = v.attributes[firstAttr.name]
      if (map.has(val)) map.get(val)!.push(v)
    }
    return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
  }, [form.variants, firstAttr, hasVariants])

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin/products')}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">{isEdit ? 'Edit Product' : 'Create Product'}</h1>
          </div>
          <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground pt-2">
            <button onClick={() => navigate('/admin')} className="hover:text-foreground transition-colors">Home</button>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            <button onClick={() => navigate('/admin/products')} className="hover:text-foreground transition-colors">Products</button>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="text-foreground font-semibold">{isEdit ? 'Edit product' : 'New product'}</span>
          </div>
        </div>

        {/* Step tabs */}
        <div className="flex items-center gap-3 mt-5">
          <button onClick={() => setStep(1)}
            className={['flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-xl text-[13px] font-bold transition-all',
              step === 1 ? 'bg-primary text-white' : 'bg-[#F4F5F7] text-muted-foreground hover:text-foreground'].join(' ')}>
            <span className={['w-6 h-6 rounded-lg flex items-center justify-center text-[12px] font-bold', step === 1 ? 'bg-white/25 text-white' : 'bg-black/[0.07] text-muted-foreground'].join(' ')}>1</span>
            Basic Information
          </button>
          <button onClick={() => { setAttempted(false); setStep(2) }}
            className={['flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-xl text-[13px] font-bold transition-all',
              step === 2 ? 'bg-primary text-white' : (hasVariants ? 'bg-emerald-50 text-emerald-600' : 'bg-[#F4F5F7] text-muted-foreground hover:text-foreground')].join(' ')}>
            <span className={['w-6 h-6 rounded-lg flex items-center justify-center text-[12px] font-bold',
              step === 2 ? 'bg-white/25 text-white' : (hasVariants ? 'bg-emerald-100 text-emerald-600' : 'bg-black/[0.07] text-muted-foreground')].join(' ')}>
              {hasVariants && step !== 2
                ? <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                : '2'}
            </span>
            Product Variants (Optional)
          </button>
        </div>
      </div>

      {/* ── Scroll body ── */}
      <div className="flex-1 overflow-y-auto px-6">
        <div className="max-w-[1100px] mx-auto pb-6 flex flex-col gap-5">

          {/* ════════ STEP 1 ════════ */}
          {step === 1 && (
            <Card title="Basic Information">
              <div className="flex flex-col gap-5">

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.name} onChange={e => patch({ name: e.target.value })} placeholder="Product name"
                    className={[inputCls, invalid(!form.name.trim()) ? 'ring-2 ring-red-300 border-red-300' : ''].join(' ')} />
                  {invalid(!form.name.trim()) && <span className="text-[11px] font-medium text-red-500">Name is required</span>}
                </div>

                {/* Category */}
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Category <span className="text-red-500">*</span></label>
                  <SearchableDropdown value={form.category} options={categories} placeholder="Select category" onChange={v => patch({ category: v })} />
                  {invalid(!form.category.trim()) && <span className="text-[11px] font-medium text-red-500">Category is required</span>}
                </div>

                {/* Location + SKU */}
                <div className="grid grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Location <span className="text-red-500">*</span></label>
                    <SearchableDropdown value={form.location} options={locations} placeholder="Select location" onChange={v => patch({ location: v })} />
                    {invalid(!form.location.trim()) && <span className="text-[11px] font-medium text-red-500">Location is required</span>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>SKU</label>
                    <input type="text" value={form.sku} onChange={e => patch({ sku: e.target.value })} placeholder="Auto-generated if empty" className={`${inputCls} font-mono`} />
                  </div>
                </div>

                {/* Manufacturer Brand / Brand (car) */}
                <div className="grid grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Manufacturer Brand</label>
                    <SearchableDropdown value={form.manufacturerBrand} options={manufacturerBrands} placeholder="Select manufacturer" onChange={v => patch({ manufacturerBrand: v })} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Brand</label>
                    <SearchableDropdown value={form.brand} options={brands} placeholder="Select a brand" onChange={v => patch({ brand: v })} />
                  </div>
                </div>

                {/* Model */}
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Model</label>
                  <SearchableDropdown value={form.model} options={models} placeholder="Select model" onChange={v => patch({ model: v })} />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Description <span className="text-red-500">*</span></label>
                  <RichText value={form.description} onChange={v => patch({ description: v })} placeholder="Product description" />
                  {invalid(!form.description.trim()) && <span className="text-[11px] font-medium text-red-500">Description is required</span>}
                </div>

                {/* Specifications */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className={labelCls}>Specifications</label>
                    <button type="button"
                      onClick={() => patch({ specifications: [...form.specifications, { key: '', value: '' }] })}
                      className="text-[12px] font-bold text-primary hover:text-blue-700 transition-colors flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      Add spec
                    </button>
                  </div>

                  {form.specifications.length === 0 ? (
                    <button type="button"
                      onClick={() => patch({ specifications: [{ key: '', value: '' }] })}
                      className="w-full rounded-xl border border-dashed border-black/[0.12] hover:border-primary/40 py-6 text-[13px] font-semibold text-muted-foreground hover:text-primary transition-all flex flex-col items-center gap-1.5">
                      <svg className="w-5 h-5 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="12" y2="16" /></svg>
                      Add specifications (e.g. Thread Size, Voltage, Weight…)
                    </button>
                  ) : (
                    <div className="rounded-xl border border-black/[0.08] overflow-hidden">
                      {/* Header row */}
                      <div className="grid grid-cols-[1fr_1fr_36px] gap-0 bg-[#F8F9FB] border-b border-black/[0.07] px-4 py-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Attribute</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-3">Value</span>
                        <span />
                      </div>
                      {form.specifications.map((spec, idx) => (
                        <div key={idx} className="grid grid-cols-[1fr_1fr_36px] items-center border-b border-black/[0.05] last:border-0 px-4 py-2 gap-0 hover:bg-[#FAFBFC] transition-colors">
                          <input type="text" value={spec.key} onChange={e => {
                            const s = [...form.specifications]; s[idx] = { ...s[idx], key: e.target.value }; patch({ specifications: s })
                          }} placeholder="e.g. Thread Size"
                            className="bg-transparent text-[13px] font-medium text-foreground focus:outline-none placeholder:text-muted-foreground/50 pr-3 py-1 border-r border-black/[0.07]" />
                          <input type="text" value={spec.value} onChange={e => {
                            const s = [...form.specifications]; s[idx] = { ...s[idx], value: e.target.value }; patch({ specifications: s })
                          }} placeholder="e.g. M20×1.5"
                            className="bg-transparent text-[13px] font-medium text-foreground focus:outline-none placeholder:text-muted-foreground/50 px-3 py-1" />
                          <button type="button"
                            onClick={() => patch({ specifications: form.specifications.filter((_, i) => i !== idx) })}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:bg-red-50 hover:text-red-400 transition-all">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                      <button type="button"
                        onClick={() => patch({ specifications: [...form.specifications, { key: '', value: '' }] })}
                        className="w-full px-4 py-2.5 text-[12px] font-semibold text-muted-foreground hover:text-primary hover:bg-[#FAFBFC] transition-colors text-left border-t border-dashed border-black/[0.07] flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        Add row
                      </button>
                    </div>
                  )}
                </div>

                {/* Images */}
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Product Images <span className="text-red-500">*</span></label>
                  <input ref={imgInputRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={e => { if (e.target.files) void addImages(e.target.files); e.target.value = '' }} />

                  {form.images.length === 0 ? (
                    <div onClick={() => { if (!uploadingImages) imgInputRef.current?.click() }}
                      className={['rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 py-14 cursor-pointer transition-all',
                        invalid(form.images.length === 0) ? 'border-red-300 bg-red-50/40' : 'border-black/[0.12] hover:border-primary/40 bg-[#FAFBFC]'].join(' ')}>
                      <svg className="w-7 h-7 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      <p className="text-[14px] font-bold text-foreground">{uploadingImages ? 'Uploading images...' : 'Add images'}</p>
                      <p className="text-[12px] font-medium text-muted-foreground">0/10 · PNG, JPG, GIF up to 5MB</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {form.images.map((src, i) => (
                        <div key={i} className="relative w-[104px] h-[104px] rounded-xl overflow-hidden border border-black/[0.08] group">
                          <img src={src} alt="" className="w-full h-full object-cover" />
                          {i === 0 && <span className="absolute top-1.5 left-1.5 text-[10px] font-bold text-white bg-black/55 px-1.5 py-0.5 rounded-md">Cover</span>}
                          <button type="button" onClick={() => removeImage(i)}
                            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/55 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                      {form.images.length < 10 && (
                        <button type="button" onClick={() => imgInputRef.current?.click()} disabled={uploadingImages}
                          className="w-[104px] h-[104px] rounded-xl border-2 border-dashed border-black/[0.12] hover:border-primary/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-all bg-[#FAFBFC]">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                          <span className="text-[11px] font-semibold">{uploadingImages ? 'Uploading' : `${form.images.length}/10`}</span>
                        </button>
                      )}
                    </div>
                  )}
                  {invalid(form.images.length === 0) && <span className="text-[11px] font-medium text-red-500">At least one image is required</span>}
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3 pt-1">
                  <button type="button" onClick={() => patch({ status: form.status === 'active' ? 'inactive' : 'active' })}
                    className={['relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0', form.status === 'active' ? 'bg-primary' : 'bg-black/[0.15]'].join(' ')}>
                    <span className={['absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200', form.status === 'active' ? 'left-7' : 'left-1'].join(' ')} style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                  </button>
                  <span className="text-[13px] font-bold text-foreground">{form.status === 'active' ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </Card>
          )}

          {/* ════════ STEP 2 ════════ */}
          {step === 2 && (
            <>
              {/* Options */}
              <Card title="Options">
                <div className="flex flex-col gap-4">
                  {form.attributes.length === 0 && (
                    <div className="rounded-xl border border-dashed border-black/[0.12] bg-[#FAFBFC] py-8 flex flex-col items-center gap-1.5 text-center">
                      <p className="text-[13px] font-bold text-foreground">No options yet</p>
                      <p className="text-[12px] font-medium text-muted-foreground max-w-[320px]">Add an option like “Size” or “Color” to create variants. Leave empty for a simple product.</p>
                    </div>
                  )}

                  {form.attributes.map(attr => (
                    <OptionEditor key={attr.id} attr={attr}
                      onChange={p => updateAttr(attr.id, p)} onRemove={() => removeAttr(attr.id)} />
                  ))}

                  <button type="button" onClick={addAttr}
                    className="w-full rounded-xl border border-dashed border-black/[0.14] hover:border-primary/40 py-3 text-[13px] font-bold text-foreground hover:text-primary transition-all">
                    + Add another option
                  </button>
                </div>
              </Card>

              {/* Variants */}
              {hasVariants && (
                <Card
                  title={`Variants (${selectedCount} selected out of ${form.variants.length})`}
                  right={
                    <button type="button"
                      onClick={() => { const all = selectedCount === form.variants.length; setForm(p => ({ ...p, variants: p.variants.map(v => ({ ...v, selected: !all })) })) }}
                      className="text-[13px] font-bold text-primary hover:text-primary-hover transition-colors">
                      {selectedCount === form.variants.length ? 'Deselect all' : 'Select all'}
                    </button>
                  }>
                  <div className="flex flex-col gap-4">
                    {groups.map(group => (
                      <div key={group.label} className="rounded-xl border border-black/[0.07] overflow-hidden">
                        {group.label && (
                          <div className="px-4 py-2.5 bg-[#F8F9FA] border-b border-black/[0.06] flex items-center justify-between">
                            <span className="text-[12px] font-bold text-foreground uppercase tracking-wide">
                              {firstAttr?.name}: <span className="text-primary">{group.label}</span>
                            </span>
                            <span className="text-[11px] font-semibold text-muted-foreground">{group.items.filter(v => v.selected).length}/{group.items.length}</span>
                          </div>
                        )}
                        <div className="overflow-x-auto">
                          <div className="min-w-max">
                            {/* header */}
                            <div className="flex items-center gap-3 px-4 py-2 border-b border-black/[0.05] bg-white">
                              <span className="w-[150px] shrink-0 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Variant</span>
                              {variantCols.map(c => <span key={c.key} className={`${c.w} shrink-0 text-[10px] font-bold text-muted-foreground uppercase tracking-wider`}>{c.label}</span>)}
                            </div>
                            {/* rows */}
                            {group.items.map(v => (
                              <div key={v.key} className={['flex items-center gap-3 px-4 py-2.5 border-b border-black/[0.04] last:border-0 transition-colors', v.selected ? 'bg-primary/[0.02]' : 'opacity-60'].join(' ')}>
                                <div className="w-[150px] shrink-0 flex items-center gap-2.5">
                                  <button type="button" onClick={() => updateVariant(v.key, { selected: !v.selected })}
                                    className={['w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition-all shrink-0', v.selected ? 'bg-primary border-primary' : 'border-black/20 hover:border-black/40'].join(' ')}>
                                    {v.selected && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                  </button>
                                  <span className="text-[12px] font-bold text-foreground truncate">{Object.values(v.attributes).join(' / ')}</span>
                                </div>
                                {variantCols.map(c => (
                                  <input key={c.key} type={c.type} value={v[c.key]} onChange={e => updateVariant(v.key, { [c.key]: e.target.value })}
                                    placeholder={c.ph} min={c.type === 'number' ? '0' : undefined}
                                    className={[c.w, 'shrink-0 bg-[#F4F5F7] text-foreground rounded-lg px-2.5 py-2 text-[12px] border border-transparent focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all', c.mono ? 'font-mono' : ''].join(' ')} />
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="shrink-0 border-t border-black/[0.06] bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/products')}
          className="rounded-xl px-5 py-2.5 text-[13px] font-semibold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors">
            Cancel
          </button>
          {saveError && <span className="text-[12px] font-semibold text-red-500">{saveError}</span>}
        </div>
        <div className="flex items-center gap-2.5">
          {step === 2 && (
            <button onClick={() => setStep(1)}
              className="rounded-xl px-5 py-2.5 text-[13px] font-semibold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              Back
            </button>
          )}
          {step === 1 ? (
            <button onClick={goNext}
              className="rounded-xl px-6 py-2.5 text-[13px] font-semibold bg-primary text-white hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center gap-1.5"
              style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
              Next
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving || uploadingImages}
              className="rounded-xl px-6 py-2.5 text-[13px] font-semibold bg-primary text-white hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
              {uploadingImages ? 'Uploading...' : saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Product')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Option editor ───────────────────────────────────────────────────────────────

function OptionEditor({ attr, onChange, onRemove }: { attr: AttrDef; onChange: (p: Partial<AttrDef>) => void; onRemove: () => void }) {
  const [editing, setEditing] = useState(!attr.name.trim() || attr.values.length === 0)
  const [newVal, setNewVal] = useState('')

  const addValue = (raw: string) => {
    const v = raw.trim()
    if (v && !attr.values.includes(v)) onChange({ values: [...attr.values, v] })
    setNewVal('')
  }
  const removeValue = (val: string) => onChange({ values: attr.values.filter(x => x !== val) })

  if (!editing) {
    return (
      <div className="rounded-xl border border-black/[0.08] px-4 py-3.5 flex items-center justify-between gap-3 hover:border-black/[0.16] transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <svg className="w-4 h-4 text-muted-foreground/40 shrink-0" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" /><circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" /><circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" /></svg>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-foreground">{attr.name || 'Untitled option'}</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {attr.values.map(v => <span key={v} className="text-[11px] font-semibold bg-[#F0F2F5] text-foreground px-2 py-0.5 rounded-md">{v}</span>)}
            </div>
          </div>
        </div>
        <button type="button" onClick={() => setEditing(true)}
          className="text-[12px] font-bold text-primary hover:text-primary-hover transition-colors shrink-0">Edit</button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-black/[0.1] p-4 bg-[#FAFBFC]">
      {/* Option name */}
      <label className="text-[12px] font-bold text-foreground">Option name</label>
      <input type="text" value={attr.name} onChange={e => onChange({ name: e.target.value })} placeholder="e.g. Size, Color, Position"
        className="w-full mt-1.5 bg-card text-foreground rounded-xl px-4 py-2.5 text-[13px] font-medium border border-black/[0.1] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all" />
      <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
        Linked to attribute
      </span>

      {/* Option values */}
      <label className="block text-[12px] font-bold text-foreground mt-4">Option values</label>
      <div className="flex flex-col gap-2 mt-1.5">
        {attr.values.map(val => (
          <div key={val} className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg border border-dashed border-black/[0.16] flex items-center justify-center text-muted-foreground/40 shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
            </span>
            <input type="text" value={val} onChange={e => { const nv = e.target.value; onChange({ values: attr.values.map(x => x === val ? nv : x) }) }}
              className="flex-1 bg-[#F4F5F7] text-foreground rounded-lg px-3 py-2.5 text-[13px] font-medium border border-transparent focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" />
            <button type="button" onClick={() => removeValue(val)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
            </button>
          </div>
        ))}
        <input type="text" value={newVal} onChange={e => setNewVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addValue(newVal) } }}
          onBlur={() => { if (newVal.trim()) addValue(newVal) }}
          placeholder="Add another value"
          className="w-full bg-transparent text-foreground rounded-lg px-3 py-2.5 text-[13px] font-medium border border-dashed border-black/[0.16] focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/60" />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/[0.06]">
        <button type="button" onClick={onRemove} className="text-[13px] font-bold text-red-500 hover:text-red-600 transition-colors">Delete</button>
        <button type="button" onClick={() => setEditing(false)}
          className="rounded-lg px-5 py-2 text-[13px] font-semibold bg-foreground text-white hover:opacity-90 transition-opacity">Done</button>
      </div>
    </div>
  )
}
