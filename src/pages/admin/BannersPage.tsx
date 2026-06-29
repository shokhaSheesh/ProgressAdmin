import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { bannerStore } from './BannerFormPage'
import type { BannerData } from './BannerFormPage'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assignmentLabel(a: BannerData['assignment']): string {
  if (a.target === 'categories') {
    const n = a.ids.length
    return n === 1 ? '1 Category' : `${n} Categories`
  }
  const MOCK_PRODUCTS_IDS = [
    { id: 101, varIds: [10101, 10102, 10103] },
    { id: 102, varIds: [10201, 10202] },
    { id: 103, varIds: [10301, 10302, 10303] },
    { id: 104, varIds: [10401, 10402] },
    { id: 105, varIds: [10501, 10502, 10503] },
    { id: 106, varIds: [10601, 10602, 10603, 10604] },
    { id: 107, varIds: [10701, 10702, 10703] },
    { id: 108, varIds: [10801, 10802] },
  ]
  const count = MOCK_PRODUCTS_IDS.filter((p) => p.varIds.some((v) => a.ids.includes(v))).length
  return count === 1 ? '1 Product' : `${count} Products`
}

const PLACEHOLDER_COLORS = ['#DBEAFE', '#D1FAE5', '#FEF3C7', '#FCE7F3', '#EDE9FE', '#FFEDD5']
function placeholderColor(id: number) { return PLACEHOLDER_COLORS[id % PLACEHOLDER_COLORS.length] }

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

// ─── Thumbnail ────────────────────────────────────────────────────────────────

function BannerThumb({ image, id, title }: { image: string; id: number; title: string }) {
  if (image) {
    return (
      <div className="w-16 h-10 rounded-lg overflow-hidden border border-black/[0.08] shrink-0">
        <img src={image} alt={title} className="w-full h-full object-cover" />
      </div>
    )
  }
  return (
    <div
      className="w-16 h-10 rounded-lg shrink-0 flex items-center justify-center border border-black/[0.08]"
      style={{ backgroundColor: placeholderColor(id) }}
    >
      <svg className="w-4 h-4 text-black/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    </div>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({ name, onConfirm, onClose }: { name: string; onConfirm: () => void; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null)
  useEscClose(onClose)
  useLockScroll()

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="bg-card rounded-2xl w-[400px] p-6 shadow-2xl flex flex-col gap-4">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
          <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
          </svg>
        </div>
        <div>
          <p className="text-[15px] font-extrabold text-foreground">Delete Banner</p>
          <p className="text-[13px] font-medium text-muted-foreground mt-1">
            Are you sure you want to delete <span className="font-bold text-foreground">"{name}"</span>? This cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 mt-1">
          <button onClick={onClose} className="flex-1 rounded-xl py-2.5 text-[13px] font-bold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl py-2.5 text-[13px] font-bold bg-red-500 text-white hover:bg-red-600 transition-colors">Delete</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BannersPage() {
  const navigate = useNavigate()
  const [banners, setBanners]         = useState<BannerData[]>([...bannerStore])
  const [search, setSearch]           = useState('')
  const [page, setPage]               = useState(1)
  const [pageSize]                    = useState(20)
  const [deleteModal, setDeleteModal] = useState<{ id: number; name: string } | null>(null)

  const totalActive   = banners.filter((b) => b.status === 'active').length
  const totalInactive = banners.filter((b) => b.status === 'inactive').length

  const filtered  = banners.filter((b) => !search.trim() || b.title.toLowerCase().includes(search.trim().toLowerCase()))
  const pageCount = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  function handleDelete() {
    if (!deleteModal) return
    const idx = bannerStore.findIndex((b) => b.id === deleteModal.id)
    if (idx >= 0) bannerStore.splice(idx, 1)
    setBanners([...bannerStore])
    setDeleteModal(null)
  }

  const thCls = 'px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap'
  const tdCls = 'px-4 py-3 text-[13px] text-foreground'

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Banners</h1>
        <p className="text-[13px] font-medium text-muted-foreground mt-0.5">Manage promotional banners assigned to categories or products</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Total Banners', value: banners.length,
            icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>,
            iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
          },
          {
            label: 'Active', value: totalActive,
            icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>,
            iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',
          },
          {
            label: 'Inactive', value: totalInactive,
            icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M4.93 4.93l14.14 14.14" /></svg>,
            iconBg: 'bg-red-100', iconColor: 'text-red-500',
          },
        ].map(({ label, value, icon, iconBg, iconColor }) => (
          <div key={label} className="bg-card rounded-2xl p-5 flex items-center gap-4 border border-black/[0.04]">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>{icon}</div>
            <div>
              <p className="text-[12px] font-semibold text-muted-foreground">{label}</p>
              <p className="text-[22px] font-extrabold text-foreground leading-none mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-card rounded-2xl border border-black/[0.04] overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-black/[0.06]">
          <div className="relative w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search banners…"
              className="w-full pl-9 pr-4 py-2 rounded-xl text-[13px] font-medium bg-[#F4F5F7] border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <button
            onClick={() => navigate('/admin/banners/new')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Banner
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8F9FB] border-b border-black/[0.06]">
              <tr>
                <th className={thCls}>Image</th>
                <th className={thCls}>Title</th>
                <th className={thCls}>Assigned To</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Created At</th>
                <th className={thCls}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-[13px] font-medium text-muted-foreground">No banners found</td></tr>
              ) : paginated.map((b) => {
                const sc = b.status === 'active'
                  ? { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', label: 'Active' }
                  : { bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-400', label: 'Inactive' }
                return (
                  <tr key={b.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className={tdCls}>
                      <BannerThumb image={b.image} id={b.id} title={b.title} />
                    </td>
                    <td className={tdCls}>
                      <span className="font-semibold">{b.title}</span>
                    </td>
                    <td className={tdCls}>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F4F5F7] text-[12px] font-semibold text-foreground">
                        <svg className="w-3 h-3 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          {b.assignment.target === 'categories'
                            ? <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            : <><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></>
                          }
                        </svg>
                        {assignmentLabel(b.assignment)}
                      </span>
                    </td>
                    <td className={tdCls}>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </span>
                    </td>
                    <td className={`${tdCls} text-muted-foreground font-medium`}>{b.createdAt}</td>
                    <td className={tdCls}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/admin/banners/${b.id}/edit`)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteModal({ id: b.id, name: b.title })}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="px-5 py-3 border-t border-black/[0.06] flex items-center justify-between">
            <p className="text-[12px] font-medium text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setPage(n)}
                  className={['w-8 h-8 rounded-lg text-[13px] font-semibold transition-colors', page === n ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:bg-[#F4F5F7]'].join(' ')}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {deleteModal !== null && (
        <DeleteModal name={deleteModal.name} onConfirm={handleDelete} onClose={() => setDeleteModal(null)} />
      )}
    </div>
  )
}
