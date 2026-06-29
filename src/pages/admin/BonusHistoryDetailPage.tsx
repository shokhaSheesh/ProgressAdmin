import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

// ─── Types ────────────────────────────────────────────────────────────────────

type TxType = 'received' | 'withdrawn'

export interface BonusTx {
  id: number
  userName: string
  avatar: string
  phone: string
  type: TxType
  amount: number
  date: string
}

// ─── Shared transaction store (matches BonusHistoryPage seed) ─────────────────

export const bonusTxStore: BonusTx[] = [
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
  type: 'created' | 'status' | 'amount' | 'approval'
  label: string
  from?: string
  to?: string
}

const MOCK_CHANGELOGS: Record<number, ChangeEntry[]> = {
  1:  [
    { id: 1, timestamp: 'Jun 21, 2026 · 09:14', user: 'System',      type: 'created',  label: 'Transaction created' },
    { id: 2, timestamp: 'Jun 21, 2026 · 09:15', user: 'Admin',       type: 'approval', label: 'Transaction approved' },
  ],
  2:  [
    { id: 1, timestamp: 'Jun 19, 2026 · 11:30', user: 'System',      type: 'created',  label: 'Transaction created' },
    { id: 2, timestamp: 'Jun 19, 2026 · 11:35', user: 'Admin',       type: 'status',   label: 'Status changed', from: 'Pending', to: 'Completed' },
  ],
  3:  [
    { id: 1, timestamp: 'Jun 18, 2026 · 14:05', user: 'System',      type: 'created',  label: 'Transaction created' },
    { id: 2, timestamp: 'Jun 18, 2026 · 14:10', user: 'Shokhruz S.', type: 'amount',   label: 'Amount adjusted', from: '10 000 UZS', to: '12 000 UZS' },
    { id: 3, timestamp: 'Jun 18, 2026 · 14:12', user: 'Admin',       type: 'approval', label: 'Transaction approved' },
  ],
  4:  [
    { id: 1, timestamp: 'Jun 18, 2026 · 08:55', user: 'System',      type: 'created',  label: 'Transaction created' },
    { id: 2, timestamp: 'Jun 18, 2026 · 09:00', user: 'Admin',       type: 'status',   label: 'Status changed', from: 'Pending', to: 'Completed' },
  ],
  5:  [
    { id: 1, timestamp: 'Jun 17, 2026 · 16:02', user: 'System',      type: 'created',  label: 'Transaction created' },
    { id: 2, timestamp: 'Jun 17, 2026 · 16:05', user: 'Admin',       type: 'approval', label: 'Transaction approved' },
  ],
  6:  [
    { id: 1, timestamp: 'Jun 17, 2026 · 10:20', user: 'System',      type: 'created',  label: 'Transaction created' },
    { id: 2, timestamp: 'Jun 17, 2026 · 10:22', user: 'Shokhruz S.', type: 'amount',   label: 'Amount adjusted', from: '180 000 UZS', to: '200 000 UZS' },
    { id: 3, timestamp: 'Jun 17, 2026 · 10:25', user: 'Admin',       type: 'status',   label: 'Status changed', from: 'Pending', to: 'Completed' },
  ],
  7:  [
    { id: 1, timestamp: 'Jun 16, 2026 · 12:48', user: 'System',      type: 'created',  label: 'Transaction created' },
    { id: 2, timestamp: 'Jun 16, 2026 · 12:50', user: 'Admin',       type: 'approval', label: 'Transaction approved' },
  ],
  8:  [
    { id: 1, timestamp: 'Jun 15, 2026 · 10:21', user: 'System',      type: 'created',  label: 'Transaction created' },
    { id: 2, timestamp: 'Jun 15, 2026 · 10:28', user: 'Admin',       type: 'status',   label: 'Status changed', from: 'Pending', to: 'Completed' },
  ],
  9:  [
    { id: 1, timestamp: 'Jun 14, 2026 · 09:33', user: 'System',      type: 'created',  label: 'Transaction created' },
    { id: 2, timestamp: 'Jun 14, 2026 · 09:40', user: 'Admin',       type: 'status',   label: 'Status changed', from: 'Pending', to: 'Completed' },
  ],
  10: [
    { id: 1, timestamp: 'Jun 14, 2026 · 07:33', user: 'System',      type: 'created',  label: 'Transaction created' },
    { id: 2, timestamp: 'Jun 14, 2026 · 07:45', user: 'Shokhruz S.', type: 'amount',   label: 'Amount adjusted', from: '90 000 UZS', to: '95 000 UZS' },
    { id: 3, timestamp: 'Jun 14, 2026 · 07:47', user: 'Admin',       type: 'status',   label: 'Status changed', from: 'Pending', to: 'Completed' },
  ],
  11: [
    { id: 1, timestamp: 'Jun 12, 2026 · 11:15', user: 'System',      type: 'created',  label: 'Transaction created' },
    { id: 2, timestamp: 'Jun 12, 2026 · 11:18', user: 'Admin',       type: 'approval', label: 'Transaction approved' },
  ],
  12: [
    { id: 1, timestamp: 'Jun 12, 2026 · 15:10', user: 'System',      type: 'created',  label: 'Transaction created' },
    { id: 2, timestamp: 'Jun 12, 2026 · 15:20', user: 'Admin',       type: 'status',   label: 'Status changed', from: 'Pending', to: 'Completed' },
  ],
  13: [
    { id: 1, timestamp: 'Jun 11, 2026 · 13:22', user: 'System',      type: 'created',  label: 'Transaction created' },
    { id: 2, timestamp: 'Jun 11, 2026 · 13:24', user: 'Admin',       type: 'approval', label: 'Transaction approved' },
  ],
  14: [
    { id: 1, timestamp: 'Jun 10, 2026 · 08:41', user: 'System',      type: 'created',  label: 'Transaction created' },
    { id: 2, timestamp: 'Jun 10, 2026 · 08:43', user: 'Admin',       type: 'approval', label: 'Transaction approved' },
  ],
  15: [
    { id: 1, timestamp: 'Jun 9, 2026 · 16:57',  user: 'System',      type: 'created',  label: 'Transaction created' },
    { id: 2, timestamp: 'Jun 9, 2026 · 17:00',  user: 'Admin',       type: 'approval', label: 'Transaction approved' },
  ],
}

function changeIcon(type: ChangeEntry['type']) {
  const wrap = (bg: string, color: string, path: React.ReactNode) => (
    <div className={`w-7 h-7 rounded-full ${bg} flex items-center justify-center shrink-0`}>
      <svg className={`w-3.5 h-3.5 ${color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">{path}</svg>
    </div>
  )
  switch (type) {
    case 'created':  return wrap('bg-blue-100',   'text-blue-600',   <><path d="M12 5v14M5 12h14" /></>)
    case 'status':   return wrap('bg-violet-100', 'text-violet-600', <><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></>)
    case 'amount':   return wrap('bg-amber-100',  'text-amber-600',  <><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>)
    default:         return wrap('bg-emerald-100','text-emerald-600',<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></>)
  }
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'info' | 'changelog'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BonusHistoryDetailPage() {
  const navigate = useNavigate()
  const { id }   = useParams<{ id: string }>()
  const tx       = bonusTxStore.find(t => t.id === Number(id))
  const [tab, setTab] = useState<Tab>('info')

  if (!tx) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <p className="text-[15px] font-bold text-foreground">Transaction not found</p>
        <button onClick={() => navigate('/admin/bonus-history')} className="text-[13px] font-semibold text-primary hover:underline">
          Back to Bonus History
        </button>
      </div>
    )
  }

  const isReceived = tx.type === 'received'
  const entries = MOCK_CHANGELOGS[tx.id] ?? []

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="px-6 pt-4 border-b border-black/[0.06] bg-card shrink-0">
        <div className="flex items-center gap-4 pb-3">
          <button onClick={() => navigate('/admin/bonus-history')}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground border border-black/[0.08] hover:bg-[#F4F5F7] hover:text-foreground transition-all shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
            <button onClick={() => navigate('/admin/bonus-history')} className="hover:text-foreground transition-colors">Bonus History</button>
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            <span className="text-foreground font-semibold">{tx.userName} · #{tx.id}</span>
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

            {/* User card */}
            <div className="bg-card rounded-2xl border border-black/[0.06]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div className="px-6 py-4 border-b border-black/[0.06]">
                <p className="text-[14px] font-bold text-foreground">User</p>
                <p className="text-[12px] font-medium text-muted-foreground">Transaction owner</p>
              </div>
              <div className="p-6 flex items-center gap-4">
                <span className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white text-[14px] font-bold ${avatarColor(tx.avatar)}`}>{tx.avatar}</span>
                <div>
                  <p className="text-[15px] font-bold text-foreground">{tx.userName}</p>
                  <p className="text-[13px] font-medium text-muted-foreground font-mono">{tx.phone}</p>
                </div>
              </div>
            </div>

            {/* Transaction details card */}
            <div className="bg-card rounded-2xl border border-black/[0.06]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div className="px-6 py-4 border-b border-black/[0.06]">
                <p className="text-[14px] font-bold text-foreground">Transaction Details</p>
                <p className="text-[12px] font-medium text-muted-foreground">Type, amount, and date</p>
              </div>
              <div className="p-6 grid grid-cols-3 gap-6">
                <div className="flex flex-col gap-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Type</p>
                  <span className={['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold w-fit', isReceived ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'].join(' ')}>
                    <span className={['w-1.5 h-1.5 rounded-full', isReceived ? 'bg-emerald-500' : 'bg-red-400'].join(' ')} />
                    {isReceived ? 'Received' : 'Withdrawn'}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Amount</p>
                  <p className={['text-[18px] font-extrabold leading-none', isReceived ? 'text-emerald-600' : 'text-red-500'].join(' ')}>
                    {isReceived ? '+' : '−'}{fmt(tx.amount)}
                    <span className="text-[12px] font-medium text-muted-foreground ml-1">UZS</span>
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date</p>
                  <p className="text-[13px] font-semibold text-foreground">{tx.date}</p>
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
                            <div className="flex items-center gap-1.5 mt-1">
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
