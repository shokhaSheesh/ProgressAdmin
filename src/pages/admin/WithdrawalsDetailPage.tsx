import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

// ─── Types (re-exported so WithdrawalsPage can import the store) ──────────────

export type CashStatus = 'pending' | 'out_for_delivery' | 'completed'

export interface CashDelivery {
  id: number
  userName: string
  avatar: string
  phone: string
  amount: number
  status: CashStatus
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  requestedAt: string
}

// ─── Shared mutable store ─────────────────────────────────────────────────────

export const withdrawalStore: CashDelivery[] = [
  { id: 1,  userName: 'Akmal Karimov',    avatar: 'AK', phone: '+998 90 123 45 67', amount: 50000,  status: 'pending',          receiverName: 'Akmal Karimov',    receiverPhone: '+998 90 123 45 67', receiverAddress: "Tashkent, Yunusabad, Amir Temur ko'chasi 15",    requestedAt: 'Jun 21, 2026  09:14' },
  { id: 2,  userName: 'Bekzod Saidov',    avatar: 'BS', phone: '+998 91 234 56 78', amount: 120000, status: 'completed',        receiverName: 'Bekzod Saidov',    receiverPhone: '+998 91 234 56 78', receiverAddress: "Tashkent, Chilonzor, Bunyodkor ko'chasi 7",      requestedAt: 'Jun 19, 2026  11:30' },
  { id: 3,  userName: 'Eldor Nazarov',    avatar: 'EN', phone: '+998 93 345 67 89', amount: 80000,  status: 'out_for_delivery', receiverName: 'Eldor Nazarov',    receiverPhone: '+998 93 345 67 89', receiverAddress: "Tashkent, Mirzo Ulug'bek, Mustaqillik 22",       requestedAt: 'Jun 18, 2026  08:55' },
  { id: 4,  userName: 'Murod Xasanov',    avatar: 'MX', phone: '+998 94 456 78 90', amount: 200000, status: 'completed',        receiverName: 'Murod Xasanov',    receiverPhone: '+998 94 456 78 90', receiverAddress: "Tashkent, Shayxontohur, Navoiy ko'chasi 3",      requestedAt: 'Jun 17, 2026  16:02' },
  { id: 5,  userName: 'Nodir Qodirov',    avatar: 'NQ', phone: '+998 95 567 89 01', amount: 150000, status: 'pending',          receiverName: 'Nodir Qodirov',    receiverPhone: '+998 95 567 89 01', receiverAddress: "Samarkand, Registon ko'chasi 1",                  requestedAt: 'Jun 20, 2026  13:47' },
  { id: 6,  userName: 'Kamola Nazarova',  avatar: 'KN', phone: '+998 97 678 90 12', amount: 75000,  status: 'completed',        receiverName: 'Kamola Nazarova',  receiverPhone: '+998 97 678 90 12', receiverAddress: "Tashkent, Uchtepa, Sergeli ko'chasi 9",          requestedAt: 'Jun 15, 2026  10:21' },
  { id: 7,  userName: 'Firdavs Rakhimov', avatar: 'FR', phone: '+998 98 789 01 23', amount: 40000,  status: 'pending',          receiverName: 'Firdavs Rakhimov', receiverPhone: '+998 98 789 01 23', receiverAddress: "Tashkent, Yashnobod, O'zbekiston ko'chasi 44",   requestedAt: 'Jun 21, 2026  14:58' },
  { id: 8,  userName: 'Sanjar Mirzaev',   avatar: 'SM', phone: '+998 99 890 12 34', amount: 95000,  status: 'out_for_delivery', receiverName: 'Sanjar Mirzaev',   receiverPhone: '+998 99 890 12 34', receiverAddress: "Namangan, Uychi ko'chasi 18",                     requestedAt: 'Jun 14, 2026  07:33' },
  { id: 9,  userName: 'Komil Hasanov',    avatar: 'KH', phone: '+998 90 901 23 45', amount: 60000,  status: 'completed',        receiverName: 'Komil Hasanov',    receiverPhone: '+998 90 901 23 45', receiverAddress: "Samarkand, Bog'ishamol ko'chasi 6",               requestedAt: 'Jun 12, 2026  15:10' },
  { id: 10, userName: 'Zulfiya Karimova', avatar: 'ZK', phone: '+998 91 012 34 56', amount: 35000,  status: 'pending',          receiverName: 'Zulfiya Karimova', receiverPhone: '+998 91 012 34 56', receiverAddress: "Tashkent, Olmazor, Qo'yliq ko'chasi 11",         requestedAt: 'Jun 22, 2026  12:05' },
]

// ─── Status config ────────────────────────────────────────────────────────────

const statusConfig: Record<CashStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending:          { label: 'Pending',          bg: 'bg-amber-50',   text: 'text-amber-600',   dot: 'bg-amber-400'   },
  out_for_delivery: { label: 'Out for Delivery', bg: 'bg-blue-50',    text: 'text-blue-600',    dot: 'bg-blue-500'    },
  completed:        { label: 'Completed',        bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/,/g, ' ')

const avatarColors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500']
function avatarColor(avatar: string) {
  let n = 0; for (let i = 0; i < avatar.length; i++) n += avatar.charCodeAt(i)
  return avatarColors[n % avatarColors.length]
}

// ─── Change log ───────────────────────────────────────────────────────────────

interface ChangeEntry {
  id: number
  timestamp: string
  user: string
  type: 'created' | 'status' | 'amount' | 'address'
  label: string
  from?: string
  to?: string
}

const MOCK_CHANGELOGS: Record<number, ChangeEntry[]> = {
  1: [
    { id: 1, timestamp: 'Jun 21, 2026 · 09:14', user: 'System', type: 'created', label: 'Request created' },
  ],
  2: [
    { id: 1, timestamp: 'Jun 19, 2026 · 11:30', user: 'System',      type: 'created', label: 'Request created' },
    { id: 2, timestamp: 'Jun 19, 2026 · 12:00', user: 'Admin',       type: 'status',  label: 'Status changed', from: 'Pending', to: 'Out for Delivery' },
    { id: 3, timestamp: 'Jun 19, 2026 · 15:45', user: 'Shokhruz S.', type: 'status',  label: 'Status changed', from: 'Out for Delivery', to: 'Completed' },
  ],
  3: [
    { id: 1, timestamp: 'Jun 18, 2026 · 08:55', user: 'System', type: 'created', label: 'Request created' },
    { id: 2, timestamp: 'Jun 18, 2026 · 09:30', user: 'Admin',  type: 'status',  label: 'Status changed', from: 'Pending', to: 'Out for Delivery' },
  ],
  4: [
    { id: 1, timestamp: 'Jun 17, 2026 · 16:02', user: 'System',      type: 'created', label: 'Request created' },
    { id: 2, timestamp: 'Jun 17, 2026 · 16:20', user: 'Admin',       type: 'amount',  label: 'Amount adjusted', from: '180 000 UZS', to: '200 000 UZS' },
    { id: 3, timestamp: 'Jun 17, 2026 · 17:00', user: 'Admin',       type: 'status',  label: 'Status changed', from: 'Pending', to: 'Out for Delivery' },
    { id: 4, timestamp: 'Jun 18, 2026 · 10:10', user: 'Shokhruz S.', type: 'status',  label: 'Status changed', from: 'Out for Delivery', to: 'Completed' },
  ],
  5: [
    { id: 1, timestamp: 'Jun 20, 2026 · 13:47', user: 'System', type: 'created', label: 'Request created' },
  ],
  6: [
    { id: 1, timestamp: 'Jun 15, 2026 · 10:21', user: 'System',      type: 'created', label: 'Request created' },
    { id: 2, timestamp: 'Jun 15, 2026 · 10:35', user: 'Shokhruz S.', type: 'address', label: 'Address updated', from: "Tashkent, Sergeli 5", to: "Tashkent, Uchtepa, Sergeli ko'chasi 9" },
    { id: 3, timestamp: 'Jun 15, 2026 · 11:00', user: 'Admin',       type: 'status',  label: 'Status changed', from: 'Pending', to: 'Out for Delivery' },
    { id: 4, timestamp: 'Jun 15, 2026 · 16:30', user: 'Admin',       type: 'status',  label: 'Status changed', from: 'Out for Delivery', to: 'Completed' },
  ],
  7: [
    { id: 1, timestamp: 'Jun 21, 2026 · 14:58', user: 'System', type: 'created', label: 'Request created' },
  ],
  8: [
    { id: 1, timestamp: 'Jun 14, 2026 · 07:33', user: 'System', type: 'created', label: 'Request created' },
    { id: 2, timestamp: 'Jun 14, 2026 · 08:00', user: 'Admin',  type: 'status',  label: 'Status changed', from: 'Pending', to: 'Out for Delivery' },
  ],
  9: [
    { id: 1, timestamp: 'Jun 12, 2026 · 15:10', user: 'System',      type: 'created', label: 'Request created' },
    { id: 2, timestamp: 'Jun 12, 2026 · 15:30', user: 'Admin',       type: 'status',  label: 'Status changed', from: 'Pending', to: 'Out for Delivery' },
    { id: 3, timestamp: 'Jun 12, 2026 · 19:20', user: 'Shokhruz S.', type: 'status',  label: 'Status changed', from: 'Out for Delivery', to: 'Completed' },
  ],
  10: [
    { id: 1, timestamp: 'Jun 22, 2026 · 12:05', user: 'System', type: 'created', label: 'Request created' },
  ],
}

function changeIcon(type: ChangeEntry['type']) {
  const wrap = (bg: string, color: string, path: React.ReactNode) => (
    <div className={`w-7 h-7 rounded-full ${bg} flex items-center justify-center shrink-0`}>
      <svg className={`w-3.5 h-3.5 ${color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">{path}</svg>
    </div>
  )
  switch (type) {
    case 'created': return wrap('bg-blue-100',   'text-blue-600',   <><path d="M12 5v14M5 12h14" /></>)
    case 'status':  return wrap('bg-violet-100', 'text-violet-600', <><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></>)
    case 'amount':  return wrap('bg-amber-100',  'text-amber-600',  <><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>)
    default:        return wrap('bg-rose-100',   'text-rose-500',   <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>)
  }
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'info' | 'changelog'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WithdrawalsDetailPage() {
  const navigate  = useNavigate()
  const { id }    = useParams<{ id: string }>()
  const wd        = withdrawalStore.find(w => w.id === Number(id))
  const [tab, setTab] = useState<Tab>('info')

  if (!wd) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <p className="text-[15px] font-bold text-foreground">Withdrawal not found</p>
        <button onClick={() => navigate('/admin/withdrawals')} className="text-[13px] font-semibold text-primary hover:underline">
          Back to Withdrawals
        </button>
      </div>
    )
  }

  const sc      = statusConfig[wd.status]
  const entries = MOCK_CHANGELOGS[wd.id] ?? []

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="px-6 pt-4 border-b border-black/[0.06] bg-card shrink-0">
        <div className="flex items-center gap-4 pb-3">
          <button onClick={() => navigate('/admin/withdrawals')}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground border border-black/[0.08] hover:bg-[#F4F5F7] hover:text-foreground transition-all shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
            <button onClick={() => navigate('/admin/withdrawals')} className="hover:text-foreground transition-colors">Withdrawals</button>
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            <span className="text-foreground font-semibold">{wd.userName} · #{wd.id}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {([{ key: 'info', label: 'Info' }, { key: 'changelog', label: 'Change Log' }] as { key: Tab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={['px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-all',
                tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'].join(' ')}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Info tab */}
      {tab === 'info' && (
        <div className="flex-1 overflow-auto bg-background">
          <div className="max-w-2xl mx-auto px-6 py-6 flex flex-col gap-5">

            {/* User */}
            <div className="bg-card rounded-2xl border border-black/[0.06]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div className="px-6 py-4 border-b border-black/[0.06]">
                <p className="text-[14px] font-bold text-foreground">Requester</p>
                <p className="text-[12px] font-medium text-muted-foreground">User who submitted the withdrawal</p>
              </div>
              <div className="p-6 flex items-center gap-4">
                <span className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white text-[14px] font-bold ${avatarColor(wd.avatar)}`}>{wd.avatar}</span>
                <div>
                  <p className="text-[15px] font-bold text-foreground">{wd.userName}</p>
                  <p className="text-[13px] font-medium text-muted-foreground font-mono">{wd.phone}</p>
                </div>
              </div>
            </div>

            {/* Withdrawal details */}
            <div className="bg-card rounded-2xl border border-black/[0.06]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div className="px-6 py-4 border-b border-black/[0.06]">
                <p className="text-[14px] font-bold text-foreground">Withdrawal Details</p>
                <p className="text-[12px] font-medium text-muted-foreground">Amount, status, and timing</p>
              </div>
              <div className="p-6 grid grid-cols-3 gap-6">
                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Amount</p>
                  <p className="text-[20px] font-extrabold text-foreground leading-none">
                    {fmt(wd.amount)}
                    <span className="text-[12px] font-medium text-muted-foreground ml-1.5">UZS</span>
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold w-fit ${sc.bg} ${sc.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Requested At</p>
                  <p className="text-[13px] font-semibold text-foreground">{wd.requestedAt}</p>
                </div>
              </div>
            </div>

            {/* Receiver */}
            <div className="bg-card rounded-2xl border border-black/[0.06]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div className="px-6 py-4 border-b border-black/[0.06]">
                <p className="text-[14px] font-bold text-foreground">Receiver</p>
                <p className="text-[12px] font-medium text-muted-foreground">Delivery recipient details</p>
              </div>
              <div className="p-6 grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Name</p>
                  <p className="text-[14px] font-semibold text-foreground">{wd.receiverName}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Phone</p>
                  <p className="text-[14px] font-semibold text-foreground font-mono">{wd.receiverPhone}</p>
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Address</p>
                  <p className="text-[13px] font-medium text-foreground leading-relaxed">{wd.receiverAddress}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Log tab */}
      {tab === 'changelog' && (
        <div className="flex-1 overflow-auto bg-background">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#F4F5F7] flex items-center justify-center">
                <svg className="w-5 h-5 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" />
                </svg>
              </div>
              <p className="text-[14px] font-semibold text-muted-foreground">No changes recorded yet</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto px-6 py-6">
              <div className="relative flex flex-col gap-0">
                <div className="absolute left-[13px] top-7 bottom-7 w-px bg-black/[0.06]" />
                {[...entries].reverse().map((entry, i) => (
                  <div key={entry.id} className={['flex gap-4 relative', i > 0 ? 'mt-5' : ''].join(' ')}>
                    {changeIcon(entry.type)}
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-semibold text-foreground">{entry.label}</p>
                          {entry.from && entry.to && (
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="text-[11px] font-medium text-muted-foreground bg-[#F4F5F7] px-2 py-0.5 rounded-md">{entry.from}</span>
                              <svg className="w-3 h-3 text-muted-foreground/50 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                              <span className="text-[11px] font-semibold bg-[#E8F0FE] text-blue-700 px-2 py-0.5 rounded-md">{entry.to}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">{entry.timestamp}</p>
                          <p className="text-[11px] font-semibold text-muted-foreground/70 mt-0.5">{entry.user}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
