import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useOrders, deleteOrder } from '../../data/ordersStore'
import type { Order, OrderStatus } from '../../data/ordersStore'

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
function ModalBackdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEscClose(onClose); useLockScroll()
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>, document.body
  )
}

function DeleteModal({ orderNumber, onClose, onConfirm }: { orderNumber: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-card rounded-2xl w-[460px] max-w-full overflow-hidden" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
        <div className="flex flex-col items-center gap-4 px-8 pt-8 pb-6 text-center">
          <span className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </span>
          <div>
            <p className="text-[18px] font-extrabold text-foreground">Delete Order</p>
            <p className="text-[13px] font-medium text-muted-foreground mt-2 leading-relaxed">
              Are you sure you want to delete order <span className="font-bold text-foreground">{orderNumber}</span>? This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3 px-8 pb-8">
          <button onClick={onClose} className="flex-1 rounded-xl py-3 text-[13px] font-semibold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl py-3 text-[13px] font-semibold bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] transition-all" style={{ boxShadow: '0 2px 8px rgba(239,68,68,0.3)' }}>Yes, Delete</button>
        </div>
      </div>
    </ModalBackdrop>
  )
}

type StatusFilter = 'all' | OrderStatus

function StatusFilterDropdown({ value, onChange }: { value: StatusFilter; onChange: (v: StatusFilter) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const options: { value: StatusFilter; label: string; dot?: string }[] = [
    { value: 'all',        label: 'All Statuses' },
    { value: 'pending',    label: 'Pending',    dot: 'bg-amber-500'   },
    { value: 'processing', label: 'Processing', dot: 'bg-blue-500'    },
    { value: 'completed',  label: 'Completed',  dot: 'bg-emerald-500' },
    { value: 'cancelled',  label: 'Cancelled',  dot: 'bg-red-400'     },
  ]
  const current = options.find(o => o.value === value)!
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={['flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-semibold border-2 transition-all whitespace-nowrap',
          open || value !== 'all' ? 'border-primary text-primary bg-primary/5' : 'border-black/[0.08] text-foreground bg-card hover:border-black/20'].join(' ')}>
        {current.dot && <span className={`w-2 h-2 rounded-full shrink-0 ${current.dot}`} />}
        {current.label}
        <svg className={['w-4 h-4 transition-transform', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 right-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-20 min-w-[170px]" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {options.map(opt => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }}
              className={['w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors',
                opt.value === value ? 'bg-primary/[0.08] text-primary font-semibold' : 'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>
              {opt.dot ? <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} /> : <span className="w-2 h-2 rounded-full shrink-0 border-2 border-black/20" />}
              {opt.label}
              {opt.value === value && <svg className="w-3.5 h-3.5 text-primary ml-auto shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const PAGE_SIZES = [20, 30, 40]
function PageSizeDropdown({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={['flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all',
          open ? 'border-primary text-primary bg-primary/5' : 'border-black/[0.08] text-muted-foreground hover:border-black/20 hover:text-foreground'].join(' ')}>
        {value}
        <svg className={['w-3.5 h-3.5 transition-transform', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="absolute bottom-full mb-1.5 left-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-20 min-w-[72px]" style={{ boxShadow: '0 -6px 20px rgba(0,0,0,0.12)' }}>
          {PAGE_SIZES.map(s => (
            <button key={s} onClick={() => { onChange(s); setOpen(false) }} className={['w-full text-center px-4 py-2 text-[12px] font-semibold transition-colors', s === value ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>{s}</button>
          ))}
        </div>
      )}
    </div>
  )
}

function fmtPrice(n: number) {
  return n.toLocaleString('ru-RU').replace(/,/g, ' ') + ' UZS'
}

function ProductInitials({ name, image, size = 32 }: { name: string; image: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['bg-blue-100 text-blue-600', 'bg-violet-100 text-violet-600', 'bg-amber-100 text-amber-600', 'bg-emerald-100 text-emerald-600', 'bg-rose-100 text-rose-600']
  const color = colors[name.charCodeAt(0) % colors.length]
  if (image) return <img src={image} alt={name} style={{ width: size, height: size }} className="rounded-lg object-cover shrink-0" />
  return <div style={{ width: size, height: size }} className={`rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold ${color}`}>{initials}</div>
}

type ModalState = { kind: 'delete'; order: Order } | null

export default function OrdersPage() {
  const navigate = useNavigate()
  const orders   = useOrders()
  const [modal, setModal]   = useState<ModalState>(null)
  const [page, setPage]     = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const filtered = orders.filter(o => {
    const q = search.trim().toLowerCase()
    const matchSearch = !q || [o.orderNumber, o.buyerName, o.buyerPhone, o.shop, o.product.name, o.product.sku].some(v => v.toLowerCase().includes(q))
    return (statusFilter === 'all' || o.status === statusFilter) && matchSearch
  })
  const pageCount = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const handleSearch = (v: string) => { setSearch(v); setPage(1) }
  const handleFilter = (v: StatusFilter) => { setStatusFilter(v); setPage(1) }

  const delta = 2
  const pStart = Math.max(1, page - delta)
  const pEnd   = Math.min(pageCount, page + delta)
  const range  = Array.from({ length: pEnd - pStart + 1 }, (_, i) => pStart + i)

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Orders</h1>
        <p className="text-[13px] font-medium text-muted-foreground mt-0.5">Track and manage all customer orders</p>
      </div>

      <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-black/[0.06] flex items-center gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by order #, buyer, seller, shop…"
              className="w-full h-9 pl-9 pr-8 bg-[#F4F5F7] rounded-xl text-[13px] font-medium text-foreground border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            {search && (
              <button onClick={() => handleSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors">
                <svg className="w-2.5 h-2.5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <StatusFilterDropdown value={statusFilter} onChange={handleFilter} />
          <div className="w-px h-6 bg-black/[0.08] shrink-0" />
          <button onClick={() => navigate('/admin/orders/new')}
            className="bg-primary text-white rounded-xl px-4 py-2 text-[13px] font-semibold hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center gap-1.5 shrink-0"
            style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            New Order
          </button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-black/[0.05]">
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Order #</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Buyer</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Bonus</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <p className="text-[13px] font-semibold text-muted-foreground">No orders match your search</p>
                  <button onClick={() => { handleSearch(''); handleFilter('all') }} className="text-[12px] font-semibold text-primary hover:underline">Clear filters</button>
                </div>
              </td></tr>
            ) : paginated.map(order => {
              return (
                <tr key={order.id}
                  onClick={() => navigate(`/admin/orders/${order.id}/edit`)}
                  className="border-b border-black/[0.04] hover:bg-[#F4F5F7]/70 transition-colors last:border-0 cursor-pointer">
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-[12px] font-semibold text-foreground bg-[#F4F5F7] px-2 py-0.5 rounded-lg">{order.orderNumber}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-[13px] font-semibold text-foreground">{order.buyerName}</p>
                    <p className="text-[11px] font-medium text-muted-foreground">{order.buyerPhone}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <ProductInitials name={order.product.name} image={order.product.image} size={32} />
                      <div>
                        <p className="text-[13px] font-semibold text-foreground">{order.product.name}</p>
                        <p className="text-[11px] font-medium text-muted-foreground font-mono">{order.product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {order.mechanicBonus > 0
                      ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-600">+{fmtPrice(order.mechanicBonus)}</span>
                      : <span className="text-[12px] font-medium text-muted-foreground/40">—</span>
                    }
                  </td>
                  <td className="px-5 py-3.5 text-[13px] font-medium text-muted-foreground whitespace-nowrap">{order.date}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                      <button title="Edit" onClick={() => navigate(`/admin/orders/${order.id}/edit`)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" />
                        </svg>
                      </button>
                      <button title="Delete" onClick={() => setModal({ kind: 'delete', order })}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-5 py-4 border-t border-black/[0.06] flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-medium text-muted-foreground">
              Showing {filtered.length === 0 ? 0 : Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-muted-foreground">Rows per page:</span>
              <PageSizeDropdown value={pageSize} onChange={(s) => { setPageSize(s); setPage(1) }} />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            {range[0] > 1 && (<>
              <button onClick={() => setPage(1)} className="w-8 h-8 rounded-lg text-[13px] font-semibold text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">1</button>
              {range[0] > 2 && <span className="w-8 h-8 flex items-center justify-center text-[13px] text-muted-foreground">…</span>}
            </>)}
            {range.map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={['w-8 h-8 rounded-lg text-[13px] font-semibold transition-all', p === page ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground'].join(' ')}>{p}</button>
            ))}
            {range[range.length - 1] < pageCount && (<>
              {range[range.length - 1] < pageCount - 1 && <span className="w-8 h-8 flex items-center justify-center text-[13px] text-muted-foreground">…</span>}
              <button onClick={() => setPage(pageCount)} className="w-8 h-8 rounded-lg text-[13px] font-semibold text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">{pageCount}</button>
            </>)}
            <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount || pageCount === 0}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>
      </div>

      {modal?.kind === 'delete' && (
        <DeleteModal orderNumber={modal.order.orderNumber} onClose={() => setModal(null)}
          onConfirm={() => { deleteOrder(modal.order.id); setModal(null) }} />
      )}
    </div>
  )
}
