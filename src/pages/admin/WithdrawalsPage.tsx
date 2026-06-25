import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

// ─── Types ────────────────────────────────────────────────────────────────────

type CashStatus = 'pending' | 'out_for_delivery' | 'completed'

interface CashDelivery {
  id: number; userName: string; avatar: string; phone: string
  amount: number; status: CashStatus
  receiverName: string; receiverPhone: string; receiverAddress: string
  requestedAt: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const initialCashDeliveries: CashDelivery[] = [
  { id: 1,  userName: 'Akmal Karimov',    avatar: 'AK', phone: '+998 90 123 45 67', amount: 50000,  status: 'pending',          receiverName: 'Akmal Karimov',    receiverPhone: '+998 90 123 45 67', receiverAddress: "Tashkent, Yunusabad, Amir Temur ko'chasi 15",    requestedAt: 'Jun 21, 2026  09:14' },
  { id: 2,  userName: 'Bekzod Saidov',    avatar: 'BS', phone: '+998 91 234 56 78', amount: 120000, status: 'completed',        receiverName: 'Bekzod Saidov',    receiverPhone: '+998 91 234 56 78', receiverAddress: "Tashkent, Chilonzor, Bunyodkor ko'chasi 7",      requestedAt: 'Jun 19, 2026  11:30' },
  { id: 3,  userName: 'Eldor Nazarov',    avatar: 'EN', phone: '+998 93 345 67 89', amount: 80000,  status: 'out_for_delivery', receiverName: 'Eldor Nazarov',    receiverPhone: '+998 93 345 67 89', receiverAddress: "Tashkent, Mirzo Ulug'bek, Mustaqillik 22",       requestedAt: 'Jun 18, 2026  08:55' },
  { id: 4,  userName: 'Murod Xasanov',    avatar: 'MX', phone: '+998 94 456 78 90', amount: 200000, status: 'completed',        receiverName: 'Murod Xasanov',    receiverPhone: '+998 94 456 78 90', receiverAddress: "Tashkent, Shayxontohur, Navoiy ko'chasi 3",      requestedAt: 'Jun 17, 2026  16:02' },
  { id: 5,  userName: 'Nodir Qodirov',    avatar: 'NQ', phone: '+998 95 567 89 01', amount: 150000, status: 'pending',          receiverName: 'Nodir Qodirov',    receiverPhone: '+998 95 567 89 01', receiverAddress: "Samarkand, Registon ko'chasi 1",                  requestedAt: 'Jun 20, 2026  13:47' },
  { id: 6,  userName: 'Kamola Nazarova',  avatar: 'KN', phone: '+998 97 678 90 12', amount: 75000,  status: 'completed',        receiverName: 'Kamola Nazarova',  receiverPhone: '+998 97 678 90 12', receiverAddress: "Tashkent, Uchtepa, Sergeli ko'chasi 9",          requestedAt: 'Jun 15, 2026  10:21' },
  { id: 7,  userName: 'Firdavs Rakhimov', avatar: 'FR', phone: '+998 98 789 01 23', amount: 40000,  status: 'pending',          receiverName: 'Firdavs Rakhimov', receiverPhone: '+998 98 789 01 23', receiverAddress: "Tashkent, Yashnobod, O'zbekiston ko'chasi 44",   requestedAt: 'Jun 21, 2026  14:58' },
  { id: 8,  userName: 'Sanjar Mirzaev',   avatar: 'SM', phone: '+998 99 890 12 34', amount: 95000,  status: 'out_for_delivery', receiverName: 'Sanjar Mirzaev',   receiverPhone: '+998 99 890 12 34', receiverAddress: "Namangan, Uychi ko'chasi 18",                     requestedAt: 'Jun 14, 2026  07:33' },
  { id: 9,  userName: 'Komil Hasanov',    avatar: 'KH', phone: '+998 90 901 23 45', amount: 60000,  status: 'completed',        receiverName: 'Komil Hasanov',    receiverPhone: '+998 90 901 23 45', receiverAddress: "Samarkand, Bog'ishamol ko'chasi 6",              requestedAt: 'Jun 12, 2026  15:10' },
  { id: 10, userName: 'Zulfiya Karimova', avatar: 'ZK', phone: '+998 91 012 34 56', amount: 35000,  status: 'pending',          receiverName: 'Zulfiya Karimova', receiverPhone: '+998 91 012 34 56', receiverAddress: "Tashkent, Olmazor, Qo'yliq ko'chasi 11",        requestedAt: 'Jun 22, 2026  12:05' },
]

// ─── Status config ────────────────────────────────────────────────────────────

const cashStatusConfig: Record<CashStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending:          { label: 'Pending',          bg: 'bg-amber-50',   text: 'text-amber-600',   dot: 'bg-amber-400'   },
  out_for_delivery: { label: 'Out for Delivery', bg: 'bg-blue-50',    text: 'text-blue-600',    dot: 'bg-blue-500'    },
  completed:        { label: 'Completed',        bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
}

const CASH_STATUS_OPTIONS: CashStatus[] = ['pending', 'out_for_delivery', 'completed']

// ─── Helpers ──────────────────────────────────────────────────────────────────

const avatarColors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500']

function fmt(n: number) { return n.toLocaleString('ru-RU').replace(/,/g, ' ') }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>,
    document.body
  )
}

// ─── Shared input style ───────────────────────────────────────────────────────

function inputCls(err?: string) {
  return `w-full bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[13px] font-medium border transition-all focus:outline-none focus:ring-2 ${err ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-transparent focus:border-primary focus:ring-primary/20'}`
}

// ─── Cash Delivery modal ──────────────────────────────────────────────────────

interface CDForm {
  userName: string; phone: string; amount: string; status: CashStatus
  receiverName: string; receiverPhone: string; receiverAddress: string
}

function CashDeliveryModal({ initial, onClose, onSave }: {
  initial?: CashDelivery | null
  onClose: () => void
  onSave: (data: Omit<CashDelivery, 'id' | 'requestedAt'>) => void
}) {
  const isEdit = !!initial
  const [form, setForm] = useState<CDForm>({
    userName:        initial?.userName        ?? '',
    phone:           initial?.phone           ?? '',
    amount:          initial ? String(initial.amount) : '',
    status:          initial?.status          ?? 'pending',
    receiverName:    initial?.receiverName    ?? '',
    receiverPhone:   initial?.receiverPhone   ?? '',
    receiverAddress: initial?.receiverAddress ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof CDForm, string>>>({})

  const set = (k: keyof CDForm, v: string) => {
    setForm((p) => ({ ...p, [k]: v }))
    setErrors((p) => ({ ...p, [k]: '' }))
  }

  const validate = () => {
    const e: typeof errors = {}
    if (!form.userName.trim())        e.userName        = 'Required'
    if (!form.phone.trim())           e.phone           = 'Required'
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Must be > 0'
    if (!form.receiverName.trim())    e.receiverName    = 'Required'
    if (!form.receiverPhone.trim())   e.receiverPhone   = 'Required'
    if (!form.receiverAddress.trim()) e.receiverAddress = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const initials = form.userName.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    onSave({
      userName:        form.userName.trim(),
      avatar:          initials,
      phone:           form.phone.trim(),
      amount:          Number(form.amount),
      status:          form.status,
      receiverName:    form.receiverName.trim(),
      receiverPhone:   form.receiverPhone.trim(),
      receiverAddress: form.receiverAddress.trim(),
    })
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-card rounded-2xl w-[640px] max-w-full overflow-hidden" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.06]">
          <div>
            <p className="text-[16px] font-extrabold text-foreground">{isEdit ? 'Edit Delivery' : 'New Cash Delivery'}</p>
            <p className="text-[12px] font-medium text-muted-foreground mt-0.5">{isEdit ? 'Update the delivery details' : 'Create a new cash delivery request'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 pt-6 pb-4 flex flex-col gap-5">
          {/* Two-column row */}
          <div className="flex gap-0">
            {/* Left — user */}
            <div className="flex-1 flex flex-col gap-4 pr-6">
              <p className="text-[11px] font-bold text-foreground uppercase tracking-wider -mb-2">User Details</p>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">User Name</label>
                <input value={form.userName} onChange={(e) => set('userName', e.target.value)} placeholder="Full name" className={inputCls(errors.userName)} />
                {errors.userName && <p className="text-[11px] font-semibold text-red-500">{errors.userName}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+998 90 000 00 00" className={inputCls(errors.phone)} />
                {errors.phone && <p className="text-[11px] font-semibold text-red-500">{errors.phone}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Amount</label>
                <div className="relative">
                  <input type="number" min={0} value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0"
                    className={inputCls(errors.amount) + ' pr-14'} />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground">UZS</span>
                </div>
                {errors.amount && <p className="text-[11px] font-semibold text-red-500">{errors.amount}</p>}
              </div>
            </div>

            {/* Divider */}
            <div className="w-px bg-black/10 mx-2 self-stretch" />

            {/* Right — receiver */}
            <div className="flex-1 flex flex-col gap-4 pl-6">
              <p className="text-[11px] font-bold text-foreground uppercase tracking-wider -mb-2">Receiver Details</p>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Receiver Name</label>
                <input value={form.receiverName} onChange={(e) => set('receiverName', e.target.value)} placeholder="Full name" className={inputCls(errors.receiverName)} />
                {errors.receiverName && <p className="text-[11px] font-semibold text-red-500">{errors.receiverName}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                <input value={form.receiverPhone} onChange={(e) => set('receiverPhone', e.target.value)} placeholder="+998 90 000 00 00" className={inputCls(errors.receiverPhone)} />
                {errors.receiverPhone && <p className="text-[11px] font-semibold text-red-500">{errors.receiverPhone}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Address</label>
                <textarea value={form.receiverAddress} onChange={(e) => set('receiverAddress', e.target.value)}
                  placeholder="City, district, street and house number" rows={3}
                  className={inputCls(errors.receiverAddress) + ' resize-none'} />
                {errors.receiverAddress && <p className="text-[11px] font-semibold text-red-500">{errors.receiverAddress}</p>}
              </div>
            </div>
          </div>

          {/* Status — full width row */}
          <div className="flex flex-col gap-1.5 border-t border-black/[0.06] pt-4">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
            <div className="flex gap-2">
              {CASH_STATUS_OPTIONS.map((s) => {
                const sc = cashStatusConfig[s]
                return (
                  <button key={s} type="button" onClick={() => set('status', s)}
                    className={['flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-semibold border-2 transition-all',
                      form.status === s ? `${sc.bg} border-current ${sc.text}` : 'bg-[#F4F5F7] border-transparent text-muted-foreground hover:border-black/10'].join(' ')}>
                    <span className={['w-2 h-2 rounded-full shrink-0', form.status === s ? sc.dot : 'bg-muted-foreground/30'].join(' ')} />
                    {sc.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-5 border-t border-black/[0.06]">
          <button onClick={onClose} className="flex-1 rounded-xl py-3 text-[13px] font-semibold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 rounded-xl py-3 text-[13px] font-semibold text-white bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all"
            style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
            {isEdit ? 'Save Changes' : 'Create'}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  )
}

// ─── Delete modal ─────────────────────────────────────────────────────────────

function DeleteModal({ userName, onClose, onConfirm }: { userName: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-card rounded-2xl w-[440px] max-w-full overflow-hidden" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
        <div className="flex flex-col items-center gap-4 px-8 pt-8 pb-6 text-center">
          <span className="w-16 h-16 rounded-2xl flex items-center justify-center bg-red-50">
            <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
            </svg>
          </span>
          <div>
            <p className="text-[18px] font-extrabold text-foreground">Delete Record</p>
            <p className="text-[13px] font-medium text-muted-foreground mt-2 leading-relaxed">
              Delete the record for <span className="font-bold text-foreground">{userName}</span>? This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3 px-8 pb-8">
          <button onClick={onClose} className="flex-1 rounded-xl py-3 text-[13px] font-semibold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 rounded-xl py-3 text-[13px] font-semibold text-white bg-red-500 hover:bg-red-600 active:scale-[0.98] transition-all"
            style={{ boxShadow: '0 2px 8px rgba(239,68,68,0.3)' }}>
            Delete
          </button>
        </div>
      </div>
    </ModalBackdrop>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function CountStatCard({ label, value, iconBg, icon }: { label: string; value: number; iconBg: string; icon: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-black/[0.06] p-5 flex items-center justify-between" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div className="flex flex-col gap-1.5">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-[26px] font-extrabold text-foreground leading-none">{value}</p>
      </div>
      <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
        <span className="w-5 h-5 text-white">{icon}</span>
      </span>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)
const IconList = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
)
const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)
const IconTruck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
)

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

// ─── Shared components ────────────────────────────────────────────────────────

function EmptySearch({ onClear }: { onClear: () => void }) {
  return (
    <tr><td colSpan={5} className="px-5 py-16 text-center">
      <div className="flex flex-col items-center gap-2">
        <svg className="w-8 h-8 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <p className="text-[13px] font-semibold text-muted-foreground">No results match your search</p>
        <button onClick={onClear} className="text-[12px] font-semibold text-primary hover:underline">Clear search</button>
      </div>
    </td></tr>
  )
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative flex-1">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-9 pl-9 pr-8 bg-[#F4F5F7] rounded-xl text-[13px] font-medium text-foreground border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
      {value && (
        <button onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors">
          <svg className="w-2.5 h-2.5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  )
}

function UserCell({ userName, avatar, phone, index }: { userName: string; avatar: string; phone: string; index: number }) {
  const bg = avatarColors[index % avatarColors.length]
  return (
    <div className="flex items-center gap-3">
      <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-bold ${bg}`}>{avatar}</span>
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-foreground whitespace-nowrap">{userName}</span>
        <span className="text-[11px] font-medium text-muted-foreground font-mono">{phone}</span>
      </div>
    </div>
  )
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={onEdit}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-primary transition-all active:scale-95" title="Edit">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button onClick={onDelete}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all active:scale-95" title="Delete">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
        </svg>
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WithdrawalsPage() {
  const [cashDeliveries, setCashDeliveries] = useState<CashDelivery[]>(initialCashDeliveries)
  const [search, setSearch]                 = useState('')
  const [page, setPage]                     = useState(1)
  const [pageSize, setPageSize]             = useState(20)
  const [editModal, setEditModal]           = useState<CashDelivery | null | 'new'>(null)
  const [deleteModal, setDeleteModal]       = useState<{ id: number; userName: string } | null>(null)

  const total     = cashDeliveries.length
  const pending   = cashDeliveries.filter((r) => r.status === 'pending').length
  const outForDel = cashDeliveries.filter((r) => r.status === 'out_for_delivery').length
  const completed = cashDeliveries.filter((r) => r.status === 'completed').length

  const filtered = cashDeliveries.filter((r) => {
    const q = search.trim().toLowerCase()
    return !q || r.userName.toLowerCase().includes(q) || r.receiverName.toLowerCase().includes(q)
  })
  const pageCount = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)
  const handleSearch = (v: string) => { setSearch(v); setPage(1) }

  const handleSave = (data: Omit<CashDelivery, 'id' | 'requestedAt'>) => {
    if (editModal === 'new') {
      const now = new Date()
      const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      setCashDeliveries((prev) => [{ id: Date.now(), requestedAt: `${date}  ${time}`, ...data }, ...prev])
    } else if (editModal) {
      setCashDeliveries((prev) => prev.map((r) => r.id === editModal.id ? { ...r, ...data } : r))
    }
    setEditModal(null)
  }

  const handleDelete = () => {
    if (!deleteModal) return
    setCashDeliveries((prev) => prev.filter((r) => r.id !== deleteModal.id))
    setDeleteModal(null)
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Withdrawals</h1>
        <p className="text-[13px] font-medium text-muted-foreground mt-0.5">Manage cash delivery requests</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <CountStatCard label="Total Requests"  value={total}     iconBg="bg-primary"     icon={<IconList />}  />
        <CountStatCard label="Pending"          value={pending}   iconBg="bg-amber-400"   icon={<IconClock />} />
        <CountStatCard label="Out for Delivery" value={outForDel} iconBg="bg-blue-500"    icon={<IconTruck />} />
        <CountStatCard label="Completed"        value={completed} iconBg="bg-emerald-500" icon={<IconCheck />} />
      </div>

      <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div className="px-5 py-3.5 border-b border-black/[0.06] flex items-center gap-3">
          <SearchBar value={search} onChange={handleSearch} placeholder="Search by user or receiver name…" />
          <button onClick={() => setEditModal('new')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all shrink-0"
            style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.05]">
                {['User', 'Amount', 'Status', 'Requested At', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0
                ? <EmptySearch onClear={() => handleSearch('')} />
                : paginated.map((req, i) => {
                    const sc = cashStatusConfig[req.status]
                    return (
                      <tr key={req.id} className="border-b border-black/[0.04] hover:bg-[#F4F5F7]/70 transition-colors last:border-0">
                        <td className="px-5 py-3.5">
                          <UserCell userName={req.userName} avatar={req.avatar} phone={req.phone} index={i} />
                        </td>
                        <td className="px-5 py-3.5 text-[13px] font-bold text-foreground whitespace-nowrap">
                          {fmt(req.amount)} <span className="text-[11px] font-medium text-muted-foreground">UZS</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sc.dot}`} />
                            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl ${sc.bg} ${sc.text}`}>{sc.label}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-[13px] font-medium text-muted-foreground whitespace-nowrap">{req.requestedAt}</td>
                        <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <RowActions onEdit={() => setEditModal(req)} onDelete={() => setDeleteModal({ id: req.id, userName: req.userName })} />
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>

        <PaginationFooter
          page={page} pageCount={pageCount} pageSize={pageSize} total={filtered.length}
          onPage={setPage} onPageSize={(s) => { setPageSize(s); setPage(1) }}
        />
      </div>

      {editModal !== null && (
        <CashDeliveryModal
          initial={editModal === 'new' ? null : editModal}
          onClose={() => setEditModal(null)}
          onSave={handleSave}
        />
      )}
      {deleteModal && (
        <DeleteModal userName={deleteModal.userName} onClose={() => setDeleteModal(null)} onConfirm={handleDelete} />
      )}
    </div>
  )
}
