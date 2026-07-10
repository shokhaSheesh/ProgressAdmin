import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

type Status = 'active' | 'inactive'

interface Region {
  id: number; name: string; status: Status; createdAt: string
}

const initialRegions: Region[] = [
  { id: 1,  name: 'Tashkent',      status: 'active',   createdAt: 'Jan 1, 2026'  },
  { id: 2,  name: 'Samarkand',     status: 'active',   createdAt: 'Jan 1, 2026'  },
  { id: 3,  name: 'Bukhara',       status: 'active',   createdAt: 'Jan 1, 2026'  },
  { id: 4,  name: 'Namangan',      status: 'active',   createdAt: 'Jan 1, 2026'  },
  { id: 5,  name: 'Andijan',       status: 'active',   createdAt: 'Jan 1, 2026'  },
  { id: 6,  name: 'Fergana',       status: 'active',   createdAt: 'Jan 1, 2026'  },
  { id: 7,  name: 'Nukus',         status: 'active',   createdAt: 'Jan 1, 2026'  },
  { id: 8,  name: 'Termez',        status: 'inactive', createdAt: 'Jan 1, 2026'  },
  { id: 9,  name: 'Qarshi',        status: 'active',   createdAt: 'Jan 1, 2026'  },
  { id: 10, name: 'Jizzakh',       status: 'inactive', createdAt: 'Jan 1, 2026'  },
  { id: 11, name: 'Navoiy',        status: 'active',   createdAt: 'Feb 3, 2026'  },
  { id: 12, name: 'Guliston',      status: 'active',   createdAt: 'Feb 3, 2026'  },
  { id: 13, name: 'Urganch',       status: 'active',   createdAt: 'Mar 10, 2026' },
  { id: 14, name: 'Farg\'ona',     status: 'active',   createdAt: 'Mar 10, 2026' },
]

const statusConfig: Record<Status, { label: string; bg: string; text: string }> = {
  active:   { label: 'Active',   bg: 'bg-emerald-50', text: 'text-emerald-600' },
  inactive: { label: 'Inactive', bg: 'bg-red-50',     text: 'text-red-500'     },
}

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
  useEscClose(onClose)
  useLockScroll()
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>,
    document.body
  )
}

function DeleteModal({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: () => void }) {
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
            <p className="text-[18px] font-extrabold text-foreground">Delete Region</p>
            <p className="text-[13px] font-medium text-muted-foreground mt-2 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-foreground">{name}</span>? This action cannot be undone.
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

interface FormState { name: string; status: Status }

function FormModal({ region, onClose, onSave }: { region: Region | null; onClose: () => void; onSave: (d: FormState) => void }) {
  const isEdit = region !== null
  const [form, setForm] = useState<FormState>({ name: region?.name ?? '', status: region?.status ?? 'active' })

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-card rounded-2xl w-[460px] max-w-full overflow-hidden" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.06]">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <svg className="w-[18px] h-[18px] text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isEdit ? 1.8 : 2} strokeLinecap="round" strokeLinejoin="round">
                {isEdit
                  ? <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" /></>
                  : <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>}
              </svg>
            </span>
            <div>
              <p className="text-[16px] font-bold text-foreground">{isEdit ? 'Edit Region' : 'Add New Region'}</p>
              <p className="text-[12px] font-medium text-muted-foreground">{isEdit ? `Editing ${region.name}` : 'Fill in the details below'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (form.name.trim()) onSave(form) }} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Region Name</label>
            <input
              type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Tashkent" required autoFocus
              className="w-full bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[13px] font-medium border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
            <div className="flex gap-2 h-[46px]">
              {(['active', 'inactive'] as Status[]).map((s) => (
                <button key={s} type="button" onClick={() => setForm((p) => ({ ...p, status: s }))}
                  className={['flex-1 flex items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold border-2 transition-all',
                    form.status === s
                      ? (s === 'active' ? 'bg-emerald-50 border-emerald-400 text-emerald-600' : 'bg-red-50 border-red-400 text-red-500')
                      : 'bg-[#F4F5F7] border-transparent text-muted-foreground hover:border-black/10'].join(' ')}>
                  <span className={['w-2 h-2 rounded-full shrink-0', form.status === s ? (s === 'active' ? 'bg-emerald-500' : 'bg-red-400') : 'bg-muted-foreground/30'].join(' ')} />
                  {s === 'active' ? 'Active' : 'Inactive'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl py-3 text-[13px] font-semibold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors">Cancel</button>
            <button type="submit" className="flex-1 rounded-xl py-3 text-[13px] font-semibold bg-primary text-white hover:bg-primary-hover active:scale-[0.98] transition-all" style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
              {isEdit ? 'Save Changes' : 'Add Region'}
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  )
}

type StatusFilter = 'all' | 'active' | 'inactive'

function StatusFilterDropdown({ value, onChange }: { value: StatusFilter; onChange: (v: StatusFilter) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const options: { value: StatusFilter; label: string; dot?: string }[] = [
    { value: 'all',      label: 'All Statuses' },
    { value: 'active',   label: 'Active',   dot: 'bg-emerald-500' },
    { value: 'inactive', label: 'Inactive', dot: 'bg-red-500' },
  ]
  const current = options.find((o) => o.value === value)!
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)}
        className={['flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-semibold border-2 transition-all whitespace-nowrap', open || value !== 'all' ? 'border-primary text-primary bg-primary/5' : 'border-black/[0.08] text-foreground bg-card hover:border-black/20'].join(' ')}>
        {current.dot && <span className={`w-2 h-2 rounded-full shrink-0 ${current.dot}`} />}
        {current.label}
        <svg className={['w-4 h-4 transition-transform', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 right-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-20 min-w-[160px]" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {options.map((opt) => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }}
              className={['w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors', opt.value === value ? 'bg-primary/[0.08] text-primary font-semibold' : 'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>
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
      <button onClick={() => setOpen((o) => !o)}
        className={['flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all', open ? 'border-primary text-primary bg-primary/5' : 'border-black/[0.08] text-muted-foreground hover:border-black/20 hover:text-foreground'].join(' ')}>
        {value}
        <svg className={['w-3.5 h-3.5 transition-transform', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="absolute bottom-full mb-1.5 left-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-20 min-w-[72px]" style={{ boxShadow: '0 -6px 20px rgba(0,0,0,0.12)' }}>
          {PAGE_SIZES.map((s) => (
            <button key={s} onClick={() => { onChange(s); setOpen(false) }} className={['w-full text-center px-4 py-2 text-[12px] font-semibold transition-colors', s === value ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>{s}</button>
          ))}
        </div>
      )}
    </div>
  )
}

type ModalState = { kind: 'edit'; region: Region } | { kind: 'delete'; region: Region } | { kind: 'create' } | null

export default function RegionsPage() {
  const [regions, setRegions]   = useState<Region[]>(initialRegions)
  const [modal, setModal]       = useState<ModalState>(null)
  const [page, setPage]         = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const filtered = regions.filter((r) => {
    const q = search.trim().toLowerCase()
    return (statusFilter === 'all' || r.status === statusFilter) && (!q || r.name.toLowerCase().includes(q))
  })
  const pageCount = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const handleSearch = (v: string) => { setSearch(v); setPage(1) }
  const handleFilter = (v: StatusFilter) => { setStatusFilter(v); setPage(1) }

  const delta = 2
  const pStart = Math.max(1, page - delta)
  const pEnd   = Math.min(pageCount, page + delta)
  const range  = Array.from({ length: pEnd - pStart + 1 }, (_, i) => pStart + i)

  const handleSave = (d: FormState) => {
    if (modal?.kind === 'edit') {
      setRegions((prev) => prev.map((r) => r.id === modal.region.id ? { ...r, ...d } : r))
    } else {
      setRegions((prev) => [...prev, {
        id: Date.now(), ...d,
        createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      }])
    }
    setModal(null)
  }

  const handleDelete = () => {
    if (modal?.kind === 'delete') {
      setRegions((prev) => prev.filter((r) => r.id !== modal.region.id))
      setModal(null)
    }
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Regions</h1>
        <p className="text-[13px] font-medium text-muted-foreground mt-0.5">Manage delivery and service regions</p>
      </div>

      {/* Table card */}
      <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-black/[0.06] flex items-center gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search by region name…"
              className="w-full h-9 pl-9 pr-8 bg-[#F4F5F7] rounded-xl text-[13px] font-medium text-foreground border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            {search && (
              <button onClick={() => handleSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors">
                <svg className="w-2.5 h-2.5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <StatusFilterDropdown value={statusFilter} onChange={handleFilter} />
          <div className="w-px h-6 bg-black/[0.08] shrink-0" />
          <button onClick={() => setModal({ kind: 'create' })}
            className="bg-primary text-white rounded-xl px-4 py-2 text-[13px] font-semibold hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center gap-1.5 shrink-0"
            style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Region
          </button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-black/[0.05]">
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-12">#</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Region Name</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Created At</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <p className="text-[13px] font-semibold text-muted-foreground">No results match your search</p>
                  <button onClick={() => { handleSearch(''); handleFilter('all') }} className="text-[12px] font-semibold text-primary hover:underline">Clear filters</button>
                </div>
              </td></tr>
            ) : paginated.map((region, i) => {
              const sc = statusConfig[region.status]
              return (
                <tr key={region.id} className="border-b border-black/[0.04] hover:bg-[#F4F5F7]/70 transition-colors last:border-0">
                  <td className="px-5 py-3.5 text-[13px] font-medium text-muted-foreground">{(page - 1) * pageSize + i + 1}</td>
                  <td className="px-5 py-3.5 text-[14px] font-semibold text-foreground">{region.name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl ${sc.bg} ${sc.text}`}>{sc.label}</span>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] font-medium text-muted-foreground">{region.createdAt}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button title="Edit" onClick={() => setModal({ kind: 'edit', region })} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" /></svg>
                      </button>
                      <button title="Delete" onClick={() => setModal({ kind: 'delete', region })} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Pagination footer */}
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
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            {range[0] > 1 && (<>
              <button onClick={() => setPage(1)} className="w-8 h-8 rounded-lg text-[13px] font-semibold text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">1</button>
              {range[0] > 2 && <span className="w-8 h-8 flex items-center justify-center text-[13px] text-muted-foreground">…</span>}
            </>)}
            {range.map((p) => (
              <button key={p} onClick={() => setPage(p)} className={['w-8 h-8 rounded-lg text-[13px] font-semibold transition-all', p === page ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground'].join(' ')}>{p}</button>
            ))}
            {range[range.length - 1] < pageCount && (<>
              {range[range.length - 1] < pageCount - 1 && <span className="w-8 h-8 flex items-center justify-center text-[13px] text-muted-foreground">…</span>}
              <button onClick={() => setPage(pageCount)} className="w-8 h-8 rounded-lg text-[13px] font-semibold text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">{pageCount}</button>
            </>)}
            <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount || pageCount === 0} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>
      </div>

      {modal?.kind === 'edit'   && <FormModal region={modal.region} onClose={() => setModal(null)} onSave={handleSave} />}
      {modal?.kind === 'create' && <FormModal region={null}         onClose={() => setModal(null)} onSave={handleSave} />}
      {modal?.kind === 'delete' && <DeleteModal name={modal.region.name} onClose={() => setModal(null)} onConfirm={handleDelete} />}
    </div>
  )
}
