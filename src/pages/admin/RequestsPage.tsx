import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { callGateway, gatewayList, methods } from '../../api/gateway'
import { formatDate } from '../../api/adminCrud'

// ─── Types ────────────────────────────────────────────────────────────────────

type RequestStatus = 'new' | 'pending' | 'open' | 'resolved' | 'rejected' | 'closed' | 'cancelled'

interface SupportRequest {
  id: string
  name: string
  phone: string
  text: string
  status: RequestStatus
  createdAt: string
  updatedAt: string
}

type ApiTicketRow = {
  guid: string
  content?: string
  status?: string
  user_full_name?: string
  user_phone?: string
  created_at?: string
  updated_at?: string
}

type TicketsResponse = {
  tickets?: ApiTicketRow[]
  data?: ApiTicketRow[]
  total?: number
  stats?: Record<string, number>
}

// ─── Status config ────────────────────────────────────────────────────────────

const statusConfig: Record<RequestStatus, { label: string; bg: string; text: string; dot: string; border: string }> = {
  new:      { label: 'New',      bg: 'bg-blue-50',    text: 'text-blue-600',    dot: 'bg-blue-500',    border: 'border-blue-400'    },
  pending:  { label: 'Pending',  bg: 'bg-blue-50',    text: 'text-blue-600',    dot: 'bg-blue-500',    border: 'border-blue-400'    },
  open:     { label: 'Open',     bg: 'bg-blue-50',    text: 'text-blue-600',    dot: 'bg-blue-500',    border: 'border-blue-400'    },
  resolved: { label: 'Resolved', bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', border: 'border-emerald-400' },
  rejected: { label: 'Rejected', bg: 'bg-red-50',     text: 'text-red-500',     dot: 'bg-red-400',     border: 'border-red-400'     },
  closed:   { label: 'Closed',   bg: 'bg-red-50',     text: 'text-red-500',     dot: 'bg-red-400',     border: 'border-red-400'     },
  cancelled:{ label: 'Cancelled',bg: 'bg-red-50',     text: 'text-red-500',     dot: 'bg-red-400',     border: 'border-red-400'     },
}

const ALL_STATUSES: RequestStatus[] = ['new', 'resolved', 'rejected']

// ─── Helpers ──────────────────────────────────────────────────────────────────

const avatarColors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500']

function initials(name: string) {
  return name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function mapTicket(row: ApiTicketRow): SupportRequest {
  const status = (row.status === 'pending' || row.status === 'open') ? 'new' : (row.status as RequestStatus) || 'new'
  return {
    id: row.guid,
    name: row.user_full_name || 'Unknown user',
    phone: row.user_phone || '',
    text: row.content || '',
    status: statusConfig[status] ? status : 'new',
    createdAt: formatDate(row.created_at) || '',
    updatedAt: formatDate(row.updated_at) || '',
  }
}

function apiStatus(status: RequestStatus) {
  if (status === 'new') return 'pending'
  if (status === 'rejected') return 'cancelled'
  return status
}

function useEscClose(fn: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') fn() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [fn])
}

function useLockScroll() {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])
}

// ─── View / Status Modal ──────────────────────────────────────────────────────

function RequestModal({ req, onClose, onStatusChange }: {
  req: SupportRequest
  onClose: () => void
  onStatusChange: (id: string, status: RequestStatus) => void
}) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const av = initials(req.name)
  const sc = statusConfig[req.status]
  const colorIndex = Math.abs(Array.from(req.id).reduce((sum, char) => sum + char.charCodeAt(0), 0)) % avatarColors.length
  useEscClose(onClose)
  useLockScroll()

  return createPortal(
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
      onMouseDown={e => { if (e.target === overlayRef.current) onClose() }}>
      <div className="bg-card rounded-2xl w-[560px] max-h-[90vh] flex flex-col overflow-hidden" style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-black/[0.06] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-[12px] font-bold ${avatarColors[colorIndex]}`}>{av}</span>
            <div>
              <p className="text-[15px] font-extrabold text-foreground">{req.name}</p>
              <p className="text-[12px] font-medium text-muted-foreground font-mono">{req.phone}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

          {/* Request text */}
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Message</p>
            <div className="bg-[#F4F5F7] rounded-xl p-4">
              <p className="text-[13px] font-medium text-foreground leading-relaxed">{req.text}</p>
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Created At</p>
              <p className="text-[13px] font-semibold text-foreground">{req.createdAt}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Updated At</p>
              <p className="text-[13px] font-semibold text-foreground">{req.updatedAt}</p>
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</p>
            <div className="flex gap-2">
              {ALL_STATUSES.map(s => {
                const c = statusConfig[s]
                return (
                  <button key={s} type="button" onClick={() => onStatusChange(req.id, s)}
                    className={['flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold border-2 transition-all',
                      req.status === s ? `${c.bg} ${c.border} ${c.text}` : 'bg-[#F4F5F7] border-transparent text-muted-foreground hover:border-black/10'].join(' ')}>
                    <span className={['w-1.5 h-1.5 rounded-full', req.status === s ? c.dot : 'bg-muted-foreground/30'].join(' ')} />
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-black/[0.06] flex items-center justify-between shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold ${sc.bg} ${sc.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
          </span>
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ─── Status filter dropdown ───────────────────────────────────────────────────

type Filter = 'all' | RequestStatus

const filterOptions: { value: Filter; label: string }[] = [
  { value: 'all',      label: 'All'      },
  { value: 'new',      label: 'New'      },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
]

function FilterDropdown({ value, onChange }: { value: Filter; onChange: (v: Filter) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const current = filterOptions.find(o => o.value === value)!
  const sc = value !== 'all' ? statusConfig[value as RequestStatus] : null
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className={['flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-semibold border-2 transition-all whitespace-nowrap',
          open || value !== 'all' ? 'border-primary text-primary bg-primary/5' : 'border-black/[0.08] text-foreground bg-card hover:border-black/20'].join(' ')}>
        {sc && <span className={`w-2 h-2 rounded-full shrink-0 ${sc.dot}`} />}
        {current.label}
        <svg className={['w-3.5 h-3.5 transition-transform', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 right-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-20 min-w-[150px]" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {filterOptions.map(opt => {
            const oc = opt.value !== 'all' ? statusConfig[opt.value as RequestStatus] : null
            return (
              <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }}
                className={['w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors', opt.value === value ? 'bg-primary/[0.08] text-primary font-semibold' : 'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>
                {oc
                  ? <span className={`w-2 h-2 rounded-full shrink-0 ${oc.dot}`} />
                  : <span className="w-2 h-2 rounded-full shrink-0 border-2 border-black/20" />}
                {opt.label}
                {opt.value === value && <svg className="w-3.5 h-3.5 text-primary ml-auto shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RequestsPage() {
  const [requests, setRequests]     = useState<SupportRequest[]>([])
  const [total, setTotal]           = useState(0)
  const [stats, setStats]           = useState<Record<string, number>>({})
  const [loading, setLoading]       = useState(false)
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState<Filter>('all')
  const [page, setPage]             = useState(1)
  const [pageSize]                  = useState(20)
  const [viewModal, setViewModal]   = useState<SupportRequest | null>(null)

  const countNew      = stats.pending || stats.open || requests.filter(r => r.status === 'new').length
  const countResolved = stats.resolved || requests.filter(r => r.status === 'resolved').length
  const countRejected = stats.cancelled || stats.closed || requests.filter(r => r.status === 'rejected').length
  const pageCount = Math.ceil(total / pageSize)
  const paginated = requests

  function handleSearch(v: string) { setSearch(v); setPage(1) }
  function handleFilter(v: Filter) { setFilter(v); setPage(1) }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    gatewayList<TicketsResponse>(methods.tickets.list, {
      page,
      limit: pageSize,
      search: search.trim() || undefined,
      filter: filter === 'all' ? {} : { status: apiStatus(filter as RequestStatus) },
      sort: { created_at: -1 },
    }).then(res => {
      if (cancelled) return
      const rows = res.tickets || res.data || []
      setRequests(rows.map(mapTicket))
      setTotal(res.total ?? rows.length)
      setStats(res.stats || {})
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [page, pageSize, search, filter])

  async function handleStatusChange(id: string, status: RequestStatus) {
    await callGateway(methods.tickets.update, { guid: id, status: apiStatus(status) })
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    setViewModal(prev => prev?.id === id ? { ...prev, status } : prev)
  }

  const thCls = 'px-5 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap'
  const tdCls = 'px-5 py-3.5 text-[13px] text-foreground'

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Requests</h1>
        <p className="text-[13px] font-medium text-muted-foreground mt-0.5">Support tickets submitted by users</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: 'Total', value: total,
            iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
            icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
          },
          {
            label: 'New', value: countNew,
            iconBg: 'bg-blue-500', iconColor: 'text-white',
            icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>,
          },
          {
            label: 'Resolved', value: countResolved,
            iconBg: 'bg-emerald-500', iconColor: 'text-white',
            icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>,
          },
          {
            label: 'Rejected', value: countRejected,
            iconBg: 'bg-red-500', iconColor: 'text-white',
            icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>,
          },
        ].map(({ label, value, iconBg, iconColor, icon }) => (
          <div key={label} className="bg-card rounded-2xl border border-black/[0.06] p-5 flex items-center gap-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>{icon}</div>
            <div>
              <p className="text-[12px] font-semibold text-muted-foreground">{label}</p>
              <p className="text-[22px] font-extrabold text-foreground leading-none mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-black/[0.06] flex items-center gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input value={search} onChange={e => handleSearch(e.target.value)} placeholder="Search by name, phone, or message…"
              className="w-full h-9 pl-9 pr-8 bg-[#F4F5F7] rounded-xl text-[13px] font-medium border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            {search && (
              <button onClick={() => handleSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors">
                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <FilterDropdown value={filter} onChange={handleFilter} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8F9FB] border-b border-black/[0.06]">
              <tr>
                <th className={thCls}>Name</th>
                <th className={thCls}>Phone</th>
                <th className={thCls} style={{ minWidth: 280 }}>Message</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Created At</th>
                <th className={thCls}>Updated At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                      </svg>
                      <p className="text-[13px] font-semibold text-muted-foreground">{loading ? 'Loading requests...' : 'No requests found'}</p>
                      <button onClick={() => { handleSearch(''); handleFilter('all') }} className="text-[12px] font-semibold text-primary hover:underline">Clear filters</button>
                    </div>
                  </td>
                </tr>
              ) : paginated.map((req, i) => {
                const sc = statusConfig[req.status]
                const av = initials(req.name)
                return (
                  <tr key={req.id} onClick={() => setViewModal(req)}
                    className="hover:bg-[#FAFAFA] transition-colors cursor-pointer">
                    <td className={tdCls}>
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-bold ${avatarColors[i % avatarColors.length]}`}>{av}</span>
                        <span className="font-semibold whitespace-nowrap">{req.name}</span>
                      </div>
                    </td>
                    <td className={`${tdCls} font-mono text-muted-foreground whitespace-nowrap`}>{req.phone}</td>
                    <td className={tdCls}>
                      <p className="text-[13px] font-medium text-foreground line-clamp-2 max-w-xs leading-relaxed">{req.text}</p>
                    </td>
                    <td className={tdCls}>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                      </span>
                    </td>
                    <td className={`${tdCls} text-muted-foreground font-medium whitespace-nowrap`}>{req.createdAt}</td>
                    <td className={`${tdCls} text-muted-foreground font-medium whitespace-nowrap`}>{req.updatedAt}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="px-5 py-3 border-t border-black/[0.06] flex items-center justify-between">
            <p className="text-[12px] font-medium text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className={['w-8 h-8 rounded-lg text-[13px] font-semibold transition-colors', page === n ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-[#F4F5F7]'].join(' ')}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {viewModal && (
        <RequestModal
          req={viewModal}
          onClose={() => setViewModal(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
