import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrders, deleteOrder, type Order, type OrderStatus } from '../../data/ordersStore'

type StatusFilter = 'all' | OrderStatus

const PAGE_SIZES = [20, 30, 40]

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

function StatusFilterDropdown({ value, onChange }: { value: StatusFilter; onChange: (v: StatusFilter) => void }) {
  const options: { value: StatusFilter; label: string; dot?: string }[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending', dot: 'bg-amber-500' },
    { value: 'processing', label: 'Processing', dot: 'bg-blue-500' },
    { value: 'completed', label: 'Completed', dot: 'bg-emerald-500' },
    { value: 'cancelled', label: 'Cancelled', dot: 'bg-red-400' },
  ]
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as StatusFilter)}
      className="h-9 px-4 rounded-xl text-[13px] font-semibold border-2 border-black/[0.08] bg-card text-foreground focus:outline-none focus:border-primary"
    >
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  )
}

function PageSizeDropdown({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-black/[0.08] text-muted-foreground bg-card focus:outline-none focus:border-primary"
    >
      {PAGE_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
    </select>
  )
}

function DeleteModal({ order, onClose, onConfirm }: { order: Order; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-card rounded-2xl w-[460px] max-w-full overflow-hidden" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
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
              Are you sure you want to delete order <span className="font-bold text-foreground">{order.orderNumber}</span>?
            </p>
          </div>
        </div>
        <div className="flex gap-3 px-8 pb-8">
          <button onClick={onClose} className="flex-1 rounded-xl py-3 text-[13px] font-semibold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl py-3 text-[13px] font-semibold bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] transition-all">Yes, Delete</button>
        </div>
      </div>
    </div>
  )
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const orders = useOrders()
  const [modal, setModal] = useState<Order | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter(order => {
      const matchesSearch = !q || [
        order.orderNumber,
        order.buyerName,
        order.buyerPhone,
        order.shop,
        ...order.products.map(product => product.name),
        ...order.products.map(product => product.sku),
      ].some(value => value.toLowerCase().includes(q))
      return matchesSearch && (statusFilter === 'all' || order.status === statusFilter)
    })
  }, [orders, search, statusFilter])

  const pageCount = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)
  const range = Array.from({ length: Math.min(pageCount, 5) }, (_, i) => i + 1)

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Orders</h1>
        <p className="text-[13px] font-medium text-muted-foreground mt-0.5">Track and manage all customer orders</p>
      </div>

      <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div className="px-5 py-3.5 border-b border-black/[0.06] flex items-center gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by order #, buyer, seller, shop..."
              className="w-full h-9 pl-9 pr-8 bg-[#F4F5F7] rounded-xl text-[13px] font-medium text-foreground border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <StatusFilterDropdown value={statusFilter} onChange={(value) => { setStatusFilter(value); setPage(1) }} />
          <div className="w-px h-6 bg-black/[0.08] shrink-0" />
          <button onClick={() => navigate('/admin-design/orders/new')}
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
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Products</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Bonus</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-16 text-center">
                <p className="text-[13px] font-semibold text-muted-foreground">No orders match your search</p>
              </td></tr>
            ) : paginated.map(order => (
              <tr key={order.id} onClick={() => navigate(`/admin-design/orders/${order.id}/edit`)} className="border-b border-black/[0.04] hover:bg-[#F4F5F7]/70 transition-colors last:border-0 cursor-pointer">
                <td className="px-5 py-3.5">
                  <span className="font-mono text-[12px] font-semibold text-foreground bg-[#F4F5F7] px-2 py-0.5 rounded-lg">{order.orderNumber}</span>
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-[13px] font-semibold text-foreground">{order.buyerName}</p>
                  <p className="text-[11px] font-medium text-muted-foreground">{order.buyerPhone}</p>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex shrink-0" style={{ marginRight: order.products.length > 1 ? (Math.min(order.products.length, 3) - 1) * 8 : 0 }}>
                      {order.products.slice(0, 3).map((product, i) => (
                        <div key={product.productId} style={{ marginLeft: i > 0 ? -10 : 0, zIndex: 3 - i }}>
                          <ProductInitials name={product.name} image={product.image} size={28} />
                        </div>
                      ))}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">{order.products[0]?.name || 'No products'}</p>
                      {order.products.length > 1
                        ? <p className="text-[11px] font-semibold text-primary mt-0.5">+{order.products.length - 1} more item{order.products.length > 2 ? 's' : ''}</p>
                        : <p className="text-[11px] font-medium text-muted-foreground font-mono">{order.products[0]?.sku || ''}</p>
                      }
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  {order.mechanicBonus > 0
                    ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-600">+{fmtPrice(order.mechanicBonus)}</span>
                    : <span className="text-[12px] font-medium text-muted-foreground/40">-</span>
                  }
                </td>
                <td className="px-5 py-3.5 text-[13px] font-medium text-muted-foreground whitespace-nowrap">{order.date}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                    <button title="Edit" onClick={() => navigate(`/admin-design/orders/${order.id}/edit`)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" /></svg>
                    </button>
                    <button title="Delete" onClick={() => setModal(order)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-5 py-4 border-t border-black/[0.06] flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-medium text-muted-foreground">
              Showing {filtered.length === 0 ? 0 : Math.min((page - 1) * pageSize + 1, filtered.length)}-{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-muted-foreground">Rows per page:</span>
              <PageSizeDropdown value={pageSize} onChange={(size) => { setPageSize(size); setPage(1) }} />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            {range.map(pg => <button key={pg} onClick={() => setPage(pg)} className={['w-8 h-8 rounded-lg text-[13px] font-semibold transition-all', pg === page ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground'].join(' ')}>{pg}</button>)}
            <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount || pageCount === 0} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>
      </div>

      {modal && (
        <DeleteModal order={modal} onClose={() => setModal(null)} onConfirm={() => { deleteOrder(modal.id); setModal(null) }} />
      )}
    </div>
  )
}
