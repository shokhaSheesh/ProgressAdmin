import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { callGateway, gatewayList, methods } from '../../api/gateway'
import { formatDate } from '../../api/adminCrud'

// ─── Types ───────────────────────────────────────────────────────────────────

type Status = 'active' | 'inactive'

export interface Mechanic {
  id: string | number; name: string; avatar: string; phone: string
  region: string; regionId?: string; balance: number; status: Status; createdAt: string
}

export interface Seller {
  id: number; name: string; avatar: string; phone: string
  username: string; shop: string; balance: number; status: Status; createdAt: string
}

interface OrderItem { name: string; qty: number; price: string }
interface Order { ref: string; date: string; shopName: string; sellerName: string; items: OrderItem[]; bonus: number }
type ApiUserRow = {
  guid: string
  full_name?: string
  phone?: string
  login?: string
  balance?: string[] | number[] | string | number | null
  regions_id?: string
  region_name?: string
  is_active?: boolean
  created_at?: string
}
type UsersResponse = {
  users?: ApiUserRow[]
  data?: ApiUserRow[]
  total?: number
}
type RegionRow = { guid: string; name?: string }
type RegionsResponse = { regions?: RegionRow[]; data?: RegionRow[] }

// ─── Mock data — Mechanics ───────────────────────────────────────────────────

export const mechanics: Mechanic[] = [
  { id: 1,  name: 'Akmal Karimov',    avatar: 'AK', phone: '+998 90 123 45 67', region: 'Tashkent',  balance: 125000, status: 'active',   createdAt: 'Jan 12, 2026' },
  { id: 2,  name: 'Bobur Toshmatov',  avatar: 'BT', phone: '+998 91 234 56 78', region: 'Samarkand', balance: 87500,  status: 'active',   createdAt: 'Feb 3, 2026'  },
  { id: 3,  name: 'Dilshod Yusupov',  avatar: 'DY', phone: '+998 93 345 67 89', region: 'Bukhara',   balance: 0,      status: 'inactive', createdAt: 'Feb 18, 2026' },
  { id: 4,  name: 'Eldor Nazarov',    avatar: 'EN', phone: '+998 94 456 78 90', region: 'Namangan',  balance: 210000, status: 'active',   createdAt: 'Mar 1, 2026'  },
  { id: 5,  name: 'Firdavs Rakhimov', avatar: 'FR', phone: '+998 97 567 89 01', region: 'Andijan',   balance: 45000,  status: 'active',   createdAt: 'Mar 14, 2026' },
  { id: 6,  name: 'Javlon Mirzaev',   avatar: 'JM', phone: '+998 90 678 90 12', region: 'Fergana',   balance: 0,      status: 'inactive', createdAt: 'Mar 22, 2026' },
  { id: 7,  name: 'Komil Hasanov',    avatar: 'KH', phone: '+998 91 789 01 23', region: 'Nukus',     balance: 165000, status: 'active',   createdAt: 'Apr 5, 2026'  },
  { id: 8,  name: 'Laziz Ergashev',   avatar: 'LE', phone: '+998 93 890 12 34', region: 'Termez',    balance: 32000,  status: 'active',   createdAt: 'Apr 19, 2026' },
  { id: 9,  name: 'Mirzo Sobirov',    avatar: 'MS', phone: '+998 94 901 23 45', region: 'Qarshi',    balance: 78000,  status: 'inactive', createdAt: 'May 2, 2026'  },
  { id: 10, name: 'Nodir Qodirov',    avatar: 'NQ', phone: '+998 97 012 34 56', region: 'Jizzakh',   balance: 290000, status: 'active',   createdAt: 'May 20, 2026' },
  { id: 11, name: 'Otabek Islomov',   avatar: 'OI', phone: '+998 90 123 00 11', region: 'Tashkent',  balance: 55000,  status: 'active',   createdAt: 'Jun 1, 2026'  },
  { id: 12, name: 'Sardor Pulatov',   avatar: 'SP', phone: '+998 91 234 11 22', region: 'Samarkand', balance: 0,      status: 'inactive', createdAt: 'Jun 10, 2026' },
]

const recentOrders: Record<string, Order[]> = {
  1: [
    { ref: 'ORD-2606-A12', date: 'Jun 20, 2026 · 14:32', shopName: 'AutoZone Tashkent', sellerName: 'Bekzod Saidov', items: [{ name: 'Oil Filter', qty: 2, price: '45 000' }, { name: 'Engine Belt', qty: 1, price: '120 000' }], bonus: 6300 },
    { ref: 'ORD-2606-A08', date: 'Jun 18, 2026 · 09:15', shopName: 'CarParts Express',  sellerName: 'Jasur Tursunov', items: [{ name: 'Brake Pads', qty: 4, price: '85 000' }], bonus: 10200 },
  ],
  2: [
    { ref: 'ORD-2606-B07', date: 'Jun 19, 2026 · 11:40', shopName: 'SparkMaster Pro',   sellerName: 'Dilnoza Yusupova', items: [{ name: 'Spark Plugs', qty: 4, price: '35 000' }], bonus: 4200 },
    { ref: 'ORD-2605-B44', date: 'May 28, 2026 · 16:00', shopName: 'AutoZone Tashkent', sellerName: 'Bekzod Saidov', items: [{ name: 'Air Filter', qty: 1, price: '55 000' }, { name: 'Fuel Filter', qty: 1, price: '40 000' }], bonus: 2850 },
  ],
  4: [
    { ref: 'ORD-2606-C03', date: 'Jun 17, 2026 · 13:22', shopName: 'SuspensionKing',    sellerName: 'Murod Xasanov', items: [{ name: 'Shock Absorber', qty: 2, price: '320 000' }], bonus: 19200 },
    { ref: 'ORD-2606-C01', date: 'Jun 15, 2026 · 10:05', shopName: 'TireHub Yunusabad', sellerName: 'Sherzod Aliev', items: [{ name: 'Tire 205/55R16', qty: 4, price: '480 000' }], bonus: 57600 },
  ],
  7: [
    { ref: 'ORD-2606-D19', date: 'Jun 21, 2026 · 08:50', shopName: 'CarParts Express',  sellerName: 'Jasur Tursunov', items: [{ name: 'Radiator Hose', qty: 1, price: '75 000' }], bonus: 2250 },
    { ref: 'ORD-2604-D55', date: 'Apr 30, 2026 · 17:30', shopName: 'AutoZone Tashkent', sellerName: 'Bekzod Saidov', items: [{ name: 'Coolant 5L', qty: 2, price: '90 000' }], bonus: 5400 },
  ],
}

// ─── Mock data — Sellers ─────────────────────────────────────────────────────

export const sellers: Seller[] = [
  { id: 1,  name: 'Bekzod Saidov',    avatar: 'BS', phone: '+998 90 111 22 33', username: 'bekzod.s',    shop: 'AutoZone Tashkent',   balance: 340000, status: 'active',   createdAt: 'Jan 5, 2026'  },
  { id: 2,  name: 'Jasur Tursunov',   avatar: 'JT', phone: '+998 91 222 33 44', username: 'jasur.t',     shop: 'CarParts Express',    balance: 175000, status: 'active',   createdAt: 'Jan 20, 2026' },
  { id: 3,  name: 'Dilnoza Yusupova', avatar: 'DY', phone: '+998 93 333 44 55', username: 'dilnoza.y',   shop: 'SparkMaster Pro',     balance: 0,      status: 'inactive', createdAt: 'Feb 8, 2026'  },
  { id: 4,  name: 'Murod Xasanov',    avatar: 'MX', phone: '+998 94 444 55 66', username: 'murod.x',     shop: 'SuspensionKing',      balance: 520000, status: 'active',   createdAt: 'Feb 22, 2026' },
  { id: 5,  name: 'Sherzod Aliev',    avatar: 'SA', phone: '+998 97 555 66 77', username: 'sherzod.a',   shop: 'TireHub Yunusabad',   balance: 98000,  status: 'active',   createdAt: 'Mar 10, 2026' },
  { id: 6,  name: 'Nilufar Rakhimova',avatar: 'NR', phone: '+998 90 666 77 88', username: 'nilufar.r',   shop: 'AutoZone Tashkent',   balance: 0,      status: 'inactive', createdAt: 'Mar 25, 2026' },
  { id: 7,  name: 'Sanjar Mirzaev',   avatar: 'SM', phone: '+998 91 777 88 99', username: 'sanjar.m',    shop: 'MotoHub Andijan',     balance: 212000, status: 'active',   createdAt: 'Apr 12, 2026' },
  { id: 8,  name: 'Zulfiya Karimova', avatar: 'ZK', phone: '+998 93 888 99 00', username: 'zulfiya.k',   shop: 'DriveZone Samarkand', balance: 67000,  status: 'active',   createdAt: 'Apr 28, 2026' },
  { id: 9,  name: 'Otajon Yuldashev', avatar: 'OY', phone: '+998 94 999 00 11', username: 'otajon.y',    shop: 'CarParts Express',    balance: 0,      status: 'inactive', createdAt: 'May 14, 2026' },
  { id: 10, name: 'Kamola Nazarova',  avatar: 'KN', phone: '+998 97 000 11 22', username: 'kamola.n',    shop: 'SparkMaster Pro',     balance: 445000, status: 'active',   createdAt: 'Jun 2, 2026'  },
]

const REGIONS = ['Tashkent', 'Samarkand', 'Bukhara', 'Namangan', 'Andijan', 'Fergana', 'Nukus', 'Termez', 'Qarshi', 'Jizzakh']

// ─── Helpers ─────────────────────────────────────────────────────────────────

const avatarColors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500']

function formatBalance(n: number) {
  return n === 0 ? '0' : n.toLocaleString('ru-RU').replace(/,/g, ' ')
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'U'
}

function parseBalance(value: ApiUserRow['balance']) {
  if (Array.isArray(value)) return Number(value[0]) || 0
  return Number(value) || 0
}

function mapUser(row: ApiUserRow): Mechanic {
  const name = row.full_name || row.login || row.phone || 'Unnamed user'
  return {
    id: row.guid,
    name,
    avatar: initials(name),
    phone: row.phone || '',
    region: row.region_name || '',
    regionId: row.regions_id,
    balance: parseBalance(row.balance),
    status: row.is_active === false ? 'inactive' : 'active',
    createdAt: formatDate(row.created_at),
  }
}

const statusConfig: Record<Status, { label: string; bg: string; text: string }> = {
  active:   { label: 'Active',   bg: 'bg-emerald-50', text: 'text-emerald-600' },
  inactive: { label: 'Inactive', bg: 'bg-red-50',     text: 'text-red-500'     },
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

// ─── Backdrop ────────────────────────────────────────────────────────────────

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

// ─── Shared: Delete confirmation ──────────────────────────────────────────────

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
            <p className="text-[18px] font-extrabold text-foreground">Delete User</p>
            <p className="text-[13px] font-medium text-muted-foreground mt-2 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-foreground">{name}</span>? This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3 px-8 pb-8">
          <button onClick={onClose} className="flex-1 rounded-xl py-3 text-[13px] font-semibold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 rounded-xl py-3 text-[13px] font-semibold bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] transition-all" style={{ boxShadow: '0 2px 8px rgba(239,68,68,0.3)' }}>
            Yes, Delete
          </button>
        </div>
      </div>
    </ModalBackdrop>
  )
}

// ─── Mechanics: Detail modal ──────────────────────────────────────────────────

function MechanicModal({ mechanic, idx, onClose, onEdit, onDelete }: {
  mechanic: Mechanic; idx: number; onClose: () => void; onEdit: () => void; onDelete: () => void
}) {
  const avatarBg = avatarColors[idx % avatarColors.length]
  const sc       = statusConfig[mechanic.status]
  const orders   = recentOrders[mechanic.id] ?? []

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-card rounded-2xl w-[680px] max-w-full max-h-[90vh] overflow-y-auto flex flex-col" style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}>
        <div className="flex items-center gap-4 p-6 border-b border-black/[0.06] sticky top-0 bg-card z-10 rounded-t-2xl">
          <span className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-[14px] font-bold shrink-0 ${avatarBg}`}>{mechanic.avatar}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[17px] font-bold text-foreground leading-tight">{mechanic.name}</p>
            <p className="text-[13px] font-medium text-muted-foreground">{mechanic.phone}</p>
          </div>
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl shrink-0 ${sc.bg} ${sc.text}`}>{sc.label}</span>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Details</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Region',         value: mechanic.region },
                { label: 'Created At',     value: mechanic.createdAt },
                { label: 'Wallet Balance', value: `${formatBalance(mechanic.balance)} UZS` },
                { label: 'Status',         value: mechanic.status === 'active' ? 'Active' : 'Inactive' },
              ].map((row) => (
                <div key={row.label} className="bg-[#F4F5F7] rounded-xl px-4 py-3">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{row.label}</p>
                  <p className="text-[14px] font-bold text-foreground">{row.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Orders</p>
            {orders.length === 0 ? (
              <div className="rounded-xl border border-black/[0.06] px-4 py-8 flex flex-col items-center justify-center gap-2">
                <svg className="w-8 h-8 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" />
                </svg>
                <p className="text-[13px] font-medium text-muted-foreground">No orders yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {orders.map((order) => (
                  <div key={order.ref} className="rounded-xl border border-black/[0.06] p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-mono text-muted-foreground/60 mb-0.5">{order.ref}</p>
                        <p className="text-[14px] font-bold text-foreground">{order.shopName}</p>
                        <p className="text-[12px] font-medium text-muted-foreground">{order.date}</p>
                      </div>
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">Completed</span>
                    </div>
                    <div className="bg-[#F4F5F7] rounded-lg px-3 py-2 flex flex-col gap-1.5">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-[12px] font-medium text-foreground">{item.name} × {item.qty}</span>
                          <span className="text-[12px] font-semibold text-foreground">{item.price} UZS</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-medium text-muted-foreground">Bonus earned</span>
                      <span className="text-[13px] font-bold text-emerald-600">+{formatBalance(order.bonus)} UZS</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-3 text-[13px] font-semibold hover:bg-primary-hover active:scale-[0.98] transition-all" style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" />
              </svg>
              Edit Mechanic
            </button>
            <button onClick={onDelete} className="flex-1 flex items-center justify-center gap-2 border-2 border-red-100 bg-red-50 text-red-500 font-semibold rounded-xl py-3 text-[13px] hover:bg-red-100 transition-colors active:scale-[0.98]">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
              Delete Mechanic
            </button>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  )
}

// ─── Mechanics: Form modal ────────────────────────────────────────────────────

interface MechanicFormState { name: string; phone: string; region: string; status: Status }

function MechanicFormModal({ mechanic, regions, onClose, onSave }: { mechanic: Mechanic | null; regions: string[]; onClose: () => void; onSave: (d: MechanicFormState) => void }) {
  const isEdit = mechanic !== null
  const regionList = regions.length > 0 ? regions : REGIONS
  const [form, setForm] = useState<MechanicFormState>({
    name: mechanic?.name ?? '', phone: mechanic?.phone ?? '',
    region: mechanic?.region || regionList[0], status: mechanic?.status ?? 'active',
  })
  const [regionOpen, setRegionOpen] = useState(false)
  const regionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (regionRef.current && !regionRef.current.contains(e.target as Node)) setRegionOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  const set = (k: keyof MechanicFormState) => (v: string) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-card rounded-2xl w-[600px] max-w-full overflow-hidden" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.06]">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <svg className="w-[18px] h-[18px] text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isEdit ? 1.8 : 2} strokeLinecap="round" strokeLinejoin="round">
                {isEdit ? <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" /></> : <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>}
              </svg>
            </span>
            <div>
              <p className="text-[16px] font-bold text-foreground">{isEdit ? 'Edit Mechanic' : 'Add New Mechanic'}</p>
              <p className="text-[12px] font-medium text-muted-foreground">{isEdit ? `Editing ${mechanic.name}` : 'Fill in the details below'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (form.name.trim() && form.phone.trim()) onSave(form) }} className="p-6 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Full Name</label>
              <input type="text" value={form.name} onChange={(e) => set('name')(e.target.value)} placeholder="e.g. Akmal Karimov" required className="w-full bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[13px] font-medium border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</label>
              <input type="text" value={form.phone} onChange={(e) => set('phone')(e.target.value)} placeholder="+998 90 000 00 00" required className="w-full bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[13px] font-medium border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Region</label>
              <div ref={regionRef} className="relative">
                <button type="button" onClick={() => setRegionOpen((o) => !o)} className={['w-full flex items-center justify-between bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[13px] font-medium border transition-all', regionOpen ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'].join(' ')}>
                  <span>{form.region}</span>
                  <svg className={['w-4 h-4 text-muted-foreground transition-transform', regionOpen ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </button>
                {regionOpen && (
                  <div className="absolute bottom-full mb-1.5 left-0 right-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-10 max-h-48 overflow-y-auto" style={{ boxShadow: '0 -8px 24px rgba(0,0,0,0.12)' }}>
                    {regionList.map((r) => (
                      <button key={r} type="button" onClick={() => { set('region')(r); setRegionOpen(false) }} className={['w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors', form.region === r ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>{r}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
              <div className="flex gap-2 h-[46px]">
                {(['active', 'inactive'] as Status[]).map((s) => (
                  <button key={s} type="button" onClick={() => set('status')(s)} className={['flex-1 flex items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold border-2 transition-all', form.status === s ? (s === 'active' ? 'bg-emerald-50 border-emerald-400 text-emerald-600' : 'bg-red-50 border-red-400 text-red-500') : 'bg-[#F4F5F7] border-transparent text-muted-foreground hover:border-black/10'].join(' ')}>
                    <span className={['w-2 h-2 rounded-full shrink-0', form.status === s ? (s === 'active' ? 'bg-emerald-500' : 'bg-red-400') : 'bg-muted-foreground/30'].join(' ')} />
                    {s === 'active' ? 'Active' : 'Inactive'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl py-3 text-[13px] font-semibold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors">Cancel</button>
            <button type="submit" className="flex-1 rounded-xl py-3 text-[13px] font-semibold bg-primary text-white hover:bg-primary-hover active:scale-[0.98] transition-all" style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>{isEdit ? 'Save Changes' : 'Add Mechanic'}</button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  )
}

// ─── Page-size dropdown (upward) ─────────────────────────────────────────────

const PAGE_SIZES = [20, 30, 40]

function PageSizeDropdown({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className={['flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all', open ? 'border-primary text-primary bg-primary/5' : 'border-black/[0.08] text-muted-foreground hover:border-black/20 hover:text-foreground'].join(' ')}>
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
const statusFilterOptions: { value: StatusFilter; label: string; dot?: string }[] = [
  { value: 'all',      label: 'All Statuses' },
  { value: 'active',   label: 'Active',   dot: 'bg-emerald-500' },
  { value: 'inactive', label: 'Inactive', dot: 'bg-red-500'     },
]

function StatusFilterDropdown({ value, onChange }: { value: StatusFilter; onChange: (v: StatusFilter) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = statusFilterOptions.find((o) => o.value === value)!
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className={['flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-semibold border-2 transition-all whitespace-nowrap', open || value !== 'all' ? 'border-primary text-primary bg-primary/5' : 'border-black/[0.08] text-foreground bg-card hover:border-black/20'].join(' ')}>
        {current.dot && <span className={`w-2 h-2 rounded-full shrink-0 ${current.dot}`} />}
        {current.label}
        <svg className={['w-4 h-4 transition-transform', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 right-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-20 min-w-[160px]" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {statusFilterOptions.map((opt) => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }} className={['w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors', opt.value === value ? 'bg-primary/[0.08] text-primary font-semibold' : 'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>
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

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconUsersAll = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
const IconUserActive = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <polyline points="16 11 18 13 22 9" />
  </svg>
)
const IconUserInactive = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <line x1="17" y1="8" x2="23" y2="14" /><line x1="23" y1="8" x2="17" y2="14" />
  </svg>
)

// ─── Reusable table toolbar ───────────────────────────────────────────────────

function TableToolbar({ search, onSearch, statusFilter, onStatusFilter, onAdd, addLabel }: {
  search: string; onSearch: (v: string) => void
  statusFilter: StatusFilter; onStatusFilter: (v: StatusFilter) => void
  onAdd: () => void; addLabel: string
}) {
  return (
    <div className="px-5 py-3.5 border-b border-black/[0.06] flex items-center gap-3">
      <div className="relative flex-1">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="text" value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search by name, phone…" className="w-full h-9 pl-9 pr-8 bg-[#F4F5F7] rounded-xl text-[13px] font-medium text-foreground border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
        {search && (
          <button onClick={() => onSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors">
            <svg className="w-2.5 h-2.5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        )}
      </div>
      <StatusFilterDropdown value={statusFilter} onChange={onStatusFilter} />
      <div className="w-px h-6 bg-black/[0.08] shrink-0" />
      <button onClick={onAdd} className="bg-primary text-white rounded-xl px-4 py-2 text-[13px] font-semibold hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center gap-1.5 shrink-0" style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        {addLabel}
      </button>
    </div>
  )
}

// ─── Reusable pagination footer ───────────────────────────────────────────────

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
        <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        {range[0] > 1 && (<>
          <button onClick={() => onPage(1)} className="w-8 h-8 rounded-lg text-[13px] font-semibold text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">1</button>
          {range[0] > 2 && <span className="w-8 h-8 flex items-center justify-center text-[13px] text-muted-foreground">…</span>}
        </>)}
        {range.map((p) => (
          <button key={p} onClick={() => onPage(p)} className={['w-8 h-8 rounded-lg text-[13px] font-semibold transition-all', p === page ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground'].join(' ')}>{p}</button>
        ))}
        {range[range.length - 1] < pageCount && (<>
          {range[range.length - 1] < pageCount - 1 && <span className="w-8 h-8 flex items-center justify-center text-[13px] text-muted-foreground">…</span>}
          <button onClick={() => onPage(pageCount)} className="w-8 h-8 rounded-lg text-[13px] font-semibold text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">{pageCount}</button>
        </>)}
        <button onClick={() => onPage(Math.min(pageCount, page + 1))} disabled={page === pageCount || pageCount === 0} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptySearch({ onClear }: { onClear: () => void }) {
  return (
    <tr><td colSpan={8} className="px-5 py-16 text-center">
      <div className="flex flex-col items-center gap-2">
        <svg className="w-8 h-8 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <p className="text-[13px] font-semibold text-muted-foreground">No results match your search</p>
        <button onClick={onClear} className="text-[12px] font-semibold text-primary hover:underline">Clear filters</button>
      </div>
    </td></tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type MechanicModalState = { kind: 'detail'; mechanic: Mechanic; idx: number } | { kind: 'edit'; mechanic: Mechanic } | { kind: 'delete'; mechanic: Mechanic } | { kind: 'create' } | null

export default function UsersPage() {
  // Mechanics state
  const [mModal, setMModal]   = useState<MechanicModalState>(null)
  const [mPage, setMPage]     = useState(1)
  const [mSize, setMSize]     = useState(20)
  const [mSearch, setMSearch] = useState('')
  const [mFilter, setMFilter] = useState<StatusFilter>('all')
  const [mRows, setMRows] = useState<Mechanic[]>([])
  const [mListTotal, setMListTotal] = useState(0)
  const [mStatTotal, setMStatTotal] = useState(0)
  const [mActive, setMActive] = useState(0)
  const [mInactive, setMInactive] = useState(0)
  const [regions, setRegions] = useState<RegionRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const regionNames = regions.map(region => region.name || '').filter(Boolean)
  const regionOptions = regionNames.length > 0 ? regionNames : REGIONS

  function regionIdByName(name: string) {
    return regions.find(region => region.name === name)?.guid
  }

  const loadUsers = () => {
    setLoading(true)
    setError('')
    const filter: Record<string, unknown> = {}
    if (mFilter !== 'all') filter.status = mFilter
    gatewayList<UsersResponse>(methods.users.list, {
      page: mPage,
      limit: mSize,
      search: mSearch.trim() || undefined,
      filter,
      sort: { created_at: -1 },
    })
      .then(response => {
        const rows = response.users || response.data || []
        setMRows(rows.map(mapUser))
        setMListTotal(response.total ?? rows.length)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load users'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadUsers()
  }, [mPage, mSize, mSearch, mFilter])

  useEffect(() => {
    gatewayList<RegionsResponse>(methods.regions.list, { page: 1, limit: 500, sort: { created_at: -1 } })
      .then(response => setRegions(response.regions || response.data || []))
      .catch(() => setRegions([]))
    Promise.all([
      gatewayList<UsersResponse>(methods.users.list, { page: 1, limit: 1 }),
      gatewayList<UsersResponse>(methods.users.list, { page: 1, limit: 1, filter: { status: 'active' } }),
      gatewayList<UsersResponse>(methods.users.list, { page: 1, limit: 1, filter: { status: 'inactive' } }),
    ]).then(([total, active, inactive]) => {
      setMStatTotal(total.total ?? 0)
      setMActive(active.total ?? 0)
      setMInactive(inactive.total ?? 0)
    }).catch(() => {})
  }, [])

  const mPageCount = Math.ceil(mListTotal / mSize)
  const mPaginated = mRows

  const handleMSearch = (v: string) => { setMSearch(v); setMPage(1) }
  const handleMFilter = (v: StatusFilter) => { setMFilter(v); setMPage(1) }
  const saveMechanic = async (mechanic: Mechanic | null, form: MechanicFormState) => {
    const payload = {
      full_name: form.name,
      phone: form.phone,
      login: form.phone,
      regions_id: regionIdByName(form.region) || mechanic?.regionId,
      balance: [String(mechanic?.balance ?? 0)],
      is_active: form.status === 'active',
    }
    await callGateway(mechanic ? methods.users.update : methods.users.create, mechanic ? { ...payload, guid: mechanic.id } : payload)
    setMModal(null)
    loadUsers()
  }
  const deleteMechanic = async (mechanic: Mechanic) => {
    await callGateway(methods.users.delete, { guid: mechanic.id })
    setMModal(null)
    loadUsers()
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Users</h1>
        <p className="text-[13px] font-medium text-muted-foreground mt-0.5">Manage mechanics on the platform</p>
      </div>

      {/* ══ MECHANICS ══ */}
      <>

          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Total"    value={mStatTotal}       iconBg="bg-primary"     icon={<IconUsersAll />}    />
            <StatCard label="Active"   value={mActive}          iconBg="bg-emerald-500" icon={<IconUserActive />}  />
            <StatCard label="Inactive" value={mInactive}        iconBg="bg-red-500"     icon={<IconUserInactive />} />
          </div>

          <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <TableToolbar
              search={mSearch} onSearch={handleMSearch}
              statusFilter={mFilter} onStatusFilter={handleMFilter}
              onAdd={() => setMModal({ kind: 'create' })} addLabel="Add Mechanic"
            />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/[0.05]">
                    {['Mechanic', 'Phone', 'Region', 'Wallet Balance', 'Status', 'Created At', ''].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="px-5 py-16 text-center text-[13px] font-semibold text-muted-foreground">Loading users...</td></tr>
                  ) : error ? (
                    <tr><td colSpan={8} className="px-5 py-16 text-center text-[13px] font-semibold text-red-500">{error}</td></tr>
                  ) : mPaginated.length === 0
                    ? <EmptySearch onClear={() => { handleMSearch(''); handleMFilter('all') }} />
                    : mPaginated.map((m, idx) => {
                        const sc       = statusConfig[m.status]
                        const avatarBg = avatarColors[idx % avatarColors.length]
                        return (
                          <tr key={m.id} onClick={() => setMModal({ kind: 'detail', mechanic: m, idx })} className="border-b border-black/[0.04] hover:bg-[#F4F5F7]/70 transition-colors last:border-0 cursor-pointer">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-bold ${avatarBg}`}>{m.avatar}</span>
                                <span className="text-[13px] font-semibold text-foreground whitespace-nowrap">{m.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-[13px] font-medium text-foreground">{m.phone}</td>
                            <td className="px-5 py-3.5 text-[13px] font-medium text-foreground">{m.region}</td>
                            <td className="px-5 py-3.5 text-[13px] font-semibold text-foreground">{formatBalance(m.balance)}<span className="text-[11px] font-medium text-muted-foreground ml-1">UZS</span></td>
                            <td className="px-5 py-3.5"><span className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl ${sc.bg} ${sc.text}`}>{sc.label}</span></td>
                            <td className="px-5 py-3.5 text-[13px] font-medium text-muted-foreground">{m.createdAt}</td>
                            <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1">
                                <button title="Edit" onClick={() => setMModal({ kind: 'edit', mechanic: m })} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" /></svg>
                                </button>
                                <button title="Delete" onClick={() => setMModal({ kind: 'delete', mechanic: m })} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all">
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                  }
                </tbody>
              </table>
            </div>
            <PaginationFooter page={mPage} pageCount={mPageCount} pageSize={mSize} total={mListTotal} onPage={setMPage} onPageSize={(s) => { setMSize(s); setMPage(1) }} />
          </div>
      </>

      {/* ── Mechanic modals ── */}
      {mModal?.kind === 'detail' && (
        <MechanicModal mechanic={mModal.mechanic} idx={mModal.idx} onClose={() => setMModal(null)}
          onEdit={() => setMModal({ kind: 'edit', mechanic: mModal.mechanic })}
          onDelete={() => setMModal({ kind: 'delete', mechanic: mModal.mechanic })} />
      )}
      {mModal?.kind === 'edit'   && <MechanicFormModal mechanic={mModal.mechanic} regions={regionOptions} onClose={() => setMModal(null)} onSave={(form) => saveMechanic(mModal.mechanic, form)} />}
      {mModal?.kind === 'create' && <MechanicFormModal mechanic={null} regions={regionOptions} onClose={() => setMModal(null)} onSave={(form) => saveMechanic(null, form)} />}
      {mModal?.kind === 'delete' && <DeleteModal name={mModal.mechanic.name}      onClose={() => setMModal(null)} onConfirm={() => deleteMechanic(mModal.mechanic)} />}

    </div>
  )
}
