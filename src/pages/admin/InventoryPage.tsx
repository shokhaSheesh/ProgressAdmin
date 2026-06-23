import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface InventoryItem {
  id: number
  name: string
  sku: string
  image: string
  shop: string
  available: number
  reserved: number
}

const SHOPS = [
  'AutoZone Tashkent', 'CarParts Express', 'MotoHub Andijan',
  'DriveZone Samarkand', 'TireHub Yunusabad',
]

const initialInventory: InventoryItem[] = [
  { id: 1,  name: 'Spark Plug Iridium', sku: 'NGK-SP-001-14MM', image: '', shop: 'AutoZone Tashkent',   available: 150, reserved: 12 },
  { id: 2,  name: 'Spark Plug Iridium', sku: 'NGK-SP-001-16MM', image: '', shop: 'AutoZone Tashkent',   available: 80,  reserved: 6  },
  { id: 3,  name: 'Brake Pads Set',     sku: 'BRB-BP-001-FRONT', image: '', shop: 'CarParts Express',    available: 40,  reserved: 9  },
  { id: 4,  name: 'Brake Pads Set',     sku: 'BRB-BP-001-REAR',  image: '', shop: 'CarParts Express',    available: 8,   reserved: 3  },
  { id: 5,  name: 'Oil Filter',         sku: 'MNN-OF-001',       image: '', shop: 'DriveZone Samarkand', available: 220, reserved: 24 },
  { id: 6,  name: 'Shock Absorber',     sku: 'MNR-SA-001-FL',    image: '', shop: 'MotoHub Andijan',     available: 12,  reserved: 4  },
  { id: 7,  name: 'Shock Absorber',     sku: 'MNR-SA-001-RL',    image: '', shop: 'MotoHub Andijan',     available: 0,   reserved: 0  },
  { id: 8,  name: 'Air Filter',         sku: 'MNN-AF-002',       image: '', shop: 'AutoZone Tashkent',   available: 95,  reserved: 15 },
  { id: 9,  name: 'Alternator Belt',    sku: 'CNT-AB-001',       image: '', shop: 'TireHub Yunusabad',   available: 5,   reserved: 2  },
  { id: 10, name: 'Wheel Bearing Kit',  sku: 'SKF-WB-001-FRONT', image: '', shop: 'DriveZone Samarkand', available: 20,  reserved: 5  },
  { id: 11, name: 'Oxygen Sensor',      sku: 'BSH-OS-001',       image: '', shop: 'CarParts Express',    available: 0,   reserved: 0  },
  { id: 12, name: 'Timing Belt Kit',    sku: 'CNT-TB-001',       image: '', shop: 'TireHub Yunusabad',   available: 34,  reserved: 7  },
  { id: 13, name: 'Brake Disc',         sku: 'BSH-BD-001-FRONT', image: '', shop: 'AutoZone Tashkent',   available: 18,  reserved: 6  },
  { id: 14, name: 'Brake Disc',         sku: 'BSH-BD-001-REAR',  image: '', shop: 'AutoZone Tashkent',   available: 9,   reserved: 1  },
]

const LOW_THRESHOLD = 10

type StockLevel = 'in' | 'low' | 'out'
const levelOf = (n: number): StockLevel => (n === 0 ? 'out' : n <= LOW_THRESHOLD ? 'low' : 'in')

const levelConfig: Record<StockLevel, { label: string; bg: string; text: string; dot: string }> = {
  in:  { label: 'In Stock',     bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  low: { label: 'Low Stock',    bg: 'bg-amber-50',   text: 'text-amber-600',   dot: 'bg-amber-500'   },
  out: { label: 'Out of Stock', bg: 'bg-red-50',     text: 'text-red-500',     dot: 'bg-red-400'     },
}

const avatarColors = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-pink-500', 'bg-cyan-500', 'bg-orange-500', 'bg-indigo-500',
]
const initials = (name: string) => name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>,
    document.body
  )
}

// ─── Adjust stock modal ──────────────────────────────────────────────────────

function AdjustModal({ item, onClose, onSave }: { item: InventoryItem; onClose: () => void; onSave: (n: number) => void }) {
  const [value, setValue] = useState(String(item.available))
  const num = Math.max(0, Number(value) || 0)
  const lvl = levelConfig[levelOf(num)]

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-card rounded-2xl w-[440px] max-w-full overflow-hidden" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.06]">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <svg className="w-[18px] h-[18px] text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /><line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </span>
            <div>
              <p className="text-[16px] font-bold text-foreground">Adjust Stock</p>
              <p className="text-[12px] font-medium text-muted-foreground">{item.name} · {item.shop}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(num) }} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Available Quantity</label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setValue(String(Math.max(0, num - 1)))}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-foreground border-2 border-black/[0.08] hover:bg-[#F4F5F7] transition-colors shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
              </button>
              <input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} autoFocus
                className="flex-1 text-center bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[15px] font-bold border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              <button type="button" onClick={() => setValue(String(num + 1))}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-foreground border-2 border-black/[0.08] hover:bg-[#F4F5F7] transition-colors shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              </button>
            </div>
            <span className={`self-start mt-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl ${lvl.bg} ${lvl.text}`}>{lvl.label}</span>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl py-3 text-[13px] font-semibold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors">Cancel</button>
            <button type="submit" className="flex-1 rounded-xl py-3 text-[13px] font-semibold bg-primary text-white hover:bg-primary-hover active:scale-[0.98] transition-all" style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>Save</button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  )
}

// ─── Filter dropdowns ────────────────────────────────────────────────────────

type StockFilter = 'all' | StockLevel

function StockFilterDropdown({ value, onChange }: { value: StockFilter; onChange: (v: StockFilter) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const options: { value: StockFilter; label: string; dot?: string }[] = [
    { value: 'all', label: 'All Stock' },
    { value: 'in',  label: 'In Stock',     dot: 'bg-emerald-500' },
    { value: 'low', label: 'Low Stock',    dot: 'bg-amber-500'   },
    { value: 'out', label: 'Out of Stock', dot: 'bg-red-400'     },
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

type ShopFilter = 'all' | string

function ShopFilterDropdown({ value, onChange }: { value: ShopFilter; onChange: (v: ShopFilter) => void }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQ('') } }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const filtered = q ? SHOPS.filter((s) => s.toLowerCase().includes(q.toLowerCase())) : SHOPS
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)}
        className={['flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-semibold border-2 transition-all whitespace-nowrap max-w-[220px]', open || value !== 'all' ? 'border-primary text-primary bg-primary/5' : 'border-black/[0.08] text-foreground bg-card hover:border-black/20'].join(' ')}>
        <span className="truncate">{value === 'all' ? 'All Shops' : value}</span>
        <svg className={['w-4 h-4 transition-transform shrink-0', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 right-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-20 min-w-[220px]" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          <div className="p-2 border-b border-black/[0.06]">
            <input autoFocus type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
              className="w-full bg-[#F4F5F7] rounded-lg px-3 py-1.5 text-[12px] font-medium text-foreground focus:outline-none" />
          </div>
          <div className="overflow-y-auto max-h-[220px]">
            <button onClick={() => { onChange('all'); setOpen(false); setQ('') }} className={['w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors', value === 'all' ? 'bg-primary/[0.08] text-primary font-semibold' : 'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>
              All Shops
            </button>
            {filtered.map((shop) => (
              <button key={shop} onClick={() => { onChange(shop); setOpen(false); setQ('') }} className={['w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors', shop === value ? 'bg-primary/[0.08] text-primary font-semibold' : 'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>
                {shop}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

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

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory)
  const [adjusting, setAdjusting] = useState<InventoryItem | null>(null)
  const [page, setPage]         = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch]     = useState('')
  const [shopFilter, setShopFilter]   = useState<ShopFilter>('all')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')

  const filtered = inventory.filter((it) => {
    const q = search.trim().toLowerCase()
    return (shopFilter === 'all'  || it.shop === shopFilter) &&
           (stockFilter === 'all' || levelOf(it.available) === stockFilter) &&
           (!q || it.name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q))
  })
  const pageCount = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const handleSearch = (v: string) => { setSearch(v); setPage(1) }
  const handleShop   = (v: ShopFilter)  => { setShopFilter(v);  setPage(1) }
  const handleStock  = (v: StockFilter) => { setStockFilter(v); setPage(1) }

  const delta = 2
  const pStart = Math.max(1, page - delta)
  const pEnd   = Math.min(pageCount, page + delta)
  const range  = Array.from({ length: pEnd - pStart + 1 }, (_, i) => pStart + i)

  const handleAdjust = (n: number) => {
    if (adjusting) setInventory((prev) => prev.map((it) => it.id === adjusting.id ? { ...it, available: n } : it))
    setAdjusting(null)
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Inventory</h1>
        <p className="text-[13px] font-medium text-muted-foreground mt-0.5">Track stock levels across shops</p>
      </div>

      <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-black/[0.06] flex items-center gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search by product or SKU…"
              className="w-full h-9 pl-9 pr-8 bg-[#F4F5F7] rounded-xl text-[13px] font-medium text-foreground border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            {search && (
              <button onClick={() => handleSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors">
                <svg className="w-2.5 h-2.5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <ShopFilterDropdown value={shopFilter} onChange={handleShop} />
          <StockFilterDropdown value={stockFilter} onChange={handleStock} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.05]">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-12">#</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">SKU</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Shop</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Available</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Reserved</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
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
                    <button onClick={() => { handleSearch(''); handleShop('all'); handleStock('all') }} className="text-[12px] font-semibold text-primary hover:underline">Clear filters</button>
                  </div>
                </td></tr>
              ) : paginated.map((it, i) => {
                const lvl = levelConfig[levelOf(it.available)]
                const col = avatarColors[filtered.indexOf(it) % avatarColors.length]
                return (
                  <tr key={it.id} className="border-b border-black/[0.04] hover:bg-[#F4F5F7]/70 transition-colors last:border-0">
                    <td className="px-5 py-3.5 text-[13px] font-medium text-muted-foreground">{(page - 1) * pageSize + i + 1}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {it.image
                          ? <img src={it.image} alt={it.name} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                          : <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white text-[11px] font-bold ${col}`}>{initials(it.name)}</span>}
                        <span className="text-[13px] font-semibold text-foreground whitespace-nowrap">{it.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[12px] font-semibold text-muted-foreground bg-[#F4F5F7] px-2.5 py-1 rounded-lg">{it.sku}</span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-medium text-muted-foreground whitespace-nowrap">{it.shop}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold text-foreground tabular-nums w-8">{it.available}</span>
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-xl ${lvl.bg} ${lvl.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${lvl.dot}`} />
                          {lvl.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={['text-[14px] font-bold tabular-nums', it.reserved > 0 ? 'text-foreground' : 'text-muted-foreground/50'].join(' ')}>{it.reserved}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button title="Adjust stock" onClick={() => setAdjusting(it)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" /></svg>
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

      {adjusting && <AdjustModal item={adjusting} onClose={() => setAdjusting(null)} onSave={handleAdjust} />}
    </div>
  )
}
