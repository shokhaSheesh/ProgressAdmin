import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getOrder, createOrder, updateOrder, nextOrderNumber, statusMeta,
  ORDER_SHOPS, ORDER_SELLERS, orderSubtotal,
} from '../../data/ordersStore'
import type { OrderStatus, OrderLine, OrderInput } from '../../data/ordersStore'
import { useProducts } from '../../data/productsStore'
import type { Product } from '../../data/productsStore'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtPrice(n: number) {
  return n.toLocaleString('ru-RU').replace(/,/g, ' ')
}

function ProductInitials({ name, image, size = 36 }: { name: string; image: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['bg-blue-100 text-blue-600', 'bg-violet-100 text-violet-600', 'bg-amber-100 text-amber-600', 'bg-emerald-100 text-emerald-600', 'bg-rose-100 text-rose-600']
  const color = colors[name.charCodeAt(0) % colors.length]
  if (image) return <img src={image} alt={name} style={{ width: size, height: size }} className="rounded-lg object-cover shrink-0" />
  return (
    <div style={{ width: size, height: size }} className={`rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold ${color}`}>{initials}</div>
  )
}

// ─── Product picker ────────────────────────────────────────────────────────────

function ProductPicker({ excludeIds, onPick }: { excludeIds: number[]; onPick: (p: Product) => void }) {
  const products = useProducts()
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const available = products.filter(p =>
    !excludeIds.includes(p.id) &&
    (!query.trim() || p.name.toLowerCase().includes(query.trim().toLowerCase()) || p.sku.toLowerCase().includes(query.trim().toLowerCase()))
  )

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text" value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search products to add…"
          className="w-full h-10 pl-9 pr-4 bg-[#F4F5F7] rounded-xl text-[13px] font-medium text-foreground border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>
      {open && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-30 max-h-[240px] overflow-y-auto" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {available.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] font-medium text-muted-foreground">
              {products.filter(p => !excludeIds.includes(p.id)).length === 0 ? 'All products already added' : 'No products match'}
            </p>
          ) : available.map(p => (
            <button key={p.id} onClick={() => { onPick(p); setQuery(''); setOpen(false) }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F4F5F7] transition-colors text-left border-b border-black/[0.04] last:border-0">
              <ProductInitials name={p.name} image={p.image} size={32} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">{p.name}</p>
                <p className="text-[11px] font-medium text-muted-foreground">{p.sku}</p>
              </div>
              <span className="text-[12px] font-semibold text-foreground shrink-0">{fmtPrice(p.price)} UZS</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Select dropdown ───────────────────────────────────────────────────────────

function SelectDropdown({ value, options, placeholder, onChange }: {
  value: string; options: string[]; placeholder: string; onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={['w-full flex items-center justify-between h-11 px-4 rounded-xl text-[13px] font-medium border transition-all',
          value ? 'bg-[#F4F5F7] text-foreground border-transparent focus:border-primary' : 'bg-[#F4F5F7] text-muted-foreground border-transparent',
          open ? 'border-primary ring-2 ring-primary/20' : 'hover:border-black/10'].join(' ')}>
        <span>{value || placeholder}</span>
        <svg className={['w-4 h-4 text-muted-foreground transition-transform shrink-0', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-20 max-h-[220px] overflow-y-auto" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {options.map(opt => (
            <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false) }}
              className={['w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-medium transition-colors text-left',
                opt === value ? 'bg-primary/[0.08] text-primary font-semibold' : 'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>
              {opt}
              {opt === value && <svg className="w-3.5 h-3.5 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Form ──────────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10)

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'processing', 'completed', 'cancelled']

export default function OrderFormPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit   = Boolean(id)
  const existing = id ? getOrder(Number(id)) : undefined

  const [buyerName,  setBuyerName]  = useState(existing?.buyerName  ?? '')
  const [buyerPhone, setBuyerPhone] = useState(existing?.buyerPhone ?? '')
  const [shop,       setShop]       = useState(existing?.shop       ?? '')
  const [sellerName, setSellerName] = useState(existing?.sellerName ?? '')
  const [date,       setDate]       = useState(existing?.date       ?? TODAY)
  const [status,     setStatus]     = useState<OrderStatus>(existing?.status ?? 'pending')
  const [orderNum,   setOrderNum]   = useState(existing?.orderNumber ?? nextOrderNumber())
  const [lines,      setLines]      = useState<OrderLine[]>(existing?.lines ?? [])
  const [discount,   setDiscount]   = useState(String(existing?.discount      ?? 0))
  const [mechBonus,  setMechBonus]  = useState(String(existing?.mechanicBonus ?? 0))
  const [sellBonus,  setSellBonus]  = useState(String(existing?.sellerBonus  ?? 0))
  const [errors,     setErrors]     = useState<Record<string, string>>({})

  const addProduct = (p: Product) => {
    setLines(prev => [...prev, {
      productId: p.id, name: p.name, sku: p.sku, image: p.image,
      quantity: 1, price: p.price,
    }])
  }

  const updateQty = (idx: number, delta: number) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, quantity: Math.max(1, l.quantity + delta) } : l))
  }

  const updateQtyInput = (idx: number, val: string) => {
    const n = parseInt(val, 10)
    if (!isNaN(n) && n >= 1) setLines(prev => prev.map((l, i) => i === idx ? { ...l, quantity: n } : l))
  }

  const updatePrice = (idx: number, val: string) => {
    const n = parseInt(val.replace(/\D/g, ''), 10)
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, price: isNaN(n) ? 0 : n } : l))
  }

  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx))

  const subtotal     = lines.reduce((s, l) => s + l.price * l.quantity, 0)
  const discountAmt  = Math.min(Number(discount) || 0, subtotal)
  const runningTotal = Math.max(0, subtotal - discountAmt)
  const totalItems   = lines.reduce((s, l) => s + l.quantity, 0)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!buyerName.trim()) e.buyerName  = 'Required'
    if (!buyerPhone.trim()) e.buyerPhone = 'Required'
    if (!shop)              e.shop       = 'Required'
    if (!sellerName)        e.sellerName = 'Required'
    if (lines.length === 0) e.lines      = 'Add at least one product'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const input: OrderInput = {
      orderNumber: orderNum, buyerName, buyerPhone, shop, sellerName, date,
      status, lines,
      discount:      Number(discount)  || 0,
      mechanicBonus: Number(mechBonus) || 0,
      sellerBonus:   Number(sellBonus) || 0,
    }
    if (isEdit && id) {
      updateOrder(Number(id), input)
    } else {
      createOrder(input)
    }
    navigate('/admin/orders')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-black/[0.06] bg-card shrink-0">
        <button onClick={() => navigate('/admin/orders')}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground border border-black/[0.08] hover:bg-[#F4F5F7] hover:text-foreground transition-all shrink-0">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
          <button onClick={() => navigate('/admin/orders')} className="hover:text-foreground transition-colors">Orders</button>
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          <span className="text-foreground font-semibold">{isEdit ? existing?.orderNumber ?? 'Edit Order' : 'New Order'}</span>
        </div>
      </div>

      {/* Scrollable body */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="grid grid-cols-[1fr_360px] gap-5 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col gap-5">

          {/* Products */}
          <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between">
              <div>
                <p className="text-[14px] font-bold text-foreground">Products</p>
                <p className="text-[12px] font-medium text-muted-foreground">Items in this order</p>
              </div>
              {lines.length > 0 && (
                <span className="text-[12px] font-semibold text-muted-foreground bg-[#F4F5F7] px-3 py-1 rounded-lg">
                  {lines.reduce((s, l) => s + l.quantity, 0)} items · {lines.length} product{lines.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="p-6 flex flex-col gap-4">
              <ProductPicker excludeIds={lines.map(l => l.productId)} onPick={addProduct} />
              {errors.lines && <p className="text-[11px] font-medium text-red-500">{errors.lines}</p>}

              {lines.length === 0 ? (
                <div className="border-2 border-dashed border-black/[0.08] rounded-2xl py-10 flex flex-col items-center gap-2 text-center">
                  <svg className="w-8 h-8 text-muted-foreground/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <p className="text-[13px] font-semibold text-muted-foreground">No products added yet</p>
                  <p className="text-[12px] font-medium text-muted-foreground/60">Search above to add products</p>
                </div>
              ) : (
                <div className="rounded-xl border border-black/[0.08] overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-black/[0.05] bg-[#F4F5F7]/60">
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                        <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-32">Qty</th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-40">Price (UZS)</th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-36">Total</th>
                        <th className="px-4 py-2.5 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line, i) => (
                        <tr key={line.productId} className="border-b border-black/[0.04] last:border-0">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <ProductInitials name={line.name} image={line.image} size={32} />
                              <div>
                                <p className="text-[13px] font-semibold text-foreground">{line.name}</p>
                                <p className="text-[11px] font-medium text-muted-foreground">{line.sku}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button type="button" onClick={() => updateQty(i, -1)}
                                className="w-6 h-6 rounded-lg bg-[#F4F5F7] hover:bg-black/10 flex items-center justify-center text-muted-foreground transition-colors">
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                              </button>
                              <input type="number" value={line.quantity} min={1}
                                onChange={e => updateQtyInput(i, e.target.value)}
                                className="w-10 text-center text-[13px] font-semibold text-foreground bg-transparent focus:outline-none" />
                              <button type="button" onClick={() => updateQty(i, 1)}
                                className="w-6 h-6 rounded-lg bg-[#F4F5F7] hover:bg-black/10 flex items-center justify-center text-muted-foreground transition-colors">
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input type="text" value={fmtPrice(line.price)}
                              onChange={e => updatePrice(i, e.target.value)}
                              className="w-full text-right text-[13px] font-semibold text-foreground bg-[#F4F5F7] rounded-lg px-3 py-1.5 border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                          </td>
                          <td className="px-4 py-3 text-right text-[13px] font-bold text-foreground whitespace-nowrap">
                            {fmtPrice(line.price * line.quantity)} <span className="text-[11px] font-medium text-muted-foreground">UZS</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button type="button" onClick={() => removeLine(i)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all">
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Summary — below products */}
          {lines.length > 0 && (
            <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div className="px-6 py-4 border-b border-black/[0.06]">
                <p className="text-[14px] font-bold text-foreground">Summary</p>
                <p className="text-[12px] font-medium text-muted-foreground">Order totals at a glance</p>
              </div>
              <div className="p-6 flex flex-col gap-0">
                <div className="flex items-center justify-between py-3 border-b border-black/[0.05]">
                  <span className="text-[13px] font-medium text-muted-foreground">Products</span>
                  <span className="text-[13px] font-semibold text-foreground">
                    {lines.length} product{lines.length !== 1 ? 's' : ''}, {totalItems} item{totalItems !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-black/[0.05]">
                  <span className="text-[13px] font-medium text-muted-foreground">Subtotal</span>
                  <span className="text-[13px] font-semibold text-foreground">{fmtPrice(subtotal)} UZS</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-black/[0.05]">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-muted-foreground">Discount</span>
                    {discountAmt > 0 && subtotal > 0 && (
                      <span className="text-[11px] font-semibold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg">
                        {Math.round(discountAmt / subtotal * 100)}% off
                      </span>
                    )}
                  </div>
                  <span className={discountAmt > 0 ? 'text-[13px] font-semibold text-amber-600' : 'text-[13px] font-medium text-muted-foreground/50'}>
                    {discountAmt > 0 ? `−${fmtPrice(discountAmt)} UZS` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-4 border-b border-black/[0.08]">
                  <span className="text-[14px] font-bold text-foreground">Total</span>
                  <span className="text-[18px] font-extrabold text-foreground">{fmtPrice(runningTotal)} <span className="text-[13px] font-medium text-muted-foreground">UZS</span></span>
                </div>
                {isEdit && (Number(mechBonus) > 0 || Number(sellBonus) > 0) && (
                  <div className="pt-3 flex flex-col gap-2.5">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Bonuses Received</p>
                    {Number(mechBonus) > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                            <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                          </span>
                          <span className="text-[13px] font-medium text-foreground">Mechanic Bonus</span>
                        </div>
                        <span className="text-[13px] font-bold text-emerald-600">+{fmtPrice(Number(mechBonus))} UZS</span>
                      </div>
                    )}
                    {Number(sellBonus) > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                            <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="2" /></svg>
                          </span>
                          <span className="text-[13px] font-medium text-foreground">Seller Bonus</span>
                        </div>
                        <span className="text-[13px] font-bold text-emerald-600">+{fmtPrice(Number(sellBonus))} UZS</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          </div>{/* end left column */}

          {/* ── RIGHT COLUMN ── */}
          <div className="flex flex-col gap-5">

          {/* Customer */}
          <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div className="px-6 py-4 border-b border-black/[0.06]">
              <p className="text-[14px] font-bold text-foreground">Customer</p>
              <p className="text-[12px] font-medium text-muted-foreground">Who is buying</p>
            </div>
            <div className="p-6 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Buyer Name <span className="text-red-400">*</span></label>
                <input type="text" value={buyerName} onChange={e => { setBuyerName(e.target.value); setErrors(p => ({ ...p, buyerName: '' })) }}
                  placeholder="e.g. Alisher Nazarov"
                  className={['w-full bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[13px] font-medium border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all',
                    errors.buyerName ? 'border-red-400' : 'border-transparent'].join(' ')} />
                {errors.buyerName && <p className="text-[11px] font-medium text-red-500">{errors.buyerName}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Buyer Phone <span className="text-red-400">*</span></label>
                <input type="text" value={buyerPhone} onChange={e => { setBuyerPhone(e.target.value); setErrors(p => ({ ...p, buyerPhone: '' })) }}
                  placeholder="+998 90 000 00 00"
                  className={['w-full bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[13px] font-medium border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all',
                    errors.buyerPhone ? 'border-red-400' : 'border-transparent'].join(' ')} />
                {errors.buyerPhone && <p className="text-[11px] font-medium text-red-500">{errors.buyerPhone}</p>}
              </div>
            </div>
          </div>

          {/* Shop & Seller */}
          <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div className="px-6 py-4 border-b border-black/[0.06]">
              <p className="text-[14px] font-bold text-foreground">Shop & Seller</p>
              <p className="text-[12px] font-medium text-muted-foreground">Where and who sold</p>
            </div>
            <div className="p-6 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Shop <span className="text-red-400">*</span></label>
                <SelectDropdown value={shop} options={ORDER_SHOPS} placeholder="Select shop" onChange={v => { setShop(v); setErrors(p => ({ ...p, shop: '' })) }} />
                {errors.shop && <p className="text-[11px] font-medium text-red-500">{errors.shop}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Seller <span className="text-red-400">*</span></label>
                <SelectDropdown value={sellerName} options={ORDER_SELLERS} placeholder="Select seller" onChange={v => { setSellerName(v); setErrors(p => ({ ...p, sellerName: '' })) }} />
                {errors.sellerName && <p className="text-[11px] font-medium text-red-500">{errors.sellerName}</p>}
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div className="px-6 py-4 border-b border-black/[0.06]">
              <p className="text-[14px] font-bold text-foreground">Order Details</p>
              <p className="text-[12px] font-medium text-muted-foreground">Reference, date and status</p>
            </div>
            <div className="p-6 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Order Number</label>
                <input type="text" value={orderNum} onChange={e => setOrderNum(e.target.value)}
                  className="w-full bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[13px] font-mono font-semibold border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[13px] font-medium border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Discount</label>
                <div className="relative">
                  <input type="number" min={0} value={discount} onChange={e => setDiscount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#F4F5F7] text-foreground rounded-xl pl-4 pr-14 py-3 text-[13px] font-medium border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground">UZS</span>
                </div>
                {discountAmt > 0 && subtotal > 0 && (
                  <p className="text-[11px] font-semibold text-amber-600">
                    -{fmtPrice(discountAmt)} UZS ({Math.round(discountAmt / subtotal * 100)}% off)
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map(s => {
                    const sm = statusMeta[s]
                    const active = status === s
                    return (
                      <button key={s} type="button" onClick={() => setStatus(s)}
                        className={['flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold border-2 transition-all',
                          active ? `${sm.bg} border-current ${sm.text}` : 'bg-[#F4F5F7] border-transparent text-muted-foreground hover:border-black/10'].join(' ')}>
                        <span className={['w-2 h-2 rounded-full shrink-0', active ? sm.dot : 'bg-muted-foreground/30'].join(' ')} />
                        {sm.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          </div>{/* end right column */}
          </div>{/* end grid */}
        </div>
      </form>

      {/* Sticky footer */}
      <div className="shrink-0 border-t border-black/[0.06] bg-card px-6 py-4 flex items-center justify-between gap-4" style={{ boxShadow: '0 -2px 8px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
          {lines.length > 0 && (
            <>
              <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
              {discountAmt > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                  <span className="line-through text-muted-foreground/50">{fmtPrice(subtotal)}</span>
                </>
              )}
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
              <span className="font-bold text-foreground">{fmtPrice(runningTotal)} UZS</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/admin/orders')}
            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl text-[13px] font-semibold bg-primary text-white hover:bg-primary-hover active:scale-[0.98] transition-all"
            style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
            {isEdit ? 'Save Changes' : 'Create Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
