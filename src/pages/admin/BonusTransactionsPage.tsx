import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BonusTransaction {
  id: number; user: string; avatar: string
  userType: 'mechanic' | 'seller'
  amount: number; orderRef: string; shop: string; createdAt: string
}

interface CashRequest {
  id: number; user: string; avatar: string; userType: 'mechanic' | 'seller'
  amount: number
  status: 'pending' | 'approved' | 'delivered' | 'rejected'
  requestedAt: string; processedAt?: string
}

type Tab = 'transactions' | 'cash-requests'

// ─── Mock data — Transactions ─────────────────────────────────────────────────

const bonusTransactions: BonusTransaction[] = [
  { id: 1,  user: 'Akmal Karimov',    avatar: 'AK', userType: 'mechanic', amount: 6300,  orderRef: 'ORD-2606-A01', shop: 'AutoZone Tashkent',   createdAt: 'Jun 20, 2026' },
  { id: 2,  user: 'Bekzod Saidov',    avatar: 'BS', userType: 'seller',   amount: 14000, orderRef: 'ORD-2606-A02', shop: 'AutoZone Tashkent',   createdAt: 'Jun 19, 2026' },
  { id: 3,  user: 'Bobur Toshmatov',  avatar: 'BT', userType: 'mechanic', amount: 10200, orderRef: 'ORD-2606-A03', shop: 'CarParts Express',    createdAt: 'Jun 18, 2026' },
  { id: 4,  user: 'Jasur Tursunov',   avatar: 'JT', userType: 'seller',   amount: 8500,  orderRef: 'ORD-2606-A04', shop: 'CarParts Express',    createdAt: 'Jun 17, 2026' },
  { id: 5,  user: 'Eldor Nazarov',    avatar: 'EN', userType: 'mechanic', amount: 19200, orderRef: 'ORD-2606-A05', shop: 'SuspensionKing',      createdAt: 'Jun 16, 2026' },
  { id: 6,  user: 'Murod Xasanov',    avatar: 'MX', userType: 'seller',   amount: 32000, orderRef: 'ORD-2606-A06', shop: 'SuspensionKing',      createdAt: 'Jun 15, 2026' },
  { id: 7,  user: 'Firdavs Rakhimov', avatar: 'FR', userType: 'mechanic', amount: 57600, orderRef: 'ORD-2606-A07', shop: 'TireHub Yunusabad',   createdAt: 'Jun 14, 2026' },
  { id: 8,  user: 'Sherzod Aliev',    avatar: 'SA', userType: 'seller',   amount: 24000, orderRef: 'ORD-2606-A08', shop: 'TireHub Yunusabad',   createdAt: 'Jun 13, 2026' },
  { id: 9,  user: 'Komil Hasanov',    avatar: 'KH', userType: 'mechanic', amount: 6750,  orderRef: 'ORD-2606-A09', shop: 'DriveZone Samarkand', createdAt: 'Jun 12, 2026' },
  { id: 10, user: 'Zulfiya Karimova', avatar: 'ZK', userType: 'seller',   amount: 18000, orderRef: 'ORD-2606-A10', shop: 'DriveZone Samarkand', createdAt: 'Jun 11, 2026' },
  { id: 11, user: 'Nodir Qodirov',    avatar: 'NQ', userType: 'mechanic', amount: 23250, orderRef: 'ORD-2606-A11', shop: 'SparkMaster Pro',     createdAt: 'Jun 10, 2026' },
  { id: 12, user: 'Kamola Nazarova',  avatar: 'KN', userType: 'seller',   amount: 45000, orderRef: 'ORD-2606-A12', shop: 'SparkMaster Pro',     createdAt: 'Jun 9, 2026'  },
]

// ─── Mock data — Cash Requests ────────────────────────────────────────────────

const initialCashRequests: CashRequest[] = [
  { id: 1,  user: 'Akmal Karimov',    avatar: 'AK', userType: 'mechanic', amount: 50000,  status: 'pending',   requestedAt: 'Jun 21, 2026' },
  { id: 2,  user: 'Bekzod Saidov',    avatar: 'BS', userType: 'seller',   amount: 120000, status: 'delivered', requestedAt: 'Jun 19, 2026', processedAt: 'Jun 20, 2026' },
  { id: 3,  user: 'Eldor Nazarov',    avatar: 'EN', userType: 'mechanic', amount: 80000,  status: 'approved',  requestedAt: 'Jun 18, 2026', processedAt: 'Jun 19, 2026' },
  { id: 4,  user: 'Murod Xasanov',    avatar: 'MX', userType: 'seller',   amount: 200000, status: 'rejected',  requestedAt: 'Jun 17, 2026', processedAt: 'Jun 17, 2026' },
  { id: 5,  user: 'Nodir Qodirov',    avatar: 'NQ', userType: 'mechanic', amount: 150000, status: 'pending',   requestedAt: 'Jun 20, 2026' },
  { id: 6,  user: 'Kamola Nazarova',  avatar: 'KN', userType: 'seller',   amount: 75000,  status: 'delivered', requestedAt: 'Jun 15, 2026', processedAt: 'Jun 16, 2026' },
  { id: 7,  user: 'Firdavs Rakhimov', avatar: 'FR', userType: 'mechanic', amount: 40000,  status: 'pending',   requestedAt: 'Jun 21, 2026' },
  { id: 8,  user: 'Sanjar Mirzaev',   avatar: 'SM', userType: 'seller',   amount: 95000,  status: 'rejected',  requestedAt: 'Jun 14, 2026', processedAt: 'Jun 14, 2026' },
  { id: 9,  user: 'Komil Hasanov',    avatar: 'KH', userType: 'mechanic', amount: 60000,  status: 'delivered', requestedAt: 'Jun 12, 2026', processedAt: 'Jun 13, 2026' },
  { id: 10, user: 'Zulfiya Karimova', avatar: 'ZK', userType: 'seller',   amount: 35000,  status: 'pending',   requestedAt: 'Jun 22, 2026' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const avatarColors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500']

function fmt(n: number) {
  return n.toLocaleString('ru-RU').replace(/,/g, ' ')
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

// ─── Modal backdrop ───────────────────────────────────────────────────────────

function ModalBackdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEscClose(onClose)
  useLockScroll()
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>,
    document.body
  )
}

// ─── Status change modal ──────────────────────────────────────────────────────

type ConfirmAction = 'approve' | 'reject'

function StatusModal({
  action, user, amount, onClose, onConfirm,
}: { action: ConfirmAction; user: string; amount: number; onClose: () => void; onConfirm: () => void }) {
  const isApprove = action === 'approve'
  return (
    <ModalBackdrop onClose={onClose}>
      <div
        className="bg-card rounded-2xl w-[460px] max-w-full overflow-hidden"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}
      >
        <div className="flex flex-col items-center gap-4 px-8 pt-8 pb-6 text-center">
          <span className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isApprove ? 'bg-emerald-50' : 'bg-red-50'}`}>
            {isApprove ? (
              <svg className="w-8 h-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
          </span>
          <div>
            <p className="text-[18px] font-extrabold text-foreground">
              {isApprove ? 'Approve Request' : 'Reject Request'}
            </p>
            <p className="text-[13px] font-medium text-muted-foreground mt-2 leading-relaxed">
              {isApprove
                ? <>Confirm you want to approve the cash delivery for <span className="font-bold text-foreground">{user}</span> — <span className="font-bold text-foreground">{fmt(amount)} UZS</span></>
                : <>Confirm you want to reject the cash request from <span className="font-bold text-foreground">{user}</span> — <span className="font-bold text-foreground">{fmt(amount)} UZS</span></>
              }
            </p>
          </div>
        </div>
        <div className="flex gap-3 px-8 pb-8">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl py-3 text-[13px] font-semibold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-3 text-[13px] font-semibold text-white active:scale-[0.98] transition-all ${isApprove ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
            style={{ boxShadow: isApprove ? '0 2px 8px rgba(16,185,129,0.3)' : '0 2px 8px rgba(239,68,68,0.3)' }}
          >
            {isApprove ? 'Approve' : 'Reject'}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  )
}

// ─── Stat card — UZS amount variant ──────────────────────────────────────────

function AmountStatCard({ label, value, iconBg, icon }: { label: string; value: number; iconBg: string; icon: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-black/[0.06] p-5 flex items-center justify-between" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div className="flex flex-col gap-1.5 min-w-0 mr-3">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-[22px] font-extrabold text-foreground leading-none truncate">
          {fmt(value)}<span className="text-[13px] font-semibold text-muted-foreground ml-1.5">UZS</span>
        </p>
      </div>
      <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
        <span className="w-5 h-5 text-white">{icon}</span>
      </span>
    </div>
  )
}

// ─── Stat card — Count variant ────────────────────────────────────────────────

function CountStatCard({ label, value, iconBg, icon }: { label: string; value: number; iconBg: string; icon: React.ReactNode }) {
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

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconDollar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

const IconWrench = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
)

const IconShop = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
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

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
  </svg>
)

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
      <button
        onClick={() => setOpen((o) => !o)}
        className={['flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all', open ? 'border-primary text-primary bg-primary/5' : 'border-black/[0.08] text-muted-foreground hover:border-black/20 hover:text-foreground'].join(' ')}
      >
        {value}
        <svg className={['w-3.5 h-3.5 transition-transform', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="absolute bottom-full mb-1.5 left-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-20 min-w-[72px]" style={{ boxShadow: '0 -6px 20px rgba(0,0,0,0.12)' }}>
          {PAGE_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => { onChange(s); setOpen(false) }}
              className={['w-full text-center px-4 py-2 text-[12px] font-semibold transition-colors', s === value ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-[#F4F5F7]'].join(' ')}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Pagination footer ────────────────────────────────────────────────────────

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
        <button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        {range[0] > 1 && (<>
          <button onClick={() => onPage(1)} className="w-8 h-8 rounded-lg text-[13px] font-semibold text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">1</button>
          {range[0] > 2 && <span className="w-8 h-8 flex items-center justify-center text-[13px] text-muted-foreground">…</span>}
        </>)}
        {range.map((p) => (
          <button
            key={p} onClick={() => onPage(p)}
            className={['w-8 h-8 rounded-lg text-[13px] font-semibold transition-all', p === page ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground'].join(' ')}
          >
            {p}
          </button>
        ))}
        {range[range.length - 1] < pageCount && (<>
          {range[range.length - 1] < pageCount - 1 && <span className="w-8 h-8 flex items-center justify-center text-[13px] text-muted-foreground">…</span>}
          <button onClick={() => onPage(pageCount)} className="w-8 h-8 rounded-lg text-[13px] font-semibold text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">{pageCount}</button>
        </>)}
        <button
          onClick={() => onPage(Math.min(pageCount, page + 1))}
          disabled={page === pageCount || pageCount === 0}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptySearch({ colSpan, onClear }: { colSpan: number; onClear: () => void }) {
  return (
    <tr><td colSpan={colSpan} className="px-5 py-16 text-center">
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

// ─── Cash request status config ───────────────────────────────────────────────

const cashStatusConfig: Record<CashRequest['status'], { label: string; bg: string; text: string }> = {
  pending:   { label: 'Pending',   bg: 'bg-amber-50',   text: 'text-amber-600'  },
  approved:  { label: 'Approved',  bg: 'bg-blue-50',    text: 'text-blue-600'   },
  delivered: { label: 'Delivered', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  rejected:  { label: 'Rejected',  bg: 'bg-red-50',     text: 'text-red-500'    },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BonusTransactionsPage() {
  const [tab, setTab] = useState<Tab>('transactions')

  // Transactions state
  const [txSearch, setTxSearch]   = useState('')
  const [txPage, setTxPage]       = useState(1)
  const [txPageSize, setTxPageSize] = useState(20)

  // Cash requests state
  const [crSearch, setCrSearch]   = useState('')
  const [cashRequests, setCashRequests] = useState<CashRequest[]>(initialCashRequests)
  const [confirmModal, setConfirmModal] = useState<{ id: number; action: ConfirmAction; user: string; amount: number } | null>(null)

  // ── Transactions derived ──────────────────────────────────────────────────

  const totalPaidOut      = bonusTransactions.reduce((s, t) => s + t.amount, 0)
  const mechanicsPaidOut  = bonusTransactions.filter((t) => t.userType === 'mechanic').reduce((s, t) => s + t.amount, 0)
  const sellersPaidOut    = bonusTransactions.filter((t) => t.userType === 'seller').reduce((s, t) => s + t.amount, 0)

  const txFiltered = bonusTransactions.filter((t) => {
    const q = txSearch.trim().toLowerCase()
    return !q || t.user.toLowerCase().includes(q) || t.orderRef.toLowerCase().includes(q)
  })
  const txPageCount = Math.ceil(txFiltered.length / txPageSize)
  const txPaginated = txFiltered.slice((txPage - 1) * txPageSize, txPage * txPageSize)

  const handleTxSearch = (v: string) => { setTxSearch(v); setTxPage(1) }

  // ── Cash requests derived ─────────────────────────────────────────────────

  const crTotal     = cashRequests.length
  const crPending   = cashRequests.filter((r) => r.status === 'pending').length
  const crDelivered = cashRequests.filter((r) => r.status === 'delivered').length
  const crRejected  = cashRequests.filter((r) => r.status === 'rejected').length

  const crFiltered = cashRequests.filter((r) => {
    const q = crSearch.trim().toLowerCase()
    return !q || r.user.toLowerCase().includes(q)
  })

  const handleCrSearch = (v: string) => { setCrSearch(v) }

  const handleConfirm = () => {
    if (!confirmModal) return
    const now = 'Jun 22, 2026'
    setCashRequests((prev) =>
      prev.map((r) =>
        r.id === confirmModal.id
          ? { ...r, status: confirmModal.action === 'approve' ? 'approved' : 'rejected', processedAt: now }
          : r
      )
    )
    setConfirmModal(null)
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Bonus Transactions</h1>
        <p className="text-[13px] font-medium text-muted-foreground mt-0.5">Track bonus payouts and manage cash withdrawal requests</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-black/[0.08]">
        {([
          { id: 'transactions',  label: 'Transactions'  },
          { id: 'cash-requests', label: 'Cash Requests' },
        ] as const).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={['flex items-center gap-2 px-5 py-3 text-[13px] font-semibold border-b-2 -mb-px transition-all', tab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-black/20'].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ══ TRANSACTIONS TAB ══ */}
      {tab === 'transactions' && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-4">
            <AmountStatCard label="Total Paid Out"      value={totalPaidOut}     iconBg="bg-primary"     icon={<IconDollar />} />
            <AmountStatCard label="Mechanics Bonuses"   value={mechanicsPaidOut} iconBg="bg-amber-500"   icon={<IconWrench />} />
            <AmountStatCard label="Sellers Bonuses"     value={sellersPaidOut}   iconBg="bg-violet-500"  icon={<IconShop />}   />
          </div>

          {/* Table card */}
          <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            {/* Toolbar */}
            <div className="px-5 py-3.5 border-b border-black/[0.06] flex items-center gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={txSearch}
                  onChange={(e) => handleTxSearch(e.target.value)}
                  placeholder="Search by user or order ref…"
                  className="w-full h-9 pl-9 pr-8 bg-[#F4F5F7] rounded-xl text-[13px] font-medium text-foreground border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {txSearch && (
                  <button
                    onClick={() => handleTxSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors"
                  >
                    <svg className="w-2.5 h-2.5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/[0.05]">
                    {['User', 'Order Ref', 'Shop', 'Amount', 'Date'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txPaginated.length === 0
                    ? <EmptySearch colSpan={5} onClear={() => handleTxSearch('')} />
                    : txPaginated.map((tx, i) => {
                        const avatarBg = avatarColors[i % avatarColors.length]
                        return (
                          <tr key={tx.id} className="border-b border-black/[0.04] hover:bg-[#F4F5F7]/70 transition-colors last:border-0">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-bold ${avatarBg}`}>{tx.avatar}</span>
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[13px] font-semibold text-foreground whitespace-nowrap">{tx.user}</span>
                                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-xl self-start ${tx.userType === 'mechanic' ? 'bg-amber-50 text-amber-600' : 'bg-violet-50 text-violet-600'}`}>
                                    {tx.userType === 'mechanic' ? 'Mechanic' : 'Seller'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="text-[11px] font-mono font-semibold text-muted-foreground bg-[#F4F5F7] px-2.5 py-1 rounded-lg whitespace-nowrap">{tx.orderRef}</span>
                            </td>
                            <td className="px-5 py-3.5 text-[13px] font-medium text-foreground whitespace-nowrap">{tx.shop}</td>
                            <td className="px-5 py-3.5 text-[13px] font-bold text-emerald-600 whitespace-nowrap">
                              +{fmt(tx.amount)} <span className="text-[11px] font-medium text-emerald-500">UZS</span>
                            </td>
                            <td className="px-5 py-3.5 text-[13px] font-medium text-muted-foreground whitespace-nowrap">{tx.createdAt}</td>
                          </tr>
                        )
                      })
                  }
                </tbody>
              </table>
            </div>

            <PaginationFooter
              page={txPage} pageCount={txPageCount} pageSize={txPageSize} total={txFiltered.length}
              onPage={setTxPage} onPageSize={(s) => { setTxPageSize(s); setTxPage(1) }}
            />
          </div>
        </>
      )}

      {/* ══ CASH REQUESTS TAB ══ */}
      {tab === 'cash-requests' && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-4">
            <CountStatCard label="Total Requests" value={crTotal}     iconBg="bg-primary"     icon={<IconList />}  />
            <CountStatCard label="Pending"         value={crPending}   iconBg="bg-amber-400"   icon={<IconClock />} />
            <CountStatCard label="Delivered"       value={crDelivered} iconBg="bg-emerald-500" icon={<IconCheck />} />
            <CountStatCard label="Rejected"        value={crRejected}  iconBg="bg-red-500"     icon={<IconX />}     />
          </div>

          {/* Table card */}
          <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            {/* Toolbar */}
            <div className="px-5 py-3.5 border-b border-black/[0.06] flex items-center gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={crSearch}
                  onChange={(e) => handleCrSearch(e.target.value)}
                  placeholder="Search by user name…"
                  className="w-full h-9 pl-9 pr-8 bg-[#F4F5F7] rounded-xl text-[13px] font-medium text-foreground border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {crSearch && (
                  <button
                    onClick={() => handleCrSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors"
                  >
                    <svg className="w-2.5 h-2.5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/[0.05]">
                    {['User', 'Amount', 'Status', 'Requested At', 'Processed At', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {crFiltered.length === 0
                    ? <EmptySearch colSpan={6} onClear={() => handleCrSearch('')} />
                    : crFiltered.map((req, i) => {
                        const avatarBg = avatarColors[i % avatarColors.length]
                        const sc       = cashStatusConfig[req.status]
                        return (
                          <tr key={req.id} className="border-b border-black/[0.04] hover:bg-[#F4F5F7]/70 transition-colors last:border-0">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-bold ${avatarBg}`}>{req.avatar}</span>
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[13px] font-semibold text-foreground whitespace-nowrap">{req.user}</span>
                                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-xl self-start ${req.userType === 'mechanic' ? 'bg-amber-50 text-amber-600' : 'bg-violet-50 text-violet-600'}`}>
                                    {req.userType === 'mechanic' ? 'Mechanic' : 'Seller'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-[13px] font-bold text-foreground whitespace-nowrap">
                              {fmt(req.amount)} <span className="text-[11px] font-medium text-muted-foreground">UZS</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl ${sc.bg} ${sc.text}`}>{sc.label}</span>
                            </td>
                            <td className="px-5 py-3.5 text-[13px] font-medium text-muted-foreground whitespace-nowrap">{req.requestedAt}</td>
                            <td className="px-5 py-3.5 text-[13px] font-medium text-muted-foreground whitespace-nowrap">
                              {req.processedAt ?? <span className="text-muted-foreground/50">—</span>}
                            </td>
                            <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                              {req.status === 'pending' ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setConfirmModal({ id: req.id, action: 'approve', user: req.user, amount: req.amount })}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 active:scale-[0.97] transition-all border border-emerald-200"
                                  >
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => setConfirmModal({ id: req.id, action: 'reject', user: req.user, amount: req.amount })}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-red-50 text-red-500 hover:bg-red-100 active:scale-[0.97] transition-all border border-red-200"
                                  >
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground/50 text-[13px]">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                  }
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Status change confirmation modal */}
      {confirmModal && (
        <StatusModal
          action={confirmModal.action}
          user={confirmModal.user}
          amount={confirmModal.amount}
          onClose={() => setConfirmModal(null)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  )
}
