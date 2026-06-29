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

// ─── Changelog ────────────────────────────────────────────────────────────────

interface ChangeEntry {
  id: number
  timestamp: string
  user: string
  type: 'created' | 'status' | 'product_added' | 'product_removed' | 'field'
  label: string
  from?: string
  to?: string
}

const MOCK_CHANGELOGS: Record<number, ChangeEntry[]> = {
  1: [
    { id: 1, timestamp: 'Jan 15, 2026 · 09:12', user: 'Admin',         type: 'created',         label: 'Order created' },
    { id: 2, timestamp: 'Jan 15, 2026 · 10:45', user: 'Admin',         type: 'status',          label: 'Status changed', from: 'Pending', to: 'Processing' },
    { id: 3, timestamp: 'Jan 15, 2026 · 14:30', user: 'Admin',         type: 'product_added',   label: 'Product added: Brake Pads Set' },
    { id: 4, timestamp: 'Jan 16, 2026 · 08:05', user: 'Shokhruz S.',   type: 'status',          label: 'Status changed', from: 'Processing', to: 'Completed' },
  ],
  2: [
    { id: 1, timestamp: 'Jan 22, 2026 · 11:00', user: 'Admin',         type: 'created',         label: 'Order created' },
    { id: 2, timestamp: 'Jan 23, 2026 · 09:30', user: 'Shokhruz S.',   type: 'status',          label: 'Status changed', from: 'Pending', to: 'Completed' },
  ],
  3: [
    { id: 1, timestamp: 'Feb 3, 2026 · 13:20',  user: 'Admin',         type: 'created',         label: 'Order created' },
    { id: 2, timestamp: 'Feb 4, 2026 · 10:15',  user: 'Admin',         type: 'product_added',   label: 'Product added: Timing Belt Kit' },
    { id: 3, timestamp: 'Feb 4, 2026 · 10:16',  user: 'Admin',         type: 'product_added',   label: 'Product added: Wheel Bearing Kit' },
    { id: 4, timestamp: 'Feb 4, 2026 · 11:00',  user: 'Shokhruz S.',   type: 'status',          label: 'Status changed', from: 'Pending', to: 'Processing' },
  ],
  4: [
    { id: 1, timestamp: 'Feb 18, 2026 · 16:40', user: 'Admin',         type: 'created',         label: 'Order created' },
  ],
  5: [
    { id: 1, timestamp: 'Mar 5, 2026 · 08:55',  user: 'Admin',         type: 'created',         label: 'Order created' },
    { id: 2, timestamp: 'Mar 5, 2026 · 09:10',  user: 'Admin',         type: 'product_added',   label: 'Product added: Oxygen Sensor' },
    { id: 3, timestamp: 'Mar 6, 2026 · 14:00',  user: 'Shokhruz S.',   type: 'status',          label: 'Status changed', from: 'Pending', to: 'Cancelled' },
    { id: 4, timestamp: 'Mar 6, 2026 · 14:02',  user: 'Shokhruz S.',   type: 'field',           label: 'Buyer phone updated', from: '+998 95 111 22 33', to: '+998 95 567 89 01' },
  ],
  6: [
    { id: 1, timestamp: 'Mar 12, 2026 · 10:00', user: 'Admin',         type: 'created',         label: 'Order created' },
    { id: 2, timestamp: 'Mar 12, 2026 · 10:05', user: 'Admin',         type: 'product_added',   label: 'Product added: Spark Plug Iridium' },
    { id: 3, timestamp: 'Mar 13, 2026 · 09:00', user: 'Shokhruz S.',   type: 'status',          label: 'Status changed', from: 'Pending', to: 'Processing' },
    { id: 4, timestamp: 'Mar 14, 2026 · 11:30', user: 'Shokhruz S.',   type: 'status',          label: 'Status changed', from: 'Processing', to: 'Completed' },
  ],
}

function changeIcon(type: ChangeEntry['type']) {
  switch (type) {
    case 'created':
      return (
        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
      )
    case 'status':
      return (
        <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10z" /><path d="M12 6v6l4 2" />
          </svg>
        </div>
      )
    case 'product_added':
      return (
        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" />
          </svg>
        </div>
      )
    case 'product_removed':
      return (
        <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="9" y1="14" x2="15" y2="14" />
          </svg>
        </div>
      )
    default:
      return (
        <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </div>
      )
  }
}

function ChangeLog({ orderId }: { orderId: number | undefined }) {
  const entries = orderId ? (MOCK_CHANGELOGS[orderId] ?? []) : []

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#F4F5F7] flex items-center justify-center">
          <svg className="w-5 h-5 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" />
          </svg>
        </div>
        <p className="text-[14px] font-semibold text-muted-foreground">No changes recorded yet</p>
        <p className="text-[12px] font-medium text-muted-foreground/60">Changes will appear here after the order is created</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      <div className="relative flex flex-col gap-0">
        {/* Vertical line */}
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
                      <svg className="w-3 h-3 text-muted-foreground/50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                      <span className="text-[11px] font-semibold text-foreground bg-[#E8F0FE] text-blue-700 px-2 py-0.5 rounded-md">{entry.to}</span>
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

// ─── Product picker dropdown ────────────────────────────────────────────────────

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
          placeholder="Search by name or SKU…"
          className="w-full h-10 pl-9 pr-4 bg-[#F4F5F7] rounded-xl text-[13px] font-medium text-foreground border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>
      {open && available.length > 0 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-30 max-h-[240px] overflow-y-auto" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {available.map(p => (
            <button key={p.id} onClick={() => { onPick(p); setQuery(''); setOpen(false) }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F4F5F7] transition-colors text-left border-b border-black/[0.04] last:border-0">
              <ProductInitials name={p.name} image={p.image} size={32} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">{p.name}</p>
                <p className="text-[11px] font-medium text-muted-foreground">{p.sku}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Form ──────────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10)
type Tab = 'info' | 'changelog'

export default function OrderFormPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit   = Boolean(id)
  const existing = id ? getOrder(Number(id)) : undefined

  const [tab,        setTab]        = useState<Tab>('info')
  const [buyerName,  setBuyerName]  = useState(existing?.buyerName  ?? '')
  const [buyerPhone, setBuyerPhone] = useState(existing?.buyerPhone ?? '')
  const [date,       setDate]       = useState(existing?.date       ?? TODAY)
  const [orderNum,   setOrderNum]   = useState(existing?.orderNumber ?? nextOrderNumber())
  const [products,   setProducts]   = useState<OrderProduct[]>(existing?.products ?? [])
  const [mechBonus,  setMechBonus]  = useState(String(existing?.mechanicBonus ?? 0))
  const [errors,     setErrors]     = useState<Record<string, string>>({})

  function addProduct(p: Product) {
    setProducts(prev => [...prev, { productId: p.id, name: p.name, sku: p.sku, image: p.image, price: p.price }])
    setErrors(prev => ({ ...prev, products: '' }))
  }

  function removeProduct(productId: number) {
    setProducts(prev => prev.filter(p => p.productId !== productId))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!buyerName.trim())     e.buyerName  = 'Required'
    if (!buyerPhone.trim())    e.buyerPhone = 'Required'
    if (products.length === 0) e.products   = 'Add at least one product'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const input: OrderInput = {
      orderNumber: orderNum, buyerName, buyerPhone,
      shop: existing?.shop ?? '', date,
      status: existing?.status ?? 'pending', products,
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
      <div className="px-6 pt-4 border-b border-black/[0.06] bg-card shrink-0">
        <div className="flex items-center gap-4 pb-3">
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

        {/* Tabs */}
        <div className="flex gap-1">
          {([
            { key: 'info',      label: 'Order Info' },
            { key: 'changelog', label: 'Change Log' },
          ] as { key: Tab; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                'px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-all',
                tab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Change Log */}
      {tab === 'changelog' && (
        <div className="flex-1 overflow-auto bg-background">
          <ChangeLog orderId={existing?.id} />
        </div>
      )}

      {/* Tab: Order Info */}
      {tab === 'info' && (
        <>
          <form onSubmit={handleSubmit} className="flex-1 overflow-auto">
            <div className="max-w-5xl mx-auto px-6 py-6">
              <div className="grid grid-cols-[1fr_340px] gap-5 items-start">

              {/* ── LEFT COLUMN ── */}
              <div className="flex flex-col gap-5">

              {/* Products card */}
              <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-bold text-foreground">Products</p>
                    <p className="text-[12px] font-medium text-muted-foreground">
                      {products.length === 0 ? 'Add scanned items for this order' : `${products.length} item${products.length !== 1 ? 's' : ''} in this order`}
                    </p>
                  </div>
                  {products.length > 0 && (
                    <span className="text-[12px] font-bold text-primary bg-primary/[0.08] px-2.5 py-1 rounded-lg">
                      {products.length} item{products.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="p-6 flex flex-col gap-4">
                  <ProductPicker excludeIds={products.map(p => p.productId)} onPick={addProduct} />
                  {errors.products && <p className="text-[11px] font-medium text-red-500 -mt-1">{errors.products}</p>}

                  {products.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {products.map((p, i) => (
                        <div key={p.productId}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-black/[0.06] bg-[#F8F9FB] group">
                          <span className="text-[11px] font-bold text-muted-foreground/50 w-5 shrink-0 text-center">{i + 1}</span>
                          <ProductInitials name={p.name} image={p.image} size={36} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-foreground truncate">{p.name}</p>
                            <p className="text-[11px] font-medium text-muted-foreground font-mono">{p.sku}</p>
                          </div>
                          <button type="button" onClick={() => removeProduct(p.productId)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all shrink-0 opacity-0 group-hover:opacity-100">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-black/[0.08] rounded-2xl py-10 flex flex-col items-center gap-2 text-center">
                      <svg className="w-8 h-8 text-muted-foreground/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 0 1-8 0" />
                      </svg>
                      <p className="text-[13px] font-semibold text-muted-foreground">No products added yet</p>
                      <p className="text-[12px] font-medium text-muted-foreground/60">Search above to add products</p>
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
              {products.length > 0 && (
                <>
                  <span className="font-semibold text-foreground">{products.length} product{products.length !== 1 ? 's' : ''}</span>
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
        </>
      )}
    </div>
  )
}
