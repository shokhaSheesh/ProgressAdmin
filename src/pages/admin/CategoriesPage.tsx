import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { callGateway, gatewayList, methods } from '../../api/gateway'

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'active' | 'inactive'
type Lang   = 'uz' | 'ru' | 'en'

interface Category {
  id: string
  parentId: string | null
  nameUz: string; nameRu: string; nameEn: string
  status: Status
  createdAt: string
}

interface CategoryRow {
  guid: string
  name?: string
  name_uz?: string
  name_ru?: string
  name_en?: string
  categories_id?: string | null
  is_active?: boolean
  created_at?: string
}

interface CategoryListResponse {
  categories?: CategoryRow[]
  data?: CategoryRow[]
}

const LANGS: { key: Lang; label: string; flag: string }[] = [
  { key: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
  { key: 'ru', label: 'Русский',   flag: '🇷🇺' },
  { key: 'en', label: 'English',   flag: '🇬🇧' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusConfig: Record<Status, { label: string; bg: string; text: string; dot: string }> = {
  active:   { label: 'Active',   bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  inactive: { label: 'Inactive', bg: 'bg-red-50',     text: 'text-red-500',     dot: 'bg-red-400'     },
}

const primaryName = (c: Category) => c.nameEn || c.nameRu || c.nameUz

function formatDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function mapCategory(row: CategoryRow): Category {
  const name = row.name || ''
  return {
    id: row.guid,
    parentId: row.categories_id || null,
    nameUz: row.name_uz || name,
    nameRu: row.name_ru || name,
    nameEn: row.name_en || name,
    status: row.is_active === false ? 'inactive' : 'active',
    createdAt: formatDate(row.created_at),
  }
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
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>,
    document.body,
  )
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({ name, childCount, busy, onClose, onConfirm }: {
  name: string; childCount: number; busy?: boolean; onClose: () => void; onConfirm: () => void
}) {
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
            <p className="text-[18px] font-extrabold text-foreground">Delete Category</p>
            <p className="text-[13px] font-medium text-muted-foreground mt-2 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-foreground">{name}</span>?
              {childCount > 0 && (
                <span className="block mt-1 text-amber-600 font-semibold">
                  This will also delete {childCount} sub-categor{childCount === 1 ? 'y' : 'ies'}.
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-3 px-8 pb-8">
          <button onClick={onClose} disabled={busy} className="flex-1 rounded-xl py-3 text-[13px] font-semibold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors disabled:opacity-50">Cancel</button>
          <button onClick={onConfirm} disabled={busy} className="flex-1 rounded-xl py-3 text-[13px] font-semibold bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] transition-all disabled:opacity-50" style={{ boxShadow: '0 2px 8px rgba(239,68,68,0.3)' }}>{busy ? 'Deleting...' : 'Yes, Delete'}</button>
        </div>
      </div>
    </ModalBackdrop>
  )
}

// ─── Form Modal ───────────────────────────────────────────────────────────────

interface FormState { nameUz: string; nameRu: string; nameEn: string; status: Status; parentId: string | null }

function FormModal({ category, categories, busy, onClose, onSave }: {
  category: Category | null
  categories: Category[]
  busy?: boolean
  onClose: () => void
  onSave: (d: FormState) => void | Promise<void>
}) {
  const isEdit = category !== null
  const [form, setForm] = useState<FormState>({
    nameUz:   category?.nameUz   ?? '',
    nameRu:   category?.nameRu   ?? '',
    nameEn:   category?.nameEn   ?? '',
    status:   category?.status   ?? 'active',
    parentId: category?.parentId ?? null,
  })
  const [lang, setLang] = useState<Lang>('uz')

  const fieldKey: Record<Lang, keyof FormState> = { uz: 'nameUz', ru: 'nameRu', en: 'nameEn' }
  const filled: Record<Lang, boolean> = {
    uz: form.nameUz.trim() !== '',
    ru: form.nameRu.trim() !== '',
    en: form.nameEn.trim() !== '',
  }
  const valid = filled.uz && filled.ru && filled.en

  // Parent options: all categories except the one being edited and its descendants
  function getDescendantIds(id: string): string[] {
    const children = categories.filter(c => c.parentId === id)
    return [id, ...children.flatMap(c => getDescendantIds(c.id))]
  }
  const excludeIds = isEdit ? new Set(getDescendantIds(category.id)) : new Set<string>()
  const parentOptions = categories.filter(c => !excludeIds.has(c.id))

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-card rounded-2xl w-[500px] max-w-full overflow-hidden" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
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
              <p className="text-[16px] font-bold text-foreground">{isEdit ? 'Edit Category' : 'Add New Category'}</p>
              <p className="text-[12px] font-medium text-muted-foreground">{isEdit ? `Editing ${primaryName(category)}` : 'Fill in the details below'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={e => { e.preventDefault(); if (valid) onSave(form) }} className="p-6 flex flex-col gap-4">

          {/* Parent Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Parent Category <span className="normal-case font-medium">(optional)</span></label>
            <div className="relative">
              <select value={form.parentId ?? ''} onChange={e => setForm(p => ({ ...p, parentId: e.target.value || null }))}
                className="w-full appearance-none bg-[#F4F5F7] text-foreground rounded-xl px-4 py-2.5 pr-9 text-[13px] font-medium border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                <option value="">— None (root category) —</option>
                {parentOptions.map(c => (
                  <option key={c.id} value={c.id}>{primaryName(c)}</option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </div>
          </div>

          {/* Name with language tabs */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Name</label>
            <div className="flex items-center gap-1 p-1 bg-[#F4F5F7] rounded-xl">
              {LANGS.map(l => (
                <button key={l.key} type="button" onClick={() => setLang(l.key)}
                  className={['flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold transition-all',
                    lang === l.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'].join(' ')}>
                  <span className="text-[13px] leading-none">{l.flag}</span>
                  {l.key.toUpperCase()}
                  {filled[l.key] && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                </button>
              ))}
            </div>
            {LANGS.map(l => lang === l.key && (
              <input key={l.key} type="text" autoFocus
                value={form[fieldKey[l.key]] as string}
                onChange={e => setForm(p => ({ ...p, [fieldKey[l.key]]: e.target.value }))}
                placeholder={`Category name in ${l.label}`}
                className="w-full bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[13px] font-medium border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            ))}
            <p className="text-[11px] font-medium text-muted-foreground">Provide the name in all three languages.</p>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
            <div className="flex gap-2 h-[46px]">
              {(['active', 'inactive'] as Status[]).map(s => (
                <button key={s} type="button" onClick={() => setForm(p => ({ ...p, status: s }))}
                  className={['flex-1 flex items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold border-2 transition-all',
                    form.status === s
                      ? s === 'active' ? 'bg-emerald-50 border-emerald-400 text-emerald-600' : 'bg-red-50 border-red-400 text-red-500'
                      : 'bg-[#F4F5F7] border-transparent text-muted-foreground hover:border-black/10'].join(' ')}>
                  <span className={['w-2 h-2 rounded-full shrink-0', form.status === s ? (s === 'active' ? 'bg-emerald-500' : 'bg-red-400') : 'bg-muted-foreground/30'].join(' ')} />
                  {s === 'active' ? 'Active' : 'Inactive'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={busy} className="flex-1 rounded-xl py-3 text-[13px] font-semibold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={!valid || busy}
              className="flex-1 rounded-xl py-3 text-[13px] font-semibold bg-primary text-white hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
              {busy ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  )
}

// ─── Status filter dropdown ───────────────────────────────────────────────────

type StatusFilter = 'all' | 'active' | 'inactive'

function StatusFilterDropdown({ value, onChange }: { value: StatusFilter; onChange: (v: StatusFilter) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const options: { value: StatusFilter; label: string; dot?: string }[] = [
    { value: 'all',      label: 'All Statuses' },
    { value: 'active',   label: 'Active',   dot: 'bg-emerald-500' },
    { value: 'inactive', label: 'Inactive', dot: 'bg-red-500' },
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
        <svg className={['w-4 h-4 transition-transform', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 right-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-20 min-w-[160px]" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {options.map(opt => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }}
              className={['w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors',
                opt.value === value ? 'bg-primary/[0.08] text-primary font-semibold' : 'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>
              {opt.dot
                ? <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} />
                : <span className="w-2 h-2 rounded-full shrink-0 border-2 border-black/20" />}
              {opt.label}
              {opt.value === value && <svg className="w-3.5 h-3.5 text-primary ml-auto shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tree view ────────────────────────────────────────────────────────────────

interface TreeRowProps {
  category: Category
  categories: Category[]
  depth: number
  expanded: Set<string>
  onToggle: (id: string) => void
  onEdit: (c: Category) => void
  onDelete: (c: Category) => void
}

function TreeRow({ category, categories, depth, expanded, onToggle, onEdit, onDelete }: TreeRowProps) {
  const children  = categories.filter(c => c.parentId === category.id)
  const hasKids   = children.length > 0
  const isOpen    = expanded.has(category.id)
  const sc        = statusConfig[category.status]

  return (
    <>
      <tr className="border-b border-black/[0.04] hover:bg-[#FAFAFA] transition-colors last:border-0">
        <td className="px-5 py-3.5">
          <div className="flex items-center" style={{ paddingLeft: depth * 24 }}>
            {/* Expand toggle */}
            <button
              onClick={() => hasKids && onToggle(category.id)}
              className={['w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mr-2 transition-colors',
                hasKids ? 'text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground cursor-pointer' : 'cursor-default opacity-0'].join(' ')}>
              <svg className={['w-3.5 h-3.5 transition-transform', isOpen ? 'rotate-90' : ''].join(' ')}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            {/* Folder icon */}
            <span className={['w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mr-2.5',
              depth === 0 ? 'bg-blue-100' : 'bg-[#F4F5F7]'].join(' ')}>
              <svg className={['w-3.5 h-3.5', depth === 0 ? 'text-blue-600' : 'text-muted-foreground'].join(' ')}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </span>

            <div>
              <p className="text-[13px] font-semibold text-foreground">{category.nameEn}</p>
              <p className="text-[11px] font-medium text-muted-foreground">
                <span className="text-muted-foreground/60">UZ</span> {category.nameUz}
                <span className="mx-1 text-muted-foreground/40">·</span>
                <span className="text-muted-foreground/60">RU</span> {category.nameRu}
              </p>
            </div>
          </div>
        </td>
        <td className="px-5 py-3.5">
          {hasKids && (
            <span className="text-[11px] font-semibold text-muted-foreground bg-[#F4F5F7] px-2 py-0.5 rounded-md">
              {children.length} sub
            </span>
          )}
        </td>
        <td className="px-5 py-3.5">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold ${sc.bg} ${sc.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
          </span>
        </td>
        <td className="px-5 py-3.5 text-[13px] font-medium text-muted-foreground">{category.createdAt}</td>
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-1 justify-end">
            <button onClick={() => onEdit(category)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" /></svg>
            </button>
            <button onClick={() => onDelete(category)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
            </button>
          </div>
        </td>
      </tr>
      {isOpen && children.map(child => (
        <TreeRow key={child.id} category={child} categories={categories} depth={depth + 1}
          expanded={expanded} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ViewMode  = 'table' | 'tree'
type ModalState = { kind: 'edit'; category: Category } | { kind: 'delete'; category: Category } | { kind: 'create' } | null

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
        <svg className={['w-3.5 h-3.5 transition-transform', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <div className="absolute bottom-full mb-1.5 left-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-20 min-w-[72px]" style={{ boxShadow: '0 -6px 20px rgba(0,0,0,0.12)' }}>
          {PAGE_SIZES.map(s => (
            <button key={s} onClick={() => { onChange(s); setOpen(false) }}
              className={['w-full text-center px-4 py-2 text-[12px] font-semibold transition-colors',
                s === value ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [modal, setModal]           = useState<ModalState>(null)
  const [viewMode, setViewMode]     = useState<ViewMode>('table')
  const [page, setPage]             = useState(1)
  const [pageSize, setPageSize]     = useState(20)
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expanded, setExpanded]     = useState<Set<string>>(new Set())
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  async function loadCategories() {
    setLoading(true)
    setError('')
    try {
      const response = await gatewayList<CategoryListResponse>(methods.categories.list, { page: 1, limit: 500 })
      const rows = response.categories || response.data || []
      const mapped = rows.filter(row => row.guid).map(mapCategory)
      setCategories(mapped)
      setExpanded(prev => prev.size ? prev : new Set(mapped.filter(c => c.parentId === null).map(c => c.id)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCategories()
  }, [])

  function toggleExpanded(id: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function expandAll()   { setExpanded(new Set(categories.map(c => c.id))) }
  function collapseAll() { setExpanded(new Set()) }

  // ── Table view data ──
  const filtered = categories.filter(c => {
    const q = search.trim().toLowerCase()
    return (statusFilter === 'all' || c.status === statusFilter) &&
      (!q || c.nameEn.toLowerCase().includes(q) || c.nameRu.toLowerCase().includes(q) || c.nameUz.toLowerCase().includes(q))
  })
  const pageCount = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const handleSearch = (v: string) => { setSearch(v); setPage(1) }
  const handleFilter = (v: StatusFilter) => { setStatusFilter(v); setPage(1) }

  // ── Tree view data (roots only — children rendered recursively) ──
  const treeRoots = categories.filter(c => c.parentId === null &&
    (statusFilter === 'all' || c.status === statusFilter) &&
    (() => {
      const q = search.trim().toLowerCase()
      return !q || c.nameEn.toLowerCase().includes(q) || c.nameRu.toLowerCase().includes(q) || c.nameUz.toLowerCase().includes(q)
    })()
  )

  // ── Counts ──
  const rootCount = categories.filter(c => c.parentId === null).length
  const subCount  = categories.filter(c => c.parentId !== null).length

  function getDescendantIds(id: string): string[] {
    const children = categories.filter(c => c.parentId === id)
    return [id, ...children.flatMap(c => getDescendantIds(c.id))]
  }

  const handleSave = async (d: FormState) => {
    const name = d.nameEn.trim() || d.nameRu.trim() || d.nameUz.trim()
    if (!name) return
    setSaving(true)
    setError('')
    try {
      const payload: Record<string, unknown> = {
        name,
        name_uz: d.nameUz.trim(),
        name_ru: d.nameRu.trim(),
        name_en: d.nameEn.trim(),
        categories_id: d.parentId,
        status: d.status,
      }
      if (modal?.kind === 'edit') {
        await callGateway(methods.categories.update, { ...payload, guid: modal.category.id })
      } else {
        await callGateway(methods.categories.create, payload)
      }
      setModal(null)
      await loadCategories()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (modal?.kind !== 'delete') return
    setSaving(true)
    setError('')
    try {
      const ids = getDescendantIds(modal.category.id).reverse()
      for (const id of ids) {
        await callGateway(methods.categories.delete, { guid: id })
      }
      setModal(null)
      await loadCategories()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete category')
    } finally {
      setSaving(false)
    }
  }

  const thCls = 'px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap'

  const ActionButtons = ({ category }: { category: Category }) => (
    <div className="flex items-center gap-1 justify-end">
      <button onClick={() => setModal({ kind: 'edit', category })} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" /></svg>
      </button>
      <button onClick={() => setModal({ kind: 'delete', category })} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
      </button>
    </div>
  )

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Categories</h1>
        <p className="text-[13px] font-medium text-muted-foreground mt-0.5">Manage product categories and sub-categories in all languages</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-600 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => void loadCategories()} className="text-[12px] font-bold text-red-700 hover:underline">Retry</button>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Total Categories', value: categories.length,
            icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><path d="M3 17.5A3.5 3.5 0 0 0 6.5 21M3 14v.01" /><path d="M7 14a3 3 0 0 1 3 3v4" /></svg>,
            iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
          },
          {
            label: 'Root Categories', value: rootCount,
            icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>,
            iconBg: 'bg-violet-100', iconColor: 'text-violet-600',
          },
          {
            label: 'Sub-categories', value: subCount,
            icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h2M3 12h8M3 19h14M9 5l4 7-4 7" /></svg>,
            iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600',
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

      {/* Table card */}
      <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-black/[0.06] flex items-center gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input type="text" value={search} onChange={e => handleSearch(e.target.value)} placeholder="Search by category name…"
              className="w-full h-9 pl-9 pr-8 bg-[#F4F5F7] rounded-xl text-[13px] font-medium text-foreground border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            {search && (
              <button onClick={() => handleSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors">
                <svg className="w-2.5 h-2.5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          <StatusFilterDropdown value={statusFilter} onChange={handleFilter} />

          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 bg-[#F4F5F7] rounded-xl shrink-0">
            {([
              { mode: 'table' as ViewMode, icon: <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>, title: 'Table view' },
              { mode: 'tree'  as ViewMode, icon: <><path d="M3 5h2M3 12h8M3 19h14M9 5l4 7-4 7" /></>,                                                                                                                                                                                         title: 'Tree view'  },
            ]).map(({ mode, icon, title }) => (
              <button key={mode} title={title} onClick={() => setViewMode(mode)}
                className={['w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                  viewMode === mode ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'].join(' ')}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
              </button>
            ))}
          </div>

          {/* Tree expand/collapse */}
          {viewMode === 'tree' && (
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={expandAll} className="h-9 px-3 rounded-xl text-[12px] font-semibold border border-black/[0.08] text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-colors whitespace-nowrap">Expand all</button>
              <button onClick={collapseAll} className="h-9 px-3 rounded-xl text-[12px] font-semibold border border-black/[0.08] text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-colors whitespace-nowrap">Collapse</button>
            </div>
          )}

          <div className="w-px h-6 bg-black/[0.08] shrink-0" />
          <button onClick={() => setModal({ kind: 'create' })}
            className="bg-primary text-white rounded-xl px-4 py-2 text-[13px] font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center gap-1.5 shrink-0"
            style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Category
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8F9FB] border-b border-black/[0.06]">
              <tr>
                {viewMode === 'table' && <th className={thCls + ' w-12'}>#</th>}
                <th className={thCls}>Name</th>
                {viewMode === 'tree' && <th className={thCls}>Sub-categories</th>}
                <th className={thCls}>Status</th>
                <th className={thCls}>Created At</th>
                <th className={thCls + ' text-right'}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={viewMode === 'table' ? 5 : 4} className="px-5 py-16 text-center">
                  <p className="text-[13px] font-semibold text-muted-foreground">Loading categories...</p>
                </td></tr>
              )}

              {/* ── Table view ── */}
              {!loading && viewMode === 'table' && (
                paginated.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                      <p className="text-[13px] font-semibold text-muted-foreground">No results match your search</p>
                      <button onClick={() => { handleSearch(''); handleFilter('all') }} className="text-[12px] font-semibold text-primary hover:underline">Clear filters</button>
                    </div>
                  </td></tr>
                ) : paginated.map((category, i) => {
                  const sc = statusConfig[category.status]
                  const parent = category.parentId ? categories.find(c => c.id === category.parentId) : null
                  return (
                    <tr key={category.id} className="border-b border-black/[0.04] hover:bg-[#F4F5F7]/70 transition-colors last:border-0">
                      <td className="px-5 py-3.5 text-[13px] font-medium text-muted-foreground">{(page - 1) * pageSize + i + 1}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-semibold text-foreground">{category.nameEn}</span>
                            {parent && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-[#F4F5F7] px-2 py-0.5 rounded-md">
                                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                                {primaryName(parent)}
                              </span>
                            )}
                          </div>
                          <span className="text-[12px] font-medium text-muted-foreground">
                            <span className="text-muted-foreground/60">UZ</span> {category.nameUz}
                            <span className="mx-1.5 text-muted-foreground/40">·</span>
                            <span className="text-muted-foreground/60">RU</span> {category.nameRu}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold ${sc.bg} ${sc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] font-medium text-muted-foreground">{category.createdAt}</td>
                      <td className="px-5 py-3.5"><ActionButtons category={category} /></td>
                    </tr>
                  )
                })
              )}

              {/* ── Tree view ── */}
              {!loading && viewMode === 'tree' && (
                treeRoots.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                      <p className="text-[13px] font-semibold text-muted-foreground">No results match your search</p>
                      <button onClick={() => { handleSearch(''); handleFilter('all') }} className="text-[12px] font-semibold text-primary hover:underline">Clear filters</button>
                    </div>
                  </td></tr>
                ) : treeRoots.map(root => (
                  <TreeRow key={root.id} category={root} categories={categories} depth={0}
                    expanded={expanded} onToggle={toggleExpanded}
                    onEdit={c => setModal({ kind: 'edit', category: c })}
                    onDelete={c => setModal({ kind: 'delete', category: c })} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer (table view only) */}
        {viewMode === 'table' && (
          <div className="px-5 py-4 border-t border-black/[0.06] flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-medium text-muted-foreground">
                Showing {filtered.length === 0 ? 0 : Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-muted-foreground">Rows per page:</span>
                <PageSizeDropdown value={pageSize} onChange={s => { setPageSize(s); setPage(1) }} />
              </div>
            </div>
            <div className="flex items-center gap-1">
              {(() => {
                const delta = 2
                const pStart = Math.max(1, page - delta)
                const pEnd   = Math.min(pageCount, page + delta)
                const range  = Array.from({ length: pEnd - pStart + 1 }, (_, i) => pStart + i)
                return <>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                  </button>
                  {range[0] > 1 && (<><button onClick={() => setPage(1)} className="w-8 h-8 rounded-lg text-[13px] font-semibold text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">1</button>{range[0] > 2 && <span className="w-8 h-8 flex items-center justify-center text-[13px] text-muted-foreground">…</span>}</>)}
                  {range.map(p => <button key={p} onClick={() => setPage(p)} className={['w-8 h-8 rounded-lg text-[13px] font-semibold transition-all', p === page ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground'].join(' ')}>{p}</button>)}
                  {range[range.length - 1] < pageCount && (<>{range[range.length - 1] < pageCount - 1 && <span className="w-8 h-8 flex items-center justify-center text-[13px] text-muted-foreground">…</span>}<button onClick={() => setPage(pageCount)} className="w-8 h-8 rounded-lg text-[13px] font-semibold text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">{pageCount}</button></>)}
                  <button onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount || pageCount === 0} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                </>
              })()}
            </div>
          </div>
        )}
      </div>

      {modal?.kind === 'edit'   && <FormModal category={modal.category} categories={categories} busy={saving} onClose={() => setModal(null)} onSave={handleSave} />}
      {modal?.kind === 'create' && <FormModal category={null}           categories={categories} busy={saving} onClose={() => setModal(null)} onSave={handleSave} />}
      {modal?.kind === 'delete' && (
        <DeleteModal
          name={primaryName(modal.category)}
          childCount={categories.filter(c => c.parentId === modal.category.id).length}
          busy={saving}
          onClose={() => setModal(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}
