import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// fix default marker icons broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ─── Types ────────────────────────────────────────────────────────────────────

type Status  = 'active' | 'inactive'
type LocType = 'warehouse' | 'shop'

interface WorkSchedule { days: string[]; from: string; to: string }

interface Location {
  id: number; name: string; managerName: string; managerPhone: string
  type: LocType; address: string; lat: number; lng: number
  status: Status; schedule: WorkSchedule[]; createdAt: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const initialLocations: Location[] = [
  { id: 1,  name: 'Central Warehouse',    managerName: 'Akbar Toshmatov',  managerPhone: '+998 90 100 11 22', type: 'warehouse', address: 'Sergeli, 15-mavze, Tashkent',        lat: 41.2272, lng: 69.2680, status: 'active',   schedule: [{ days: ['Mon','Tue','Wed','Thu','Fri'], from: '08:00', to: '18:00' }], createdAt: 'Jan 10, 2026' },
  { id: 2,  name: 'AutoZone Tashkent',    managerName: 'Bekzod Saidov',    managerPhone: '+998 91 200 22 33', type: 'shop',      address: 'Yunusabad, 7-mavze, Tashkent',     lat: 41.3360, lng: 69.2928, status: 'active',   schedule: [{ days: ['Mon','Tue','Wed','Thu','Fri'], from: '09:00', to: '19:00' }, { days: ['Sat','Sun'], from: '10:00', to: '16:00' }], createdAt: 'Jan 15, 2026' },
  { id: 3,  name: 'Samarkand Depot',      managerName: 'Jasur Tursunov',   managerPhone: '+998 93 300 33 44', type: 'warehouse', address: 'Registon ko\'chasi 5, Samarkand',   lat: 39.6547, lng: 66.9597, status: 'active',   schedule: [{ days: ['Mon','Tue','Wed','Thu','Fri'], from: '08:00', to: '17:00' }], createdAt: 'Feb 3, 2026'  },
  { id: 4,  name: 'CarParts Express',     managerName: 'Dilnoza Yusupova', managerPhone: '+998 94 400 44 55', type: 'shop',      address: 'Chilonzor, 9-mavze, Tashkent',     lat: 41.2934, lng: 69.2300, status: 'active',   schedule: [{ days: ['Mon','Tue','Wed','Thu','Fri'], from: '09:00', to: '20:00' }, { days: ['Sat'], from: '10:00', to: '15:00' }], createdAt: 'Feb 20, 2026' },
  { id: 5,  name: 'North Warehouse',      managerName: 'Murod Xasanov',    managerPhone: '+998 97 500 55 66', type: 'warehouse', address: 'Shayxontohur, 3-mavze, Tashkent',  lat: 41.3190, lng: 69.2750, status: 'inactive', schedule: [{ days: ['Mon','Tue','Wed','Thu','Fri'], from: '08:00', to: '18:00' }], createdAt: 'Mar 5, 2026'  },
  { id: 6,  name: 'MotoHub Andijan',      managerName: 'Sherzod Aliev',    managerPhone: '+998 90 600 66 77', type: 'shop',      address: 'Bobur ko\'chasi 22, Andijon',       lat: 40.7831, lng: 72.3522, status: 'active',   schedule: [{ days: ['Mon','Tue','Wed','Thu','Fri'], from: '10:00', to: '20:00' }, { days: ['Sat','Sun'], from: '11:00', to: '18:00' }], createdAt: 'Mar 18, 2026' },
  { id: 7,  name: 'Bukhara Storage',      managerName: 'Sanjar Mirzaev',   managerPhone: '+998 91 700 77 88', type: 'warehouse', address: 'Mustaqillik ko\'chasi 44, Buxoro',  lat: 39.7674, lng: 64.4231, status: 'active',   schedule: [{ days: ['Mon','Tue','Wed','Thu','Fri'], from: '08:00', to: '17:00' }], createdAt: 'Apr 2, 2026'  },
  { id: 8,  name: 'TireHub Yunusabad',    managerName: 'Zulfiya Karimova', managerPhone: '+998 93 800 88 99', type: 'shop',      address: 'Yunusabad, 19-mavze, Tashkent',    lat: 41.3490, lng: 69.3010, status: 'active',   schedule: [{ days: ['Mon','Tue','Wed','Thu','Fri'], from: '09:00', to: '19:00' }, { days: ['Sat'], from: '10:00', to: '15:00' }], createdAt: 'Apr 15, 2026' },
  { id: 9,  name: 'Fergana Distribution', managerName: 'Otajon Yuldashev', managerPhone: '+998 94 900 99 00', type: 'warehouse', address: 'Al-Farg\'oniy ko\'chasi 3, Farg\'ona', lat: 40.3834, lng: 71.7881, status: 'inactive', schedule: [{ days: ['Mon','Tue','Wed','Thu','Fri'], from: '08:00', to: '17:00' }], createdAt: 'May 1, 2026'  },
  { id: 10, name: 'DriveZone Samarkand',  managerName: 'Kamola Nazarova',  managerPhone: '+998 97 010 10 11', type: 'shop',      address: 'Amir Temur ko\'chasi 11, Samarkand', lat: 39.6700, lng: 66.9750, status: 'active',   schedule: [{ days: ['Mon','Tue','Wed','Thu','Fri'], from: '09:00', to: '20:00' }, { days: ['Sat','Sun'], from: '10:00', to: '17:00' }], createdAt: 'May 20, 2026' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusConfig: Record<Status, { label: string; bg: string; text: string }> = {
  active:   { label: 'Active',   bg: 'bg-emerald-50', text: 'text-emerald-600' },
  inactive: { label: 'Inactive', bg: 'bg-red-50',     text: 'text-red-500'     },
}
const typeConfig: Record<LocType, { label: string; bg: string; text: string }> = {
  warehouse: { label: 'Warehouse', bg: 'bg-blue-50',   text: 'text-blue-600'   },
  shop:      { label: 'Shop',      bg: 'bg-violet-50', text: 'text-violet-600' },
}
const avatarColors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500']
const initials = (name: string) => name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()

function newScheduleRow(): WorkSchedule { return { days: [], from: '09:00', to: '18:00' } }

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

// ─── Map picker modal ─────────────────────────────────────────────────────────

interface MapPickerProps {
  initialLat: number; initialLng: number; initialAddress: string
  onConfirm: (lat: number, lng: number, address: string) => void
  onClose: () => void
}

function MapPickerModal({ initialLat, initialLng, initialAddress, onConfirm, onClose }: MapPickerProps) {
  useEscClose(onClose)
  useLockScroll()

  const mapRef    = useRef<HTMLDivElement>(null)
  const leafletRef= useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  const [address, setAddress]     = useState(initialAddress)
  const [loading, setLoading]     = useState(false)
  const [coords, setCoords]       = useState({ lat: initialLat, lng: initialLng })
  const [searchQ, setSearchQ]     = useState('')
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return

    const map = L.map(mapRef.current).setView([initialLat || 41.2995, initialLng || 69.2401], initialLat ? 14 : 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map)

    if (initialLat && initialLng) {
      const m = L.marker([initialLat, initialLng], { draggable: true }).addTo(map)
      markerRef.current = m
      m.on('dragend', () => {
        const p = m.getLatLng()
        setCoords({ lat: p.lat, lng: p.lng })
        reverseGeocode(p.lat, p.lng)
      })
    }

    map.on('click', (e) => {
      const { lat, lng } = e.latlng
      setCoords({ lat, lng })
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        const m = L.marker([lat, lng], { draggable: true }).addTo(map)
        markerRef.current = m
        m.on('dragend', () => {
          const p = m.getLatLng()
          setCoords({ lat: p.lat, lng: p.lng })
          reverseGeocode(p.lat, p.lng)
        })
      }
      reverseGeocode(lat, lng)
    })

    leafletRef.current = map
    return () => { map.remove(); leafletRef.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoading(true)
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      const data = await res.json()
      setAddress(data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQ.trim()) return
    setSearching(true)
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQ)}&format=json&limit=1`)
      const data = await res.json()
      if (data[0]) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        setCoords({ lat, lng })
        setAddress(data[0].display_name)
        leafletRef.current?.setView([lat, lng], 15)
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng])
        } else {
          const m = L.marker([lat, lng], { draggable: true }).addTo(leafletRef.current!)
          markerRef.current = m
          m.on('dragend', () => {
            const p = m.getLatLng()
            setCoords({ lat: p.lat, lng: p.lng })
            reverseGeocode(p.lat, p.lng)
          })
        }
      }
    } finally {
      setSearching(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} onClick={onClose}>
      <div className="bg-card rounded-2xl w-[720px] max-w-full overflow-hidden flex flex-col" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.25)', height: '580px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
            </span>
            <div>
              <p className="text-[15px] font-bold text-foreground">Pick Location on Map</p>
              <p className="text-[12px] font-medium text-muted-foreground">Click on the map or drag the marker to set the address</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Search bar */}
        <div className="px-5 py-3 border-b border-black/[0.06] shrink-0 flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
              placeholder="Search for an address…"
              className="w-full h-9 pl-9 bg-[#F4F5F7] rounded-xl text-[13px] font-medium text-foreground border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
          <button onClick={handleSearch} disabled={searching}
            className="px-4 h-9 rounded-xl bg-primary text-white text-[13px] font-semibold hover:bg-primary-hover transition-all disabled:opacity-60 shrink-0">
            {searching ? 'Searching…' : 'Search'}
          </button>
        </div>

        {/* Map */}
        <div ref={mapRef} className="flex-1" style={{ minHeight: 0 }} />

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-black/[0.06] shrink-0 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {loading ? (
              <p className="text-[12px] font-medium text-muted-foreground">Getting address…</p>
            ) : address ? (
              <p className="text-[12px] font-medium text-foreground truncate">{address}</p>
            ) : (
              <p className="text-[12px] font-medium text-muted-foreground">No location selected</p>
            )}
          </div>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-semibold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors shrink-0">Cancel</button>
          <button onClick={() => { if (address) onConfirm(coords.lat, coords.lng, address) }} disabled={!address || loading}
            className="px-4 py-2 rounded-xl text-[13px] font-semibold bg-primary text-white hover:bg-primary-hover transition-all disabled:opacity-40 shrink-0"
            style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
            Confirm Location
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
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
            <p className="text-[18px] font-extrabold text-foreground">Delete Location</p>
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

interface FormState {
  name: string; managerName: string; managerPhone: string
  type: LocType; address: string; lat: number; lng: number
  status: Status; schedule: WorkSchedule[]
}

function FormModal({ location, onClose, onSave }: { location: Location | null; onClose: () => void; onSave: (d: FormState) => void }) {
  const isEdit = location !== null
  const [form, setForm] = useState<FormState>({
    name: location?.name ?? '', managerName: location?.managerName ?? '',
    managerPhone: location?.managerPhone ?? '', type: location?.type ?? 'shop',
    address: location?.address ?? '', lat: location?.lat ?? 41.2995, lng: location?.lng ?? 69.2401,
    status: location?.status ?? 'active',
    schedule: location?.schedule ?? [{ days: ['Mon','Tue','Wed','Thu','Fri'], from: '09:00', to: '18:00' }],
  })
  const [typeOpen, setTypeOpen]   = useState(false)
  const [mapOpen, setMapOpen]     = useState(false)
  const typeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (typeRef.current && !typeRef.current.contains(e.target as Node)) setTypeOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const set = (k: keyof FormState) => (v: string) => setForm((p) => ({ ...p, [k]: v }))

  const updateScheduleRow = (i: number, patch: Partial<WorkSchedule>) =>
    setForm((p) => ({ ...p, schedule: p.schedule.map((r, j) => j === i ? { ...r, ...patch } : r) }))

  const toggleDay = (rowIdx: number, day: string) =>
    updateScheduleRow(rowIdx, {
      days: form.schedule[rowIdx].days.includes(day)
        ? form.schedule[rowIdx].days.filter((d) => d !== day)
        : [...form.schedule[rowIdx].days, day],
    })

  const addRow    = () => setForm((p) => ({ ...p, schedule: [...p.schedule, newScheduleRow()] }))
  const removeRow = (i: number) => setForm((p) => ({ ...p, schedule: p.schedule.filter((_, j) => j !== i) }))

  const usedDays = (excludeIdx: number) => form.schedule.flatMap((r, i) => i === excludeIdx ? [] : r.days)

  return (
    <>
      <ModalBackdrop onClose={onClose}>
        <div className="bg-card rounded-2xl w-[660px] max-w-full max-h-[90vh] overflow-y-auto" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.06] sticky top-0 bg-card z-10 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg className="w-[18px] h-[18px] text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isEdit ? 1.8 : 2} strokeLinecap="round" strokeLinejoin="round">
                  {isEdit
                    ? <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" /></>
                    : <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>}
                </svg>
              </span>
              <div>
                <p className="text-[16px] font-bold text-foreground">{isEdit ? 'Edit Location' : 'Add New Location'}</p>
                <p className="text-[12px] font-medium text-muted-foreground">{isEdit ? `Editing ${location.name}` : 'Fill in the details below'}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); if (form.name.trim() && form.managerName.trim() && form.managerPhone.trim()) onSave(form) }} className="p-6 flex flex-col gap-4">

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Location Name</label>
              <input type="text" value={form.name} onChange={(e) => set('name')(e.target.value)} placeholder="e.g. Central Warehouse" required
                className="w-full bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[13px] font-medium border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>

            {/* Manager Name + Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Manager Name</label>
                <input type="text" value={form.managerName} onChange={(e) => set('managerName')(e.target.value)} placeholder="e.g. Akbar Toshmatov" required
                  className="w-full bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[13px] font-medium border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Manager Phone</label>
                <input type="text" value={form.managerPhone} onChange={(e) => set('managerPhone')(e.target.value)} placeholder="+998 90 000 00 00" required
                  className="w-full bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[13px] font-medium border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>
            </div>

            {/* Type + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Type</label>
                <div ref={typeRef} className="relative">
                  <button type="button" onClick={() => setTypeOpen((o) => !o)}
                    className={['w-full flex items-center justify-between bg-[#F4F5F7] rounded-xl px-4 py-3 text-[13px] font-medium border transition-all', typeOpen ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'].join(' ')}>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl ${typeConfig[form.type].bg} ${typeConfig[form.type].text}`}>{typeConfig[form.type].label}</span>
                    <svg className={['w-4 h-4 text-muted-foreground transition-transform shrink-0', typeOpen ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                  </button>
                  {typeOpen && (
                    <div className="absolute bottom-full mb-1.5 left-0 right-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-10" style={{ boxShadow: '0 -8px 24px rgba(0,0,0,0.12)' }}>
                      {(['warehouse', 'shop'] as LocType[]).map((t) => (
                        <button key={t} type="button" onClick={() => { set('type')(t); setTypeOpen(false) }}
                          className={['w-full flex items-center gap-2.5 px-4 py-2.5 transition-colors', form.type === t ? 'bg-primary/[0.08]' : 'hover:bg-[#F4F5F7]'].join(' ')}>
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl ${typeConfig[t].bg} ${typeConfig[t].text}`}>{typeConfig[t].label}</span>
                          {form.type === t && <svg className="w-3.5 h-3.5 text-primary ml-auto shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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

            {/* Address — map picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Address</label>
              <button type="button" onClick={() => setMapOpen(true)}
                className={['w-full flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] border-2 transition-all text-left', form.address ? 'bg-[#F4F5F7] border-transparent hover:border-primary/30' : 'bg-[#F4F5F7] border-dashed border-black/10 hover:border-primary/40'].join(' ')}>
                <svg className="w-4 h-4 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                {form.address
                  ? <span className="font-medium text-foreground truncate flex-1">{form.address}</span>
                  : <span className="font-medium text-muted-foreground">Click to pick location on map…</span>}
                <span className="text-[11px] font-semibold text-primary shrink-0">{form.address ? 'Change' : 'Open Map'}</span>
              </button>
            </div>

            {/* Working schedule */}
            <div className="flex flex-col gap-3 pt-1">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Working Schedule</p>
                <button type="button" onClick={addRow}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:text-primary-hover transition-colors">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  Add time slot
                </button>
              </div>

              {form.schedule.map((row, rowIdx) => (
                <div key={rowIdx} className="bg-[#F4F5F7] rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Slot {rowIdx + 1}</p>
                    {form.schedule.length > 1 && (
                      <button type="button" onClick={() => removeRow(rowIdx)} className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>

                  {/* Day pills */}
                  <div className="flex gap-1.5 flex-wrap">
                    {DAYS.map((day) => {
                      const active  = row.days.includes(day)
                      const blocked = !active && usedDays(rowIdx).includes(day)
                      return (
                        <button key={day} type="button" disabled={blocked} onClick={() => toggleDay(rowIdx, day)}
                          className={['px-3 py-1.5 rounded-lg text-[12px] font-semibold border-2 transition-all',
                            blocked   ? 'opacity-30 cursor-not-allowed bg-white border-transparent text-muted-foreground' :
                            active    ? 'bg-primary/10 border-primary text-primary' :
                                        'bg-white border-transparent text-muted-foreground hover:border-black/10 hover:text-foreground'].join(' ')}>
                          {day}
                        </button>
                      )
                    })}
                  </div>

                  {/* Hours */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">From</span>
                      <input type="time" value={row.from} onChange={(e) => updateScheduleRow(rowIdx, { from: e.target.value })}
                        className="w-full bg-white text-foreground rounded-lg px-3 py-2 text-[13px] font-medium border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                    </div>
                    <span className="mt-4 text-muted-foreground font-semibold text-[13px] shrink-0">—</span>
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">To</span>
                      <input type="time" value={row.to} onChange={(e) => updateScheduleRow(rowIdx, { to: e.target.value })}
                        className="w-full bg-white text-foreground rounded-lg px-3 py-2 text-[13px] font-medium border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 rounded-xl py-3 text-[13px] font-semibold border-2 border-black/[0.08] text-foreground hover:bg-[#F4F5F7] transition-colors">Cancel</button>
              <button type="submit" className="flex-1 rounded-xl py-3 text-[13px] font-semibold bg-primary text-white hover:bg-primary-hover active:scale-[0.98] transition-all" style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                {isEdit ? 'Save Changes' : 'Add Location'}
              </button>
            </div>
          </form>
        </div>
      </ModalBackdrop>

      {mapOpen && (
        <MapPickerModal
          initialLat={form.lat} initialLng={form.lng} initialAddress={form.address}
          onClose={() => setMapOpen(false)}
          onConfirm={(lat, lng, address) => {
            setForm((p) => ({ ...p, lat, lng, address }))
            setMapOpen(false)
          }}
        />
      )}
    </>
  )
}

// ─── Dropdowns ────────────────────────────────────────────────────────────────

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
          {PAGE_SIZES.map((s) => <button key={s} onClick={() => { onChange(s); setOpen(false) }} className={['w-full text-center px-4 py-2 text-[12px] font-semibold transition-colors', s === value ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>{s}</button>)}
        </div>
      )}
    </div>
  )
}

type StatusFilter = 'all' | 'active' | 'inactive'
type TypeFilter   = 'all' | LocType

function StatusFilterDropdown({ value, onChange }: { value: StatusFilter; onChange: (v: StatusFilter) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const opts: { value: StatusFilter; label: string; dot?: string }[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active',   label: 'Active',   dot: 'bg-emerald-500' },
    { value: 'inactive', label: 'Inactive', dot: 'bg-red-500' },
  ]
  const cur = opts.find((o) => o.value === value)!
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className={['flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-semibold border-2 transition-all whitespace-nowrap', open || value !== 'all' ? 'border-primary text-primary bg-primary/5' : 'border-black/[0.08] text-foreground bg-card hover:border-black/20'].join(' ')}>
        {cur.dot && <span className={`w-2 h-2 rounded-full shrink-0 ${cur.dot}`} />}
        {cur.label}
        <svg className={['w-4 h-4 transition-transform', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 right-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-20 min-w-[160px]" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {opts.map((opt) => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }} className={['w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors', opt.value === value ? 'bg-primary/[0.08] text-primary font-semibold' : 'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>
              {opt.dot ? <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} /> : <span className="w-2 h-2 rounded-full shrink-0 border-2 border-black/20" />}
              {opt.label}
              {opt.value === value && <svg className="w-3.5 h-3.5 text-primary ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function TypeFilterDropdown({ value, onChange }: { value: TypeFilter; onChange: (v: TypeFilter) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const opts: { value: TypeFilter; label: string }[] = [{ value: 'all', label: 'All Types' }, { value: 'warehouse', label: 'Warehouse' }, { value: 'shop', label: 'Shop' }]
  const cur = opts.find((o) => o.value === value)!
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className={['flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-semibold border-2 transition-all whitespace-nowrap', open || value !== 'all' ? 'border-primary text-primary bg-primary/5' : 'border-black/[0.08] text-foreground bg-card hover:border-black/20'].join(' ')}>
        {value !== 'all' ? <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${typeConfig[value as LocType].bg} ${typeConfig[value as LocType].text}`}>{typeConfig[value as LocType].label}</span> : cur.label}
        <svg className={['w-4 h-4 transition-transform', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 right-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-20 min-w-[150px]" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {opts.map((opt) => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }} className={['w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors', opt.value === value ? 'bg-primary/[0.08] text-primary font-semibold' : 'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>
              {opt.value !== 'all' ? <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg ${typeConfig[opt.value as LocType].bg} ${typeConfig[opt.value as LocType].text}`}>{opt.label}</span> : <span>{opt.label}</span>}
              {opt.value === value && <svg className="w-3.5 h-3.5 text-primary ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ModalState = { kind: 'edit'; location: Location } | { kind: 'delete'; location: Location } | { kind: 'create' } | null

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>(initialLocations)
  const [modal, setModal]         = useState<ModalState>(null)
  const [page, setPage]           = useState(1)
  const [pageSize, setPageSize]   = useState(20)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter]     = useState<TypeFilter>('all')

  const filtered = locations.filter((l) => {
    const q = search.trim().toLowerCase()
    return (statusFilter === 'all' || l.status === statusFilter) &&
           (typeFilter === 'all'   || l.type === typeFilter) &&
           (!q || l.name.toLowerCase().includes(q) || l.managerName.toLowerCase().includes(q) || l.address.toLowerCase().includes(q))
  })
  const pageCount = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const handleSearch = (v: string) => { setSearch(v); setPage(1) }
  const handleStatus = (v: StatusFilter) => { setStatusFilter(v); setPage(1) }
  const handleType   = (v: TypeFilter)   => { setTypeFilter(v);   setPage(1) }

  const delta  = 2
  const pStart = Math.max(1, page - delta)
  const pEnd   = Math.min(pageCount, page + delta)
  const range  = Array.from({ length: pEnd - pStart + 1 }, (_, i) => pStart + i)

  const handleSave = (d: FormState) => {
    if (modal?.kind === 'edit') {
      setLocations((prev) => prev.map((l) => l.id === modal.location.id ? { ...l, ...d } : l))
    } else {
      setLocations((prev) => [{ id: Date.now(), ...d, createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }, ...prev])
    }
    setModal(null)
  }
  const handleDelete = () => {
    if (modal?.kind === 'delete') { setLocations((prev) => prev.filter((l) => l.id !== modal.location.id)); setModal(null) }
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Locations</h1>
        <p className="text-[13px] font-medium text-muted-foreground mt-0.5">Manage warehouses and shop locations</p>
      </div>

      <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-black/[0.06] flex items-center gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search by name, manager, address…"
              className="w-full h-9 pl-9 pr-8 bg-[#F4F5F7] rounded-xl text-[13px] font-medium text-foreground border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            {search && (
              <button onClick={() => handleSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-colors">
                <svg className="w-2.5 h-2.5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <TypeFilterDropdown value={typeFilter} onChange={handleType} />
          <StatusFilterDropdown value={statusFilter} onChange={handleStatus} />
          <div className="w-px h-6 bg-black/[0.08] shrink-0" />
          <button onClick={() => setModal({ kind: 'create' })}
            className="bg-primary text-white rounded-xl px-4 py-2 text-[13px] font-semibold hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center gap-1.5 shrink-0"
            style={{ boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Location
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.05]">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-10">#</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Location</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Manager</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Phone</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Address</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <p className="text-[13px] font-semibold text-muted-foreground">No results match your search</p>
                    <button onClick={() => { handleSearch(''); handleStatus('all'); handleType('all') }} className="text-[12px] font-semibold text-primary hover:underline">Clear filters</button>
                  </div>
                </td></tr>
              ) : paginated.map((loc, i) => {
                const sc = statusConfig[loc.status]
                const tc = typeConfig[loc.type]
                const ab = avatarColors[filtered.indexOf(loc) % avatarColors.length]
                return (
                  <tr key={loc.id} className="border-b border-black/[0.04] hover:bg-[#F4F5F7]/70 transition-colors last:border-0">
                    <td className="px-5 py-3.5 text-[13px] font-medium text-muted-foreground">{(page - 1) * pageSize + i + 1}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-[11px] font-bold ${ab}`}>{initials(loc.name)}</span>
                        <span className="text-[13px] font-semibold text-foreground whitespace-nowrap">{loc.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-medium text-foreground whitespace-nowrap">{loc.managerName}</td>
                    <td className="px-5 py-3.5 text-[13px] font-medium text-foreground whitespace-nowrap">{loc.managerPhone}</td>
                    <td className="px-5 py-3.5"><span className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl ${tc.bg} ${tc.text}`}>{tc.label}</span></td>
                    <td className="px-5 py-3.5 text-[13px] font-medium text-muted-foreground max-w-[200px]">
                      {loc.address ? (
                        <span className="truncate block" title={loc.address}>{loc.address}</span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3.5"><span className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl ${sc.bg} ${sc.text}`}>{sc.label}</span></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button title="Edit" onClick={() => setModal({ kind: 'edit', location: loc })} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" /></svg>
                        </button>
                        <button title="Delete" onClick={() => setModal({ kind: 'delete', location: loc })} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all">
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

        {/* Pagination */}
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
            {range[0] > 1 && (<><button onClick={() => setPage(1)} className="w-8 h-8 rounded-lg text-[13px] font-semibold text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">1</button>{range[0] > 2 && <span className="w-8 h-8 flex items-center justify-center text-[13px] text-muted-foreground">…</span>}</>)}
            {range.map((p) => <button key={p} onClick={() => setPage(p)} className={['w-8 h-8 rounded-lg text-[13px] font-semibold transition-all', p === page ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground'].join(' ')}>{p}</button>)}
            {range[range.length - 1] < pageCount && (<>{range[range.length - 1] < pageCount - 1 && <span className="w-8 h-8 flex items-center justify-center text-[13px] text-muted-foreground">…</span>}<button onClick={() => setPage(pageCount)} className="w-8 h-8 rounded-lg text-[13px] font-semibold text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all">{pageCount}</button></>)}
            <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount || pageCount === 0} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>
      </div>

      {modal?.kind === 'edit'   && <FormModal location={modal.location} onClose={() => setModal(null)} onSave={handleSave} />}
      {modal?.kind === 'create' && <FormModal location={null}           onClose={() => setModal(null)} onSave={handleSave} />}
      {modal?.kind === 'delete' && <DeleteModal name={modal.location.name} onClose={() => setModal(null)} onConfirm={handleDelete} />}
    </div>
  )
}
