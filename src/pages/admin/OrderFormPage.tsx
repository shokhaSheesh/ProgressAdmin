import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getOrder, createOrder, updateOrder, nextOrderNumber,
} from '../../data/ordersStore'
import type { OrderProduct, OrderInput } from '../../data/ordersStore'
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

function ProductPicker({ onPick }: { onPick: (p: Product) => void }) {
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
    !query.trim() || p.name.toLowerCase().includes(query.trim().toLowerCase()) || p.sku.toLowerCase().includes(query.trim().toLowerCase())
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
          placeholder="Search by name or SKU…"
          className="w-full h-10 pl-9 pr-4 bg-[#F4F5F7] rounded-xl text-[13px] font-medium text-foreground border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>
      {open && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-30 max-h-[240px] overflow-y-auto" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {available.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] font-medium text-muted-foreground">No products match</p>
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

// ─── Form ──────────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10)
export default function OrderFormPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit   = Boolean(id)
  const existing = id ? getOrder(Number(id)) : undefined

  const [buyerName,  setBuyerName]  = useState(existing?.buyerName  ?? '')
  const [buyerPhone, setBuyerPhone] = useState(existing?.buyerPhone ?? '')
  const [date,       setDate]       = useState(existing?.date       ?? TODAY)
  const [orderNum,   setOrderNum]   = useState(existing?.orderNumber ?? nextOrderNumber())
  const [product,    setProduct]    = useState<OrderProduct | null>(existing?.product ?? null)
  const [mechBonus,  setMechBonus]  = useState(String(existing?.mechanicBonus ?? 0))
  const [errors,     setErrors]     = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!buyerName.trim()) e.buyerName  = 'Required'
    if (!buyerPhone.trim()) e.buyerPhone = 'Required'
    if (!product)           e.product    = 'Scan or select a product'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !product) return
    const input: OrderInput = {
      orderNumber: orderNum, buyerName, buyerPhone,
      shop: existing?.shop ?? '', date,
      status: existing?.status ?? 'pending', product,
      mechanicBonus: Number(mechBonus) || 0,
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
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="grid grid-cols-[1fr_340px] gap-5 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col gap-5">

          {/* Scanned Product */}
          <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div className="px-6 py-4 border-b border-black/[0.06]">
              <p className="text-[14px] font-bold text-foreground">Product</p>
              <p className="text-[12px] font-medium text-muted-foreground">Scanned item for this order</p>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <ProductPicker onPick={(p) => {
                setProduct({ productId: p.id, name: p.name, sku: p.sku, image: p.image, price: p.price })
                setErrors(prev => ({ ...prev, product: '' }))
              }} />
              {errors.product && <p className="text-[11px] font-medium text-red-500">{errors.product}</p>}

              {product ? (
                <div className="rounded-xl border-2 border-primary/20 bg-primary/[0.02] overflow-hidden">
                  <div className="flex items-center gap-4 px-5 py-5">
                    <ProductInitials name={product.name} image={product.image} size={64} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-foreground truncate">{product.name}</p>
                      <p className="text-[12px] font-medium text-muted-foreground font-mono mt-0.5">{product.sku}</p>
                    </div>
                    <button type="button" onClick={() => setProduct(null)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-black/[0.08] rounded-2xl py-10 flex flex-col items-center gap-2 text-center">
                  <svg className="w-8 h-8 text-muted-foreground/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <p className="text-[13px] font-semibold text-muted-foreground">No product scanned yet</p>
                  <p className="text-[12px] font-medium text-muted-foreground/60">Search above to select a product</p>
                </div>
              )}
            </div>
          </div>

          {/* Mechanic Bonus */}
          <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div className="px-6 py-4 border-b border-black/[0.06]">
              <p className="text-[14px] font-bold text-foreground">Mechanic Bonus</p>
              <p className="text-[12px] font-medium text-muted-foreground">Bonus applied to this order</p>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                  </span>
                  <input type="number" min={0} value={mechBonus} onChange={e => setMechBonus(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#F4F5F7] text-foreground rounded-xl pl-10 pr-14 py-3 text-[13px] font-medium border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground">UZS</span>
                </div>
                {Number(mechBonus) > 0 && (
                  <p className="text-[11px] font-semibold text-emerald-600">+{fmtPrice(Number(mechBonus))} UZS bonus</p>
                )}
              </div>
            </div>
          </div>

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

          {/* Order Details */}
          <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div className="px-6 py-4 border-b border-black/[0.06]">
              <p className="text-[14px] font-bold text-foreground">Order Details</p>
              <p className="text-[12px] font-medium text-muted-foreground">Reference and date</p>
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
            </div>
          </div>

          </div>{/* end right column */}
          </div>{/* end grid */}
        </div>
      </form>

      {/* Sticky footer */}
      <div className="shrink-0 border-t border-black/[0.06] bg-card px-6 py-4 flex items-center justify-between gap-4" style={{ boxShadow: '0 -2px 8px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
          {product && (
            <>
              <span className="font-semibold text-foreground">{product.name}</span>
              {Number(mechBonus) > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                  <span className="text-emerald-600 font-semibold">+{fmtPrice(Number(mechBonus))} UZS bonus</span>
                </>
              )}
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
