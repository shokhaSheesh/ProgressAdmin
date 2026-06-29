import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

// ─── Types ────────────────────────────────────────────────────────────────────

type MBrandStatus = 'active' | 'inactive'

interface MBrand {
  id: number
  name: string
  logo: string
  status: MBrandStatus
  createdAt: string
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const initialBrands: MBrand[] = [
  { id: 1,  name: 'Bosch',        logo: '', status: 'active',   createdAt: 'Jun 1, 2026'  },
  { id: 2,  name: 'NGK',          logo: '', status: 'active',   createdAt: 'Jun 1, 2026'  },
  { id: 3,  name: 'Brembo',       logo: '', status: 'active',   createdAt: 'Jun 2, 2026'  },
  { id: 4,  name: 'Mann Filter',  logo: '', status: 'active',   createdAt: 'Jun 2, 2026'  },
  { id: 5,  name: 'Gates',        logo: '', status: 'active',   createdAt: 'Jun 3, 2026'  },
  { id: 6,  name: 'Bilstein',     logo: '', status: 'active',   createdAt: 'Jun 3, 2026'  },
  { id: 7,  name: 'Hella',        logo: '', status: 'active',   createdAt: 'Jun 4, 2026'  },
  { id: 8,  name: 'Febi Bilstein',logo: '', status: 'active',   createdAt: 'Jun 4, 2026'  },
  { id: 9,  name: 'Sachs',        logo: '', status: 'inactive', createdAt: 'Jun 5, 2026'  },
  { id: 10, name: 'SKF',          logo: '', status: 'active',   createdAt: 'Jun 5, 2026'  },
  { id: 11, name: 'Continental',  logo: '', status: 'active',   createdAt: 'Jun 6, 2026'  },
  { id: 12, name: 'Valeo',        logo: '', status: 'inactive', createdAt: 'Jun 6, 2026'  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function brandInitials(name: string) {
  return name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

const avatarPalette = [
  'bg-blue-100 text-blue-600',
  'bg-violet-100 text-violet-600',
  'bg-amber-100 text-amber-600',
  'bg-emerald-100 text-emerald-600',
  'bg-rose-100 text-rose-600',
  'bg-cyan-100 text-cyan-600',
]

function brandColor(name: string) {
  return avatarPalette[name.charCodeAt(0) % avatarPalette.length]
}

function BrandAvatar({ logo, name, size = 36 }: { logo: string; name: string; size?: number }) {
  if (logo) {
    return <img src={logo} alt={name} style={{ width: size, height: size }} className="rounded-xl object-contain bg-[#F4F5F7] shrink-0" />
  }
  return (
    <div style={{ width: size, height: size }}
      className={`rounded-xl shrink-0 flex items-center justify-center text-[11px] font-bold ${brandColor(name)}`}>
      {brandInitials(name)}
    </div>
  )
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

// ─── Brand Modal ──────────────────────────────────────────────────────────────

type ModalForm = { name: string; logo: string; status: MBrandStatus }

function BrandModal({ initial, onSave, onClose }: {
  initial?: MBrand
  onSave: (data: Omit<MBrand, 'id' | 'createdAt'>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<ModalForm>(
    initial
      ? { name: initial.name, logo: initial.logo, status: initial.status }
      : { name: '', logo: '', status: 'active' }
  )
  const [nameErr, setNameErr] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  useEscClose(onClose)
  useLockScroll()

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => setForm(f => ({ ...f, logo: e.target?.result as string }))
    reader.readAsDataURL(file)
  }

  function handleSave() {
    if (!form.name.trim()) { setNameErr('Brand name is required'); return }
    onSave({ name: form.name.trim(), logo: form.logo, status: form.status })
  }

  const inputCls = (err?: string) =>
    ['w-full rounded-xl px-4 py-2.5 text-[13px] font-medium bg-[#F4F5F7] border-2 outline-none transition-all',
      err ? 'border-red-400' : 'border-transparent focus:border-blue-500 focus:bg-white'].join(' ')

  return createPortal(
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
      onMouseDown={e => { if (e.target === overlayRef.current) onClose() }}>
      <div className="bg-card rounded-2xl w-[480px] overflow-hidden" style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-black/[0.06] flex items-center justify-between">
          <div>
            <p className="text-[16px] font-extrabold text-foreground">{initial ? 'Edit Brand' : 'New Brand'}</p>
            <p className="text-[12px] font-medium text-muted-foreground mt-0.5">Manufacturer brand for products</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] transition-all">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">

          {/* Logo upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Logo (optional)</label>
            {form.logo ? (
              <div className="relative w-fit">
                <img src={form.logo} alt="logo" className="w-20 h-20 rounded-2xl object-contain bg-[#F4F5F7] border-2 border-black/[0.06]" />
                <div className="absolute inset-0 rounded-2xl bg-black/0 hover:bg-black/30 transition-all flex items-center justify-center gap-1 opacity-0 hover:opacity-100">
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-foreground hover:bg-[#F4F5F7] transition-colors">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  </button>
                  <button type="button" onClick={() => setForm(f => ({ ...f, logo: '' }))}
                    className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                onClick={() => fileRef.current?.click()}
                className={['flex flex-col items-center justify-center gap-2 h-24 rounded-2xl border-2 border-dashed cursor-pointer transition-all',
                  dragging ? 'border-blue-400 bg-blue-50' : 'border-black/[0.10] hover:border-blue-400 hover:bg-blue-50/40'].join(' ')}>
                <svg className="w-6 h-6 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                </svg>
                <p className="text-[12px] font-medium text-muted-foreground">Click or drag image here</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Brand Name</label>
            <input value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setNameErr('') }}
              placeholder="e.g. Bosch, NGK, Brembo…" className={inputCls(nameErr)} />
            {nameErr && <p className="text-[11px] font-semibold text-red-500">{nameErr}</p>}
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
            <div className="flex gap-2">
              {(['active', 'inactive'] as MBrandStatus[]).map(s => (
                <button key={s} type="button" onClick={() => setForm(f => ({ ...f, status: s }))}
                  className={['flex-1 rounded-xl py-2.5 text-[13px] font-semibold border-2 transition-all capitalize',
                    form.status === s
                      ? s === 'active' ? 'bg-emerald-50 border-emerald-400 text-emerald-600' : 'bg-red-50 border-red-400 text-red-500'
                      : 'bg-[#F4F5F7] border-transparent text-muted-foreground hover:border-black/10'].join(' ')}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-black/[0.06] flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-[13px] font-semibold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-6 py-2.5 rounded-xl text-[13px] font-semibold bg-primary text-white hover:bg-blue-700 active:scale-[0.98] transition-all"
            style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
            {initial ? 'Save Changes' : 'Create Brand'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({ name, onConfirm, onClose }: { name: string; onConfirm: () => void; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null)
  useEscClose(onClose)
  useLockScroll()
  return createPortal(
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
      onMouseDown={e => { if (e.target === overlayRef.current) onClose() }}>
      <div className="bg-card rounded-2xl w-[400px] p-6 shadow-2xl flex flex-col gap-4">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
          <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
          </svg>
        </div>
        <div>
          <p className="text-[15px] font-extrabold text-foreground">Delete Brand</p>
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

export default function ManufacturerBrandsPage() {
  const [brands, setBrands]           = useState<MBrand[]>(initialBrands)
  const [search, setSearch]           = useState('')
  const [page, setPage]               = useState(1)
  const [pageSize]                    = useState(20)
  const [editModal, setEditModal]     = useState<MBrand | null | 'new'>(null)
  const [deleteModal, setDeleteModal] = useState<{ id: number; name: string } | null>(null)

  const totalActive   = brands.filter(b => b.status === 'active').length
  const totalInactive = brands.filter(b => b.status === 'inactive').length

  const filtered  = brands.filter(b => !search.trim() || b.name.toLowerCase().includes(search.trim().toLowerCase()))
  const pageCount = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  function handleSave(data: Omit<MBrand, 'id' | 'createdAt'>) {
    if (editModal === 'new') {
      setBrands(prev => [{ id: Date.now(), createdAt: 'Jun 29, 2026', ...data }, ...prev])
    } else if (editModal) {
      setBrands(prev => prev.map(b => b.id === (editModal as MBrand).id ? { ...b, ...data } : b))
    }
    setEditModal(null)
  }

  function handleDelete() {
    if (!deleteModal) return
    setBrands(prev => prev.filter(b => b.id !== deleteModal.id))
    setDeleteModal(null)
  }

  const thCls = 'px-5 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap'
  const tdCls = 'px-5 py-3.5 text-[13px] text-foreground'

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Manufacturer Brands</h1>
        <p className="text-[13px] font-medium text-muted-foreground mt-0.5">Brands that products belong to</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Total Brands', value: brands.length,
            icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
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
          <div key={label} className="bg-card rounded-2xl p-5 flex items-center gap-4 border border-black/[0.04]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>{icon}</div>
            <div>
              <p className="text-[12px] font-semibold text-muted-foreground">{label}</p>
              <p className="text-[22px] font-extrabold text-foreground leading-none mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-black/[0.04] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div className="px-5 py-4 flex items-center justify-between border-b border-black/[0.06]">
          <div className="relative w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search brands…"
              className="w-full pl-9 pr-4 py-2 rounded-xl text-[13px] font-medium bg-[#F4F5F7] border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all" />
          </div>
          <button onClick={() => setEditModal('new')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-700 active:bg-blue-800 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            Add Brand
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8F9FB] border-b border-black/[0.06]">
              <tr>
                <th className={thCls}>Brand</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Created At</th>
                <th className={thCls}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {paginated.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-[13px] font-medium text-muted-foreground">No brands found</td></tr>
              ) : paginated.map(b => {
                const sc = b.status === 'active'
                  ? { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', label: 'Active' }
                  : { bg: 'bg-red-50',     text: 'text-red-500',     dot: 'bg-red-400',     label: 'Inactive' }
                return (
                  <tr key={b.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className={tdCls}>
                      <div className="flex items-center gap-3">
                        <BrandAvatar logo={b.logo} name={b.name} size={36} />
                        <span className="font-semibold">{b.name}</span>
                      </div>
                    </td>
                    <td className={tdCls}>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                      </span>
                    </td>
                    <td className={`${tdCls} text-muted-foreground font-medium`}>{b.createdAt}</td>
                    <td className={tdCls}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditModal(b)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-blue-50 hover:text-blue-600 transition-colors">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button onClick={() => setDeleteModal({ id: b.id, name: b.name })}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors">
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
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className={['w-8 h-8 rounded-lg text-[13px] font-semibold transition-colors', page === n ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:bg-[#F4F5F7]'].join(' ')}>
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

      {editModal !== null && (
        <BrandModal
          initial={editModal === 'new' ? undefined : editModal as MBrand}
          onSave={handleSave}
          onClose={() => setEditModal(null)}
        />
      )}
      {deleteModal && (
        <DeleteModal name={deleteModal.name} onConfirm={handleDelete} onClose={() => setDeleteModal(null)} />
      )}
    </div>
  )
}
