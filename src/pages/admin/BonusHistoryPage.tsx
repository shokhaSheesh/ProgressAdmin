import { useState, useEffect, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type TxType = 'received' | 'withdrawn'
type Filter = 'all' | 'received' | 'withdrawn'

interface BonusTx {
  id: number
  userName: string
  avatar: string
  phone: string
  type: TxType
  amount: number
  date: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const ALL_TRANSACTIONS: BonusTx[] = [
  { id: 1,  userName: 'Akmal Karimov',    avatar: 'AK', phone: '+998 90 123 45 67', type: 'received',  amount: 5000,   date: 'Jun 21, 2026  09:14' },
  { id: 2,  userName: 'Bekzod Saidov',    avatar: 'BS', phone: '+998 91 234 56 78', type: 'withdrawn', amount: 120000, date: 'Jun 19, 2026  11:30' },
  { id: 3,  userName: 'Kamola Mirzayeva', avatar: 'KM', phone: '+998 91 234 56 78', type: 'received',  amount: 12000,  date: 'Jun 18, 2026  14:05' },
  { id: 4,  userName: 'Eldor Nazarov',    avatar: 'EN', phone: '+998 93 345 67 89', type: 'withdrawn', amount: 80000,  date: 'Jun 18, 2026  08:55' },
  { id: 5,  userName: 'Murod Xasanov',    avatar: 'MX', phone: '+998 94 456 78 90', type: 'received',  amount: 18000,  date: 'Jun 17, 2026  16:02' },
  { id: 6,  userName: 'Murod Xasanov',    avatar: 'MX', phone: '+998 94 456 78 90', type: 'withdrawn', amount: 200000, date: 'Jun 17, 2026  10:20' },
  { id: 7,  userName: 'Nodir Qodirov',    avatar: 'NQ', phone: '+998 95 567 89 01', type: 'received',  amount: 9000,   date: 'Jun 16, 2026  12:48' },
  { id: 8,  userName: 'Kamola Nazarova',  avatar: 'KN', phone: '+998 97 678 90 12', type: 'withdrawn', amount: 75000,  date: 'Jun 15, 2026  10:21' },
  { id: 9,  userName: 'Ruslan Xolmatov',  avatar: 'RX', phone: '+998 93 345 67 89', type: 'received',  amount: 0,      date: 'Jun 14, 2026  09:33' },
  { id: 10, userName: 'Sanjar Mirzaev',   avatar: 'SM', phone: '+998 99 890 12 34', type: 'withdrawn', amount: 95000,  date: 'Jun 14, 2026  07:33' },
  { id: 11, userName: 'Nilufar Hasanova', avatar: 'NH', phone: '+998 97 678 90 12', type: 'received',  amount: 18000,  date: 'Jun 12, 2026  11:15' },
  { id: 12, userName: 'Komil Hasanov',    avatar: 'KH', phone: '+998 90 901 23 45', type: 'withdrawn', amount: 60000,  date: 'Jun 12, 2026  15:10' },
  { id: 13, userName: 'Firdavs Rakhimov', avatar: 'FR', phone: '+998 98 789 01 23', type: 'received',  amount: 7500,   date: 'Jun 11, 2026  13:22' },
  { id: 14, userName: 'Akmal Karimov',    avatar: 'AK', phone: '+998 90 123 45 67', type: 'received',  amount: 4500,   date: 'Jun 10, 2026  08:41' },
  { id: 15, userName: 'Zulfiya Karimova', avatar: 'ZK', phone: '+998 91 012 34 56', type: 'received',  amount: 6000,   date: 'Jun 9, 2026  16:57'  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const avatarColors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500']
const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/,/g, ' ')

// ─── Filter dropdown ──────────────────────────────────────────────────────────

const filterOptions: { value: Filter; label: string; dot?: string }[] = [
  { value: 'all',       label: 'All'       },
  { value: 'received',  label: 'Received',  dot: 'bg-emerald-500' },
  { value: 'withdrawn', label: 'Withdrawn', dot: 'bg-red-500'     },
]

function TypeFilterDropdown({ value, onChange }: { value: Filter; onChange: (v: Filter) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = filterOptions.find((o) => o.value === value)!
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)}
        className={['flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-semibold border-2 transition-all whitespace-nowrap',
          open || value !== 'all' ? 'border-primary text-primary bg-primary/5' : 'border-black/[0.08] text-foreground bg-card hover:border-black/20'].join(' ')}>
        {current.dot && <span className={`w-2 h-2 rounded-full shrink-0 ${current.dot}`} />}
        {current.label}
        <svg className={['w-4 h-4 transition-transform', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 right-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-20 min-w-[160px]" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {filterOptions.map((opt) => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }}
              className={['w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors', opt.value === value ? 'bg-primary/[0.08] text-primary font-semibold' : 'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>
              {opt.dot
                ? <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} />
                : <span className="w-2 h-2 rounded-full shrink-0 border-2 border-black/20" />}
              {opt.label}
              {opt.value === value && <svg className="w-3.5 h-3.5 text-primary ml-auto shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

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
      <button onClick={() => setOpen((o) => !o)}
        className={['flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all', open ? 'border-primary text-primary bg-primary/5' : 'border-black/[0.08] text-muted-foreground hover:border-black/20 hover:text-foreground'].join(' ')}>
        {value}
        <svg className={['w-3.5 h-3.5 transition-transform', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="absolute bottom-full mb-1.5 left-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-20 min-w-[72px]" style={{ boxShadow: '0 -6px 20px rgba(0,0,0,0.12)' }}>
          {PAGE_SIZES.map((s) => (
            <button key={s} onClick={() => { onChange(s); setOpen(false) }}
              className={['w-full text-center px-4 py-2 text-[12px] font-semibold transition-colors', s === value ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function PaginationFooter({ page, pageCount, pageSize, total, onPage, onPageSize }: {
  page: number; pageCount: number; pageSize: number; total: number
  onPage: (p: number) => void; onPageSize: (s: number) => void
}) {
  const delta = 2
  const start = Math.max(1, page - delta)
  const end   = Math.min(pageCount, page + delta)
  const range = Array.from({ length: end - start + 1 }, (_, i) => start + i)
  return (
    <div className="px-5 py-4 border-t border-black/[0.06] flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <span className="text-[12px] font-medium text-muted-foreground">
          Showing {total === 0 ? 0 : Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-muted-foreground">Rows per page:</span>
          <PageSizeDropdown value={pageSize} onChange={onPageSize} />
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        {range[0] > 1 && (<>
          <button onClick={() => onPage(1)} className="w-8 h-8 rounded-lg text-[13px] font-semibold text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">1</button>
          {range[0] > 2 && <span className="w-8 h-8 flex items-center justify-center text-[13px] text-muted-foreground">…</span>}
        </>)}
        {range.map((p) => (
          <button key={p} onClick={() => onPage(p)}
            className={['w-8 h-8 rounded-lg text-[13px] font-semibold transition-all', p === page ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground'].join(' ')}>
            {p}
          </button>
        ))}
        {range[range.length - 1] < pageCount && (<>
          {range[range.length - 1] < pageCount - 1 && <span className="w-8 h-8 flex items-center justify-center text-[13px] text-muted-foreground">…</span>}
          <button onClick={() => onPage(pageCount)} className="w-8 h-8 rounded-lg text-[13px] font-semibold text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">{pageCount}</button>
        </>)}
        <button onClick={() => onPage(Math.min(pageCount, page + 1))} disabled={page === pageCount || pageCount === 0}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BonusHistoryPage() {
  const [filter, setFilter]     = useState<Filter>('all')
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const totalReceived  = ALL_TRANSACTIONS.filter((t) => t.type === 'received').reduce((s, t) => s + t.amount, 0)
  const totalWithdrawn = ALL_TRANSACTIONS.filter((t) => t.type === 'withdrawn').reduce((s, t) => s + t.amount, 0)

  const filtered = ALL_TRANSACTIONS.filter((t) => {
    const q = search.trim().toLowerCase()
    const matchSearch = !q || t.userName.toLowerCase().includes(q) || t.phone.includes(q)
    const matchFilter = filter === 'all' || t.type === filter
    return matchSearch && matchFilter
  })

  const pageCount = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const handleSearch = (v: string) => { setSearch(v); setPage(1) }
  const handleFilter = (f: Filter) => { setFilter(f); setPage(1) }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Bonus History</h1>
        <p className="text-[13px] font-medium text-muted-foreground mt-0.5">Track received and withdrawn bonuses across all users</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl border border-black/[0.06] p-5 flex items-center justify-between" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Received</p>
            <p className="text-[22px] font-extrabold text-foreground leading-none">{fmt(totalReceived)}</p>
            <p className="text-[11px] font-semibold text-muted-foreground">UZS</p>
          </div>
          <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-emerald-500">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
            </svg>
          </span>
        </div>

        <div className="bg-card rounded-2xl border border-black/[0.06] p-5 flex items-center justify-between" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Withdrawn</p>
            <p className="text-[22px] font-extrabold text-foreground leading-none">{fmt(totalWithdrawn)}</p>
            <p className="text-[11px] font-semibold text-muted-foreground">UZS</p>
          </div>
          <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-red-500">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
            </svg>
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-black/[0.06] flex items-center gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by user or phone…"
              className="w-full h-9 pl-9 pr-8 bg-[#F4F5F7] rounded-xl text-[13px] font-medium text-foreground border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            {search && (
              <button onClick={() => handleSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors">
                <svg className="w-2.5 h-2.5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          <TypeFilterDropdown value={filter} onChange={handleFilter} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.05]">
                {['User', 'Type', 'Amount', 'Date'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <p className="text-[13px] font-semibold text-muted-foreground">No results match your search</p>
                    <button onClick={() => { handleSearch(''); handleFilter('all') }} className="text-[12px] font-semibold text-primary hover:underline">Clear filters</button>
                  </div>
                </td></tr>
              ) : paginated.map((tx, i) => {
                const isReceived = tx.type === 'received'
                const bg = avatarColors[i % avatarColors.length]
                return (
                  <tr key={tx.id} className="border-b border-black/[0.04] hover:bg-[#F4F5F7]/70 transition-colors last:border-0">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-bold ${bg}`}>{tx.avatar}</span>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[13px] font-semibold text-foreground whitespace-nowrap">{tx.userName}</span>
                          <span className="text-[11px] font-medium text-muted-foreground font-mono">{tx.phone}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={['w-5 h-5 rounded-full flex items-center justify-center shrink-0', isReceived ? 'bg-emerald-50' : 'bg-red-50'].join(' ')}>
                          <svg className={['w-3 h-3', isReceived ? 'text-emerald-500' : 'text-red-500'].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                            {isReceived
                              ? <><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></>
                              : <><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></>
                            }
                          </svg>
                        </span>
                        <span className={['text-[12px] font-semibold px-2.5 py-1 rounded-xl', isReceived ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'].join(' ')}>
                          {isReceived ? 'Received' : 'Withdrawn'}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className={['text-[14px] font-bold', isReceived ? 'text-emerald-600' : 'text-red-500'].join(' ')}>
                        {isReceived ? '+' : '−'}{fmt(tx.amount)}
                      </span>
                      <span className="text-[11px] font-medium text-muted-foreground ml-1">UZS</span>
                    </td>

                    <td className="px-5 py-3.5 text-[13px] font-medium text-muted-foreground whitespace-nowrap">{tx.date}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <PaginationFooter
          page={page} pageCount={pageCount} pageSize={pageSize} total={filtered.length}
          onPage={setPage} onPageSize={(s) => { setPageSize(s); setPage(1) }}
        />
      </div>
    </div>
  )
}
