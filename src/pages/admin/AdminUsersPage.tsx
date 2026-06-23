import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'active' | 'inactive'
type RoleName = 'Super Admin' | 'Shop Manager' | 'Accountant' | 'Support'

interface AdminUser {
  id: number; name: string; avatar: string
  phone: string; login: string
  role: RoleName; status: Status; createdAt: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const ROLES: RoleName[] = ['Super Admin', 'Shop Manager', 'Accountant', 'Support']

const roleConfig: Record<RoleName, { bg: string; text: string }> = {
  'Super Admin':  { bg: 'bg-violet-50',  text: 'text-violet-600' },
  'Shop Manager': { bg: 'bg-blue-50',    text: 'text-blue-600'   },
  'Accountant':   { bg: 'bg-amber-50',   text: 'text-amber-600'  },
  'Support':      { bg: 'bg-cyan-50',    text: 'text-cyan-600'   },
}

const statusConfig: Record<Status, { label: string; bg: string; text: string }> = {
  active:   { label: 'Active',   bg: 'bg-emerald-50', text: 'text-emerald-600' },
  inactive: { label: 'Inactive', bg: 'bg-red-50',     text: 'text-red-500'     },
}

const avatarColors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500']

const initialAdminUsers: AdminUser[] = [
  { id: 1,  name: 'Jasur Nazarov',     avatar: 'JN', phone: '+998 90 100 11 22', login: 'jasur.n',    role: 'Super Admin',  status: 'active',   createdAt: 'Jan 3, 2026'  },
  { id: 2,  name: 'Malika Yusupova',   avatar: 'MY', phone: '+998 91 200 22 33', login: 'malika.y',   role: 'Shop Manager', status: 'active',   createdAt: 'Jan 15, 2026' },
  { id: 3,  name: 'Sherzod Tursunov',  avatar: 'ST', phone: '+998 93 300 33 44', login: 'sherzod.t',  role: 'Accountant',   status: 'active',   createdAt: 'Feb 2, 2026'  },
  { id: 4,  name: 'Nargiza Karimova',  avatar: 'NK', phone: '+998 94 400 44 55', login: 'nargiza.k',  role: 'Support',      status: 'active',   createdAt: 'Feb 20, 2026' },
  { id: 5,  name: 'Bobur Ismoilov',    avatar: 'BI', phone: '+998 97 500 55 66', login: 'bobur.i',    role: 'Shop Manager', status: 'inactive', createdAt: 'Mar 8, 2026'  },
  { id: 6,  name: 'Dilrabo Xasanova',  avatar: 'DX', phone: '+998 90 600 66 77', login: 'dilrabo.x',  role: 'Accountant',   status: 'active',   createdAt: 'Mar 25, 2026' },
  { id: 7,  name: 'Eldor Rakhimov',    avatar: 'ER', phone: '+998 91 700 77 88', login: 'eldor.r',    role: 'Support',      status: 'inactive', createdAt: 'Apr 11, 2026' },
  { id: 8,  name: 'Kamola Mirzaeva',   avatar: 'KM', phone: '+998 93 800 88 99', login: 'kamola.m',   role: 'Shop Manager', status: 'active',   createdAt: 'Apr 28, 2026' },
  { id: 9,  name: 'Otabek Sobirov',    avatar: 'OS', phone: '+998 94 900 99 00', login: 'otabek.s',   role: 'Support',      status: 'active',   createdAt: 'May 14, 2026' },
  { id: 10, name: 'Zulfiya Nazarova',  avatar: 'ZN', phone: '+998 97 010 10 11', login: 'zulfiya.n',  role: 'Accountant',   status: 'active',   createdAt: 'Jun 1, 2026'  },
]

// ─── Hooks ────────────────────────────────────────────────────────────────────

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

// ─── Modal backdrop ───────────────────────────────────────────────────────────

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

// ─── Delete modal ─────────────────────────────────────────────────────────────

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
            <p className="text-[18px] font-extrabold text-foreground">Delete Admin User</p>
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

// ─── Form modal ───────────────────────────────────────────────────────────────

interface FormState { name: string; phone: string; login: string; password: string; role: RoleName; status: Status }

function FormModal({ user, onClose, onSave }: { user: AdminUser | null; onClose: () => void; onSave: (d: FormState) => void }) {
  const isEdit = user !== null
  const [form, setForm] = useState<FormState>({
    name: user?.name ?? '', phone: user?.phone ?? '',
    login: user?.login ?? '', password: '',
    role: user?.role ?? 'Support', status: user?.status ?? 'active',
  })
  const [roleOpen, setRoleOpen] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const roleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (roleRef.current && !roleRef.current.contains(e.target as Node)) setRoleOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const set = (k: keyof FormState) => (v: string) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-card rounded-2xl w-[600px] max-w-full overflow-hidden" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
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
              <p className="text-[16px] font-bold text-foreground">{isEdit ? 'Edit Admin User' : 'Add New Admin User'}</p>
              <p className="text-[12px] font-medium text-muted-foreground">{isEdit ? `Editing ${user.name}` : 'Fill in the details below'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (form.name.trim() && form.phone.trim() && form.login.trim()) onSave(form) }} className="p-6 flex flex-col gap-4">
          {/* Name + Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Full Name</label>
              <input type="text" value={form.name} onChange={(e) => set('name')(e.target.value)} placeholder="e.g. Jasur Nazarov" required
                className="w-full bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[13px] font-medium border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</label>
              <input type="text" value={form.phone} onChange={(e) => set('phone')(e.target.value)} placeholder="+998 90 000 00 00" required
                className="w-full bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[13px] font-medium border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
          </div>

          {/* Login + Password */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Login</label>
              <input type="text" value={form.login} onChange={(e) => set('login')(e.target.value)} placeholder="e.g. jasur.n" required
                className="w-full bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[13px] font-medium border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Password {isEdit && <span className="normal-case text-[10px] font-medium text-muted-foreground/60 ml-1">(leave blank to keep)</span>}
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => set('password')(e.target.value)}
                  placeholder={isEdit ? '••••••••' : 'Enter password'}
                  required={!isEdit}
                  className="w-full bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 pr-10 text-[13px] font-medium border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPass ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Role + Status */}
          <div className="grid grid-cols-2 gap-4">
            {/* Role dropdown — upward */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Role</label>
              <div ref={roleRef} className="relative">
                <button type="button" onClick={() => setRoleOpen((o) => !o)}
                  className={['w-full flex items-center justify-between bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[13px] font-medium border transition-all', roleOpen ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'].join(' ')}>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${roleConfig[form.role].bg} ${roleConfig[form.role].text}`}>{form.role}</span>
                  </div>
                  <svg className={['w-4 h-4 text-muted-foreground transition-transform shrink-0', roleOpen ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </button>
                {roleOpen && (
                  <div className="absolute bottom-full mb-1.5 left-0 right-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-10" style={{ boxShadow: '0 -8px 24px rgba(0,0,0,0.12)' }}>
                    {ROLES.map((r) => (
                      <button key={r} type="button" onClick={() => { set('role')(r); setRoleOpen(false) }}
                        className={['w-full flex items-center gap-2.5 px-4 py-2.5 transition-colors', form.role === r ? 'bg-primary/[0.08]' : 'hover:bg-[#F4F5F7]'].join(' ')}>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${roleConfig[r].bg} ${roleConfig[r].text}`}>{r}</span>
                        {form.role === r && <svg className="w-3.5 h-3.5 text-primary ml-auto shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Status toggle */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
              <div className="flex gap-2 h-[46px]">
                {(['active', 'inactive'] as Status[]).map((s) => (
                  <button key={s} type="button" onClick={() => set('status')(s)}
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
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl py-3 text-[13px] font-semibold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors">Cancel</button>
            <button type="submit" className="flex-1 rounded-xl py-3 text-[13px] font-semibold bg-primary text-white hover:bg-primary-hover active:scale-[0.98] transition-all" style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
              {isEdit ? 'Save Changes' : 'Add Admin User'}
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  )
}

// ─── Page-size dropdown ───────────────────────────────────────────────────────

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

// ─── Status filter dropdown ───────────────────────────────────────────────────

type StatusFilter = 'all' | 'active' | 'inactive'
type RoleFilter = 'all' | RoleName

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

function RoleFilterDropdown({ value, onChange }: { value: RoleFilter; onChange: (v: RoleFilter) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const options: { value: RoleFilter; label: string }[] = [
    { value: 'all', label: 'All Roles' },
    ...ROLES.map((r) => ({ value: r as RoleFilter, label: r })),
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
        {value !== 'all' && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${roleConfig[value as RoleName].bg} ${roleConfig[value as RoleName].text}`}>{value}</span>}
        {value === 'all' && current.label}
        <svg className={['w-4 h-4 transition-transform', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 right-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-20 min-w-[180px]" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {options.map((opt) => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }}
              className={['w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors', opt.value === value ? 'bg-primary/[0.08] text-primary font-semibold' : 'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>
              {opt.value !== 'all'
                ? <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${roleConfig[opt.value as RoleName].bg} ${roleConfig[opt.value as RoleName].text}`}>{opt.label}</span>
                : <span className="text-[13px]">{opt.label}</span>}
              {opt.value === value && <svg className="w-3.5 h-3.5 text-primary ml-auto shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, iconBg, icon }: { label: string; value: number; iconBg: string; icon: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-black/[0.06] p-5 flex items-center justify-between" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div className="flex flex-col gap-1.5">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-[26px] font-extrabold text-foreground leading-none">{value}<span className="text-[16px] font-semibold text-muted-foreground ml-1.5">ta</span></p>
      </div>
      <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
        <span className="w-5 h-5 text-white">{icon}</span>
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ModalState =
  | { kind: 'edit'; user: AdminUser }
  | { kind: 'delete'; user: AdminUser }
  | { kind: 'create' }
  | null

export default function AdminUsersPage() {
  const [users, setUsers]         = useState<AdminUser[]>(initialAdminUsers)
  const [modal, setModal]         = useState<ModalState>(null)
  const [page, setPage]           = useState(1)
  const [pageSize, setPageSize]   = useState(20)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [roleFilter, setRoleFilter]     = useState<RoleFilter>('all')

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase()
    return (
      (statusFilter === 'all' || u.status === statusFilter) &&
      (roleFilter === 'all' || u.role === roleFilter) &&
      (!q || u.name.toLowerCase().includes(q) || u.phone.includes(q) || u.login.toLowerCase().includes(q))
    )
  })
  const pageCount = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const handleSearch = (v: string) => { setSearch(v); setPage(1) }
  const handleStatus = (v: StatusFilter) => { setStatusFilter(v); setPage(1) }
  const handleRole   = (v: RoleFilter)   => { setRoleFilter(v);   setPage(1) }

  const handleSave = (d: FormState) => {
    if (modal?.kind === 'edit') {
      setUsers((prev) => prev.map((u) => u.id === modal.user.id ? { ...u, ...d } : u))
    } else {
      const newUser: AdminUser = {
        id: Date.now(), avatar: d.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase(),
        createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        ...d,
      }
      setUsers((prev) => [newUser, ...prev])
    }
    setModal(null)
  }

  const handleDelete = () => {
    if (modal?.kind === 'delete') {
      setUsers((prev) => prev.filter((u) => u.id !== modal.user.id))
      setModal(null)
    }
  }

  const total    = users.length
  const active   = users.filter((u) => u.status === 'active').length
  const inactive = total - active

  // Pagination range
  const delta = 2
  const start = Math.max(1, page - delta)
  const end   = Math.min(pageCount, page + delta)
  const range = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Admin Users</h1>
        <p className="text-[13px] font-medium text-muted-foreground mt-0.5">Manage admin accounts and their roles</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total" value={total} iconBg="bg-primary" icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        } />
        <StatCard label="Active" value={active} iconBg="bg-emerald-500" icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <polyline points="16 11 18 13 22 9" />
          </svg>
        } />
        <StatCard label="Inactive" value={inactive} iconBg="bg-red-500" icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <line x1="17" y1="8" x2="23" y2="14" /><line x1="23" y1="8" x2="17" y2="14" />
          </svg>
        } />
      </div>

      {/* Table card */}
      <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-black/[0.06] flex items-center gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search by name, login, phone…"
              className="w-full h-9 pl-9 pr-8 bg-[#F4F5F7] rounded-xl text-[13px] font-medium text-foreground border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            {search && (
              <button onClick={() => handleSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors">
                <svg className="w-2.5 h-2.5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <RoleFilterDropdown value={roleFilter} onChange={handleRole} />
          <StatusFilterDropdown value={statusFilter} onChange={handleStatus} />
          <div className="w-px h-6 bg-black/[0.08] shrink-0" />
          <button onClick={() => setModal({ kind: 'create' })}
            className="bg-primary text-white rounded-xl px-4 py-2 text-[13px] font-semibold hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center gap-1.5 shrink-0"
            style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Admin User
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.05]">
                {['Admin User', 'Phone', 'Login', 'Role', 'Status', 'Created At', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <p className="text-[13px] font-semibold text-muted-foreground">No results match your search</p>
                    <button onClick={() => { handleSearch(''); handleStatus('all'); handleRole('all') }} className="text-[12px] font-semibold text-primary hover:underline">Clear filters</button>
                  </div>
                </td></tr>
              ) : paginated.map((u) => {
                const idx = filtered.indexOf(u)
                const sc  = statusConfig[u.status]
                const rc  = roleConfig[u.role]
                const ab  = avatarColors[idx % avatarColors.length]
                return (
                  <tr key={u.id} className="border-b border-black/[0.04] hover:bg-[#F4F5F7]/70 transition-colors last:border-0">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-bold ${ab}`}>{u.avatar}</span>
                        <span className="text-[13px] font-semibold text-foreground whitespace-nowrap">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-medium text-foreground">{u.phone}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-[12px] font-mono font-semibold text-muted-foreground bg-[#F4F5F7] px-2 py-0.5 rounded-lg">{u.login}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl ${rc.bg} ${rc.text}`}>{u.role}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl ${sc.bg} ${sc.text}`}>{sc.label}</span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-medium text-muted-foreground">{u.createdAt}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button title="Edit" onClick={() => setModal({ kind: 'edit', user: u })} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" /></svg>
                        </button>
                        <button title="Delete" onClick={() => setModal({ kind: 'delete', user: u })} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

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

      {/* Modals */}
      {modal?.kind === 'edit'   && <FormModal user={modal.user} onClose={() => setModal(null)} onSave={handleSave} />}
      {modal?.kind === 'create' && <FormModal user={null}       onClose={() => setModal(null)} onSave={handleSave} />}
      {modal?.kind === 'delete' && <DeleteModal name={modal.user.name} onClose={() => setModal(null)} onConfirm={handleDelete} />}
    </div>
  )
}
