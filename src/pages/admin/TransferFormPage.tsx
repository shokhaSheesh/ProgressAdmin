import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  TRANSFER_ORIGINS, TRANSFER_DESTINATIONS, statusMeta, nextReference,
  getTransfer, createTransfer, updateTransfer,
  type TransferStatus, type TransferLine, type TransferInput,
} from '../../data/transfersStore'
import { useProducts } from '../../data/productsStore'

interface FormData {
  reference: string
  origin: string
  destination: string
  status: TransferStatus
  expectedArrival: string
  note: string
  lines: TransferLine[]
}

const avatarColors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500', 'bg-orange-500', 'bg-indigo-500']
const initials = (name: string) => name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()

const labelCls = 'text-[13px] font-bold text-foreground'
const inputCls = 'w-full bg-card text-foreground rounded-xl px-4 py-3 text-[13px] font-medium border border-black/[0.1] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/60'

// ─── Location dropdown ───────────────────────────────────────────────────────

function LocationDropdown({
  value, options, placeholder, disabledOption, onChange,
}: { value: string; options: string[]; placeholder: string; disabledOption?: string; onChange: (v: string) => void }) {
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
        className={['w-full flex items-center justify-between bg-card rounded-xl px-4 py-3 text-[13px] font-medium border transition-all', open ? 'border-primary ring-2 ring-primary/15' : 'border-black/[0.1]'].join(' ')}>
        <span className={value ? 'text-foreground font-semibold' : 'text-muted-foreground/60'}>{value || placeholder}</span>
        <svg className={['w-4 h-4 text-muted-foreground transition-transform shrink-0', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-30 max-h-[240px] overflow-y-auto" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.14)' }}>
          {options.map(opt => {
            const disabled = opt === disabledOption
            return (
              <button key={opt} type="button" disabled={disabled} onClick={() => { onChange(opt); setOpen(false) }}
                className={['w-full text-left px-4 py-2.5 text-[13px] transition-colors flex items-center justify-between',
                  disabled ? 'opacity-30 cursor-not-allowed' : opt === value ? 'bg-primary/[0.08] text-primary font-semibold' : 'text-foreground hover:bg-[#F4F5F7] font-medium'].join(' ')}>
                {opt}
                {opt === value && <svg className="w-3.5 h-3.5 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Product picker ──────────────────────────────────────────────────────────

function ProductPicker({ excludeIds, onPick }: { excludeIds: number[]; onPick: (id: number) => void }) {
  const products = useProducts()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQ('') } }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const available = products.filter(p => !excludeIds.includes(p.id))
  const filtered = q ? available.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase())) : available

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => { setOpen(o => !o); setQ('') }}
        className="w-full flex items-center gap-2.5 bg-card rounded-xl px-4 py-3 text-[13px] font-medium border border-dashed border-black/[0.16] hover:border-primary/40 text-muted-foreground hover:text-foreground transition-all">
        <svg className="w-4 h-4 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        Search products to add…
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-30" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.14)' }}>
          <div className="p-2 border-b border-black/[0.06]">
            <input autoFocus type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or SKU…"
              className="w-full bg-[#F4F5F7] rounded-lg px-3 py-2 text-[12px] font-medium text-foreground focus:outline-none" />
          </div>
          <div className="overflow-y-auto max-h-[280px]">
            {filtered.length === 0 ? (
              <p className="px-4 py-4 text-[12px] font-medium text-muted-foreground text-center">{available.length === 0 ? 'All products added' : 'No products found'}</p>
            ) : filtered.map((p, i) => (
              <button key={p.id} type="button" onClick={() => { onPick(p.id); setOpen(false); setQ('') }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#F4F5F7] transition-colors text-left">
                {(p.image || p.images?.[0])
                  ? <img src={p.image || p.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                  : <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-[10px] font-bold ${avatarColors[i % avatarColors.length]}`}>{initials(p.name)}</span>}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-foreground truncate">{p.name}</p>
                  <p className="text-[11px] font-mono font-medium text-muted-foreground">{p.sku}</p>
                </div>
                <svg className="w-4 h-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Card ──────────────────────────────────────────────────────────────────────

function Card({ title, desc, children, className = '' }: { title?: string; desc?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-2xl border border-black/[0.06] p-6 ${className}`} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      {title && (
        <div className="mb-5">
          <p className="text-[16px] font-extrabold text-foreground">{title}</p>
          {desc && <p className="text-[12px] font-medium text-muted-foreground mt-0.5">{desc}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────────

export default function TransferFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editId = id ? Number(id) : null
  const isEdit = editId !== null
  const existing = useMemo(() => (editId ? getTransfer(editId) : undefined), [editId])
  const products = useProducts()

  const [attempted, setAttempted] = useState(false)
  const [form, setForm] = useState<FormData>(() => existing
    ? { reference: existing.reference, origin: existing.origin, destination: existing.destination, status: existing.status, expectedArrival: existing.expectedArrival, note: existing.note, lines: existing.lines }
    : { reference: nextReference(), origin: '', destination: '', status: 'pending', expectedArrival: '', note: '', lines: [] }
  )

  useEffect(() => {
    if (isEdit && !existing) navigate('/admin/transfer', { replace: true })
  }, [isEdit, existing, navigate])

  const patch = (p: Partial<FormData>) => setForm(prev => ({ ...prev, ...p }))

  const addProduct = (productId: number) => {
    const p = products.find(x => x.id === productId)
    if (!p) return
    setForm(prev => ({ ...prev, lines: [...prev.lines, { productId: p.id, name: p.name, sku: p.sku, image: p.image || p.images?.[0] || '', quantity: 1 }] }))
  }
  const setQty = (productId: number, qty: number) =>
    setForm(prev => ({ ...prev, lines: prev.lines.map(l => l.productId === productId ? { ...l, quantity: Math.max(1, qty) } : l) }))
  const removeLine = (productId: number) =>
    setForm(prev => ({ ...prev, lines: prev.lines.filter(l => l.productId !== productId) }))

  const totalQty = form.lines.reduce((s, l) => s + (Number(l.quantity) || 0), 0)
  const sameLoc = form.origin && form.destination && form.origin === form.destination
  const valid = form.origin.trim() && form.destination.trim() && !sameLoc && form.lines.length > 0
  const invalid = (cond: boolean) => attempted && cond

  const handleSave = () => {
    setAttempted(true)
    if (!valid) return
    const input: TransferInput = {
      reference: form.reference.trim(), origin: form.origin, destination: form.destination,
      status: form.status, expectedArrival: form.expectedArrival, note: form.note.trim(), lines: form.lines,
    }
    if (isEdit && editId !== null) updateTransfer(editId, input)
    else createTransfer(input)
    navigate('/admin/transfer')
  }

  const statuses: TransferStatus[] = ['pending', 'in_transit', 'received', 'cancelled']

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin/transfer')} className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">{isEdit ? `Transfer ${form.reference}` : 'Create Transfer'}</h1>
          </div>
          <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground pt-2">
            <button onClick={() => navigate('/admin')} className="hover:text-foreground transition-colors">Home</button>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            <button onClick={() => navigate('/admin/transfer')} className="hover:text-foreground transition-colors">Transfers</button>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            <span className="text-foreground font-semibold">{isEdit ? 'Edit' : 'New'}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6">
        <div className="max-w-[920px] mx-auto pb-6 flex flex-col gap-5">

          {/* Route */}
          <Card title="Transfer Route" desc="Move stock from an origin warehouse to a destination shop">
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Origin <span className="text-red-500">*</span></label>
                <LocationDropdown value={form.origin} options={TRANSFER_ORIGINS} placeholder="Select origin" disabledOption={form.destination} onChange={v => patch({ origin: v })} />
              </div>
              <div className="w-10 h-[46px] flex items-center justify-center text-primary">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Destination <span className="text-red-500">*</span></label>
                <LocationDropdown value={form.destination} options={TRANSFER_DESTINATIONS} placeholder="Select destination" disabledOption={form.origin} onChange={v => patch({ destination: v })} />
              </div>
            </div>
            {invalid(!form.origin.trim() || !form.destination.trim()) && <p className="text-[11px] font-medium text-red-500 mt-2">Both origin and destination are required</p>}
            {sameLoc && <p className="text-[11px] font-medium text-red-500 mt-2">Origin and destination must be different</p>}
          </Card>

          {/* Products */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[16px] font-extrabold text-foreground">Products</p>
                <p className="text-[12px] font-medium text-muted-foreground mt-0.5">Add the products and quantities to transfer</p>
              </div>
              {form.lines.length > 0 && (
                <span className="text-[12px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">{totalQty} items · {form.lines.length} {form.lines.length === 1 ? 'product' : 'products'}</span>
              )}
            </div>

            <ProductPicker excludeIds={form.lines.map(l => l.productId)} onPick={addProduct} />

            {form.lines.length > 0 ? (
              <div className="mt-4 rounded-xl border border-black/[0.07] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-black/[0.06] bg-[#F8F9FA]">
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Product</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">SKU</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-[140px]">Quantity</th>
                      <th className="px-3 py-2.5 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {form.lines.map((l, i) => (
                      <tr key={l.productId} className="border-b border-black/[0.04] last:border-0">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            {l.image
                              ? <img src={l.image} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                              : <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-[10px] font-bold ${avatarColors[i % avatarColors.length]}`}>{initials(l.name)}</span>}
                            <span className="text-[13px] font-semibold text-foreground">{l.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-mono text-[12px] font-medium text-muted-foreground">{l.sku}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => setQty(l.productId, l.quantity - 1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground border border-black/[0.1] hover:bg-[#F4F5F7] transition-colors shrink-0">
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            </button>
                            <input type="number" min="1" value={l.quantity} onChange={e => setQty(l.productId, Number(e.target.value))}
                              className="w-14 text-center bg-[#F4F5F7] text-foreground rounded-lg px-1 py-1.5 text-[13px] font-semibold border border-transparent focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" />
                            <button type="button" onClick={() => setQty(l.productId, l.quantity + 1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground border border-black/[0.1] hover:bg-[#F4F5F7] transition-colors shrink-0">
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <button type="button" onClick={() => removeLine(l.productId)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:bg-red-50 hover:text-red-500 transition-all">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={['mt-4 rounded-xl border border-dashed py-10 flex flex-col items-center gap-1.5 text-center', invalid(form.lines.length === 0) ? 'border-red-300 bg-red-50/40' : 'border-black/[0.12] bg-[#FAFBFC]'].join(' ')}>
                <svg className="w-7 h-7 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                <p className="text-[13px] font-bold text-foreground">No products added</p>
                <p className="text-[12px] font-medium text-muted-foreground">Use the search above to add products to this transfer.</p>
              </div>
            )}
          </Card>

          {/* Details */}
          <Card title="Shipment Details">
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-3 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Reference</label>
                  <input type="text" value={form.reference} onChange={e => patch({ reference: e.target.value })} placeholder="Auto-generated" className={`${inputCls} font-mono`} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Expected Arrival</label>
                  <input type="date" value={form.expectedArrival} onChange={e => patch({ expectedArrival: e.target.value })} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Status</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {statuses.map(s => {
                      const sm = statusMeta[s]
                      const on = form.status === s
                      return (
                        <button key={s} type="button" onClick={() => patch({ status: s })}
                          className={['flex items-center gap-1.5 rounded-lg px-2 py-2 text-[12px] font-semibold border-2 transition-all', on ? `${sm.bg} ${sm.text} border-current` : 'bg-[#F4F5F7] border-transparent text-muted-foreground hover:border-black/10'].join(' ')}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${on ? sm.dot : 'bg-muted-foreground/30'}`} />
                          {sm.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Note</label>
                <textarea value={form.note} onChange={e => patch({ note: e.target.value })} placeholder="Optional note about this transfer…" rows={3}
                  className={`${inputCls} resize-none`} />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-black/[0.06] bg-card px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/admin/transfer')} className="rounded-xl px-5 py-2.5 text-[13px] font-semibold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors">Cancel</button>
        <button onClick={handleSave} className="rounded-xl px-6 py-2.5 text-[13px] font-semibold bg-primary text-white hover:bg-primary-hover active:scale-[0.98] transition-all" style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
          {isEdit ? 'Save Changes' : 'Create Transfer'}
        </button>
      </div>
    </div>
  )
}
