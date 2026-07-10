import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createOrder, getOrder, nextOrderNumber, updateOrder, type OrderProduct, type OrderStatus } from '../../data/ordersStore'
import { useProducts } from '../../data/productsStore'

type Tab = 'info' | 'changelog'

function fmtPrice(n: number) {
  return n.toLocaleString('ru-RU').replace(/,/g, ' ')
}

function ProductInitials({ name, image, size = 36 }: { name: string; image: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['bg-blue-100 text-blue-600', 'bg-violet-100 text-violet-600', 'bg-amber-100 text-amber-600', 'bg-emerald-100 text-emerald-600', 'bg-rose-100 text-rose-600']
  const color = colors[name.charCodeAt(0) % colors.length]
  if (image) return <img src={image} alt={name} style={{ width: size, height: size }} className="rounded-lg object-cover shrink-0" />
  return <div style={{ width: size, height: size }} className={`rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold ${color}`}>{initials}</div>
}

function ChangeLog({ isEdit }: { isEdit: boolean }) {
  const entries = isEdit
    ? [
        { label: 'Order created', time: 'Jan 15, 2026 · 09:12', user: 'Admin' },
        { label: 'Status changed from Pending to Processing', time: 'Jan 15, 2026 · 10:45', user: 'Admin' },
        { label: 'Product added: Brake Pads Set', time: 'Jan 15, 2026 · 14:30', user: 'Admin' },
      ]
    : []

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
      <div className="relative flex flex-col gap-5">
        <div className="absolute left-[13px] top-7 bottom-7 w-px bg-black/[0.06]" />
        {entries.map((entry) => (
          <div key={entry.time} className="flex gap-4 relative">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-semibold text-foreground">{entry.label}</p>
                <div className="text-right shrink-0">
                  <p className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">{entry.time}</p>
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

export default function OrderFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const editId = id ? Number(id) : null
  const existing = editId ? getOrder(editId) : undefined
  const productRows = useProducts()
  const [tab, setTab] = useState<Tab>('info')
  const [buyerName, setBuyerName] = useState(existing?.buyerName ?? '')
  const [buyerPhone, setBuyerPhone] = useState(existing?.buyerPhone ?? '')
  const [date, setDate] = useState(existing?.date ?? new Date().toISOString().slice(0, 10))
  const [orderNum, setOrderNum] = useState(existing?.orderNumber ?? nextOrderNumber())
  const [status, setStatus] = useState<OrderStatus>(existing?.status ?? 'pending')
  const [products, setProducts] = useState<OrderProduct[]>(existing?.products ?? [])
  const [mechBonus, setMechBonus] = useState(String(existing?.mechanicBonus ?? 0))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const availableProducts = useMemo(() => productRows.map(product => ({
    productId: product.id,
    name: product.name,
    sku: product.sku,
    image: product.image,
    price: product.price,
  })), [productRows])

  const addProduct = (productId: string) => {
    const product = availableProducts.find(item => item.productId === Number(productId))
    if (!product || products.some(item => item.productId === product.productId)) return
    setProducts(prev => [...prev, product])
    setErrors(prev => ({ ...prev, products: '' }))
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!buyerName.trim()) nextErrors.buyerName = 'Required'
    if (!buyerPhone.trim()) nextErrors.buyerPhone = 'Required'
    if (products.length === 0) nextErrors.products = 'Add at least one product'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    const input = {
      orderNumber: orderNum,
      buyerName,
      buyerPhone,
      shop: existing?.shop ?? 'AutoZone Tashkent',
      date,
      status,
      products,
      mechanicBonus: Number(mechBonus) || 0,
    }
    if (editId && existing) updateOrder(editId, input)
    else createOrder(input)
    navigate('/admin-design/orders')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-4 border-b border-black/[0.06] bg-card shrink-0">
        <div className="flex items-center gap-4 pb-3">
          <button onClick={() => navigate('/admin-design/orders')}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground border border-black/[0.08] hover:bg-[#F4F5F7] hover:text-foreground transition-all shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
            <button onClick={() => navigate('/admin-design/orders')} className="hover:text-foreground transition-colors">Orders</button>
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            <span className="text-foreground font-semibold">{editId ? orderNum || 'Edit Order' : 'New Order'}</span>
          </div>
        </div>
        <div className="flex gap-1">
          {([{ key: 'info', label: 'Order Info' }, { key: 'changelog', label: 'Change Log' }] as { key: Tab; label: string }[]).map(item => (
            <button key={item.key} onClick={() => setTab(item.key)}
              className={['px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-all', tab === item.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'].join(' ')}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'changelog' ? (
        <div className="flex-1 overflow-auto bg-background">
          <ChangeLog isEdit={Boolean(editId)} />
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="flex-1 overflow-auto">
            <div className="max-w-5xl mx-auto px-6 py-6">
              <div className="grid grid-cols-[1fr_340px] gap-5 items-start">
                <div className="flex flex-col gap-5">
                  <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between">
                      <div>
                        <p className="text-[14px] font-bold text-foreground">Products</p>
                        <p className="text-[12px] font-medium text-muted-foreground">{products.length === 0 ? 'Add scanned items for this order' : `${products.length} item${products.length !== 1 ? 's' : ''} in this order`}</p>
                      </div>
                      {products.length > 0 && <span className="text-[12px] font-bold text-primary bg-primary/[0.08] px-2.5 py-1 rounded-lg">{products.length} item{products.length !== 1 ? 's' : ''}</span>}
                    </div>
                    <div className="p-6 flex flex-col gap-4">
                      <select onChange={(event) => addProduct(event.target.value)} value=""
                        className="w-full h-10 px-4 bg-[#F4F5F7] rounded-xl text-[13px] font-medium text-foreground border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
                        <option value="">Search by name or SKU...</option>
                        {availableProducts.filter(product => !products.some(item => item.productId === product.productId)).map(product => (
                          <option key={product.productId} value={product.productId}>{product.name} - {product.sku}</option>
                        ))}
                      </select>
                      {errors.products && <p className="text-[11px] font-medium text-red-500 -mt-1">{errors.products}</p>}
                      {products.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {products.map((product, index) => (
                            <div key={product.productId} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-black/[0.06] bg-[#F8F9FB] group">
                              <span className="text-[11px] font-bold text-muted-foreground/50 w-5 shrink-0 text-center">{index + 1}</span>
                              <ProductInitials name={product.name} image={product.image} size={36} />
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-foreground truncate">{product.name}</p>
                                <p className="text-[11px] font-medium text-muted-foreground font-mono">{product.sku}</p>
                              </div>
                              <button type="button" onClick={() => setProducts(prev => prev.filter(item => item.productId !== product.productId))}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all shrink-0 opacity-0 group-hover:opacity-100">
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-black/[0.08] rounded-2xl py-10 flex flex-col items-center gap-2 text-center">
                          <p className="text-[13px] font-semibold text-muted-foreground">No products added yet</p>
                          <p className="text-[12px] font-medium text-muted-foreground/60">Search above to add products</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div className="px-6 py-4 border-b border-black/[0.06]">
                      <p className="text-[14px] font-bold text-foreground">Mechanic Bonus</p>
                      <p className="text-[12px] font-medium text-muted-foreground">Bonus applied to this order</p>
                    </div>
                    <div className="p-6">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Amount</label>
                      <div className="relative mt-1.5">
                        <input type="number" min={0} value={mechBonus} onChange={event => setMechBonus(event.target.value)}
                          className="w-full bg-[#F4F5F7] text-foreground rounded-xl pl-4 pr-14 py-3 text-[13px] font-medium border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground">UZS</span>
                      </div>
                      {Number(mechBonus) > 0 && <p className="text-[11px] font-semibold text-emerald-600 mt-1.5">+{fmtPrice(Number(mechBonus))} UZS bonus</p>}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div className="px-6 py-4 border-b border-black/[0.06]">
                      <p className="text-[14px] font-bold text-foreground">Customer</p>
                      <p className="text-[12px] font-medium text-muted-foreground">Who is buying</p>
                    </div>
                    <div className="p-6 flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Buyer Name <span className="text-red-400">*</span></label>
                        <input value={buyerName} onChange={event => { setBuyerName(event.target.value); setErrors(prev => ({ ...prev, buyerName: '' })) }}
                          placeholder="e.g. Alisher Nazarov"
                          className={['w-full bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[13px] font-medium border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all', errors.buyerName ? 'border-red-400' : 'border-transparent'].join(' ')} />
                        {errors.buyerName && <p className="text-[11px] font-medium text-red-500">{errors.buyerName}</p>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Buyer Phone <span className="text-red-400">*</span></label>
                        <input value={buyerPhone} onChange={event => { setBuyerPhone(event.target.value); setErrors(prev => ({ ...prev, buyerPhone: '' })) }}
                          placeholder="+998 90 000 00 00"
                          className={['w-full bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[13px] font-medium border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all', errors.buyerPhone ? 'border-red-400' : 'border-transparent'].join(' ')} />
                        {errors.buyerPhone && <p className="text-[11px] font-medium text-red-500">{errors.buyerPhone}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div className="px-6 py-4 border-b border-black/[0.06]">
                      <p className="text-[14px] font-bold text-foreground">Order Details</p>
                      <p className="text-[12px] font-medium text-muted-foreground">Reference and date</p>
                    </div>
                    <div className="p-6 flex flex-col gap-3">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Order Number</label>
                      <input value={orderNum} onChange={event => setOrderNum(event.target.value)}
                        className="w-full bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[13px] font-mono font-semibold border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date</label>
                      <input type="date" value={date} onChange={event => setDate(event.target.value)}
                        className="w-full bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[13px] font-medium border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
                      <select value={status} onChange={event => setStatus(event.target.value as OrderStatus)}
                        className="w-full bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[13px] font-medium border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>

          <div className="shrink-0 border-t border-black/[0.06] bg-card px-6 py-4 flex items-center justify-between gap-4" style={{ boxShadow: '0 -2px 8px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
              {products.length > 0 && <span className="font-semibold text-foreground">{products.length} product{products.length !== 1 ? 's' : ''}</span>}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => navigate('/admin-design/orders')}
                className="px-5 py-2.5 rounded-xl text-[13px] font-semibold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl text-[13px] font-semibold bg-primary text-white hover:bg-primary-hover active:scale-[0.98] transition-all"
                style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                {editId ? 'Save Changes' : 'Create Order'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
