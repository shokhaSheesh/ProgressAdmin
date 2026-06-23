import { useParams, useNavigate } from 'react-router-dom'
import { mechanics } from './UsersPage'

const avatarColors = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-pink-500',  'bg-cyan-500',
]

function formatBalance(n: number) {
  return n === 0 ? '0' : n.toLocaleString('ru-RU').replace(/,/g, ' ')
}

export default function MechanicDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const mechanic = mechanics.find((m) => m.id === Number(id))

  if (!mechanic) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-3 py-24">
        <p className="text-[15px] font-bold text-foreground">Mechanic not found</p>
        <button onClick={() => navigate('/admin/users')} className="text-[13px] font-semibold text-primary hover:underline">
          ← Back to Users
        </button>
      </div>
    )
  }

  const idx = mechanics.findIndex((m) => m.id === mechanic.id)
  const avatarBg = avatarColors[idx % avatarColors.length]
  const isActive = mechanic.status === 'active'

  return (
    <div className="p-6 flex flex-col gap-6 max-w-2xl">

      {/* Back */}
      <div>
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to Users
        </button>
        <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Mechanic Detail</h1>
        <p className="text-[13px] font-medium text-muted-foreground mt-0.5">Full profile information</p>
      </div>

      {/* Profile card */}
      <div className="bg-card rounded-2xl border border-black/[0.06] p-6 flex items-center gap-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <span className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-[20px] font-bold shrink-0 ${avatarBg}`}>
          {mechanic.avatar}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[18px] font-bold text-foreground">{mechanic.name}</p>
          <p className="text-[13px] font-medium text-muted-foreground mt-0.5">{mechanic.phone}</p>
        </div>
        <span className={['text-[11px] font-semibold px-2.5 py-1 rounded-xl shrink-0', isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'].join(' ')}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Info rows */}
      <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div className="px-6 py-4 border-b border-black/[0.06]">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Details</p>
        </div>
        {[
          { label: 'Full Name',      value: mechanic.name },
          { label: 'Phone Number',   value: mechanic.phone },
          { label: 'Region',         value: mechanic.region },
          { label: 'Wallet Balance', value: `${formatBalance(mechanic.balance)} UZS` },
          { label: 'Status',         value: isActive ? 'Active' : 'Inactive' },
          { label: 'Created At',     value: mechanic.createdAt },
        ].map((row, i, arr) => (
          <div key={row.label} className={['flex items-center justify-between px-6 py-4', i < arr.length - 1 ? 'border-b border-black/[0.04]' : ''].join(' ')}>
            <span className="text-[13px] font-semibold text-muted-foreground">{row.label}</span>
            <span className="text-[13px] font-semibold text-foreground">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          className="flex items-center gap-2 bg-primary text-white rounded-xl px-5 py-3 text-[13px] font-semibold hover:bg-primary-hover active:scale-[0.98] transition-all"
          style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" />
          </svg>
          Edit Mechanic
        </button>
        <button className="flex items-center gap-2 border-2 border-red-100 bg-red-50 text-red-500 font-semibold rounded-xl px-5 py-3 text-[13px] hover:bg-red-100 transition-colors active:scale-[0.98]">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  )
}
