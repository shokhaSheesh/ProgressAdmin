import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import {
  useBrands, addModel, updateModel, deleteModel,
} from '../../data/brandsStore'
import type { BrandModel, BrandModelInput } from '../../data/brandsStore'
import { BrandAvatar } from './BrandsPage'

const statusConfig = {
  active:   { label: 'Active',   bg: 'bg-emerald-50', text: 'text-emerald-600' },
  inactive: { label: 'Inactive', bg: 'bg-red-50',     text: 'text-red-500'     },
}

function ModelAvatar({ logo, name, size = 36 }: { logo: string; name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (logo) {
    return (
      <img src={logo} alt={name} style={{ width: size, height: size }}
        className="rounded-xl object-contain bg-[#F4F5F7] shrink-0" />
    )
  }
  return (
    <div style={{ width: size, height: size }}
      className="rounded-xl shrink-0 flex items-center justify-center text-[11px] font-bold bg-slate-100 text-slate-500">
      {initials || '?'}
    </div>
  )
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
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
            <p className="text-[18px] font-extrabold text-foreground">Delete Model</p>
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

function LogoUpload({ logo, name, onChange }: { logo: string; name: string; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => onChange(e.target?.result as string)
    reader.readAsDataURL(file)
  }
  return (
    <div className="flex items-center gap-4">
      <div className="w-[72px] h-[72px] rounded-2xl border-2 border-black/[0.08] bg-[#F4F5F7] flex items-center justify-center overflow-hidden shrink-0">
        {logo
          ? <img src={logo} alt="logo" className="w-full h-full object-contain" />
          : name.trim()
            ? <span className="text-[16px] font-bold text-muted-foreground">{name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</span>
            : <svg className="w-6 h-6 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
        }
      </div>
      <div className="flex-1">
        <div
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleFile(f) }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-black/[0.10] rounded-xl p-4 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
          <p className="text-[12px] font-semibold text-muted-foreground">Drop image here or <span className="text-primary">browse</span></p>
          <p className="text-[11px] font-medium text-muted-foreground/70 mt-0.5">PNG, JPG, SVG up to 2 MB</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        {logo && (
          <button type="button" onClick={() => onChange('')}
            className="mt-2 text-[11px] font-semibold text-red-500 hover:text-red-600 transition-colors">
            Remove logo
          </button>
        )}
      </div>
    </div>
  )
}

function ModelFormModal({
  brandId, model, onClose,
}: { brandId: number; model: BrandModel | null; onClose: () => void }) {
  const isEdit = model !== null
  const [form, setForm] = useState<BrandModelInput>({
    name: model?.name ?? '',
    logo: model?.logo ?? '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    if (isEdit) {
      updateModel(brandId, model.id, form)
    } else {
      addModel(brandId, form)
    }
    onClose()
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-card rounded-2xl w-[480px] max-w-full overflow-hidden" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
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
              <p className="text-[16px] font-bold text-foreground">{isEdit ? 'Edit Model' : 'Add New Model'}</p>
              <p className="text-[12px] font-medium text-muted-foreground">{isEdit ? `Editing ${model.name}` : 'Fill in the details below'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Model Logo</label>
            <LogoUpload logo={form.logo} name={form.name} onChange={(v) => setForm(p => ({ ...p, logo: v }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Model Name <span className="text-red-400">*</span></label>
            <input
              type="text" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Bosch Professional" required autoFocus
              className="w-full bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[13px] font-medium border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl py-3 text-[13px] font-semibold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors">Cancel</button>
            <button type="submit" className="flex-1 rounded-xl py-3 text-[13px] font-semibold bg-primary text-white hover:bg-primary-hover active:scale-[0.98] transition-all" style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
              {isEdit ? 'Save Changes' : 'Add Model'}
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  )
}

type ModalState =
  | { kind: 'create' }
  | { kind: 'edit'; model: BrandModel }
  | { kind: 'delete'; model: BrandModel }
  | null

export default function BrandDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const brands = useBrands()
  const brand = brands.find(b => b.id === Number(id))

  const [modal, setModal]   = useState<ModalState>(null)
  const [search, setSearch] = useState('')

  if (!brand) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-4 h-full text-center">
        <svg className="w-12 h-12 text-muted-foreground/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-[16px] font-bold text-foreground">Brand not found</p>
        <button onClick={() => navigate('/admin/brands')} className="text-[13px] font-semibold text-primary hover:underline">← Back to Brands</button>
      </div>
    )
  }

  const sc = statusConfig[brand.status]
  const filtered = brand.models.filter(m =>
    !search.trim() || m.name.toLowerCase().includes(search.trim().toLowerCase())
  )

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/admin/brands')}
          className="w-9 h-9 mt-0.5 rounded-xl flex items-center justify-center text-muted-foreground border border-black/[0.08] hover:bg-[#F4F5F7] hover:text-foreground transition-all shrink-0">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <BrandAvatar logo={brand.logo} name={brand.name} size={52} />
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">{brand.name}</h1>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl ${sc.bg} ${sc.text}`}>{sc.label}</span>
            </div>
            <p className="text-[13px] font-medium text-muted-foreground mt-0.5">
              {brand.models.length} model{brand.models.length !== 1 ? 's' : ''} · Added {brand.createdAt}
            </p>
          </div>
        </div>
      </div>

      {/* Models table */}
      <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-black/[0.06] flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[14px] font-bold text-foreground">Models</p>
            <p className="text-[12px] font-medium text-muted-foreground">All models under {brand.name}</p>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search models…"
              className="w-52 h-9 pl-9 pr-8 bg-[#F4F5F7] rounded-xl text-[13px] font-medium text-foreground border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors">
                <svg className="w-2.5 h-2.5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <div className="w-px h-6 bg-black/[0.08] shrink-0" />
          <button onClick={() => setModal({ kind: 'create' })}
            className="bg-primary text-white rounded-xl px-4 py-2 text-[13px] font-semibold hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center gap-1.5 shrink-0"
            style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Model
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-16 flex flex-col items-center gap-3 text-center">
            {search ? (
              <>
                <svg className="w-8 h-8 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p className="text-[13px] font-semibold text-muted-foreground">No models match your search</p>
                <button onClick={() => setSearch('')} className="text-[12px] font-semibold text-primary hover:underline">Clear search</button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-[#F4F5F7] flex items-center justify-center">
                  <svg className="w-7 h-7 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                  </svg>
                </div>
                <div>
                  <p className="text-[14px] font-bold text-foreground">No models yet</p>
                  <p className="text-[13px] font-medium text-muted-foreground mt-0.5">Add the first model for {brand.name}</p>
                </div>
                <button onClick={() => setModal({ kind: 'create' })}
                  className="mt-1 bg-primary text-white rounded-xl px-5 py-2.5 text-[13px] font-semibold hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center gap-1.5"
                  style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  Add Model
                </button>
              </>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.05]">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-12">#</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Model</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Added At</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((model, i) => (
                <tr key={model.id} className="border-b border-black/[0.04] hover:bg-[#F4F5F7]/70 transition-colors last:border-0">
                  <td className="px-5 py-3.5 text-[13px] font-medium text-muted-foreground">{i + 1}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <ModelAvatar logo={model.logo} name={model.name} />
                      <span className="text-[14px] font-semibold text-foreground">{model.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] font-medium text-muted-foreground">{model.createdAt}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button title="Edit" onClick={() => setModal({ kind: 'edit', model })}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" />
                        </svg>
                      </button>
                      <button title="Delete" onClick={() => setModal({ kind: 'delete', model })}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal?.kind === 'create' && <ModelFormModal brandId={brand.id} model={null} onClose={() => setModal(null)} />}
      {modal?.kind === 'edit'   && <ModelFormModal brandId={brand.id} model={modal.model} onClose={() => setModal(null)} />}
      {modal?.kind === 'delete' && (
        <DeleteModal name={modal.model.name} onClose={() => setModal(null)} onConfirm={() => { deleteModel(brand.id, modal.model.id); setModal(null) }} />
      )}
    </div>
  )
}
