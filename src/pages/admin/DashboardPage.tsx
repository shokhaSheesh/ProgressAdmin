import { useState, useRef, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

type PeriodType = 'daily' | 'monthly' | 'yearly'

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS: { value: PeriodType; label: string }[] = [
  { value: 'daily',   label: 'Daily'   },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly',  label: 'Yearly'  },
]

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTH_ABBR  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_NAMES   = ['Su','Mo','Tu','We','Th','Fr','Sa']

// ─── Mock data ────────────────────────────────────────────────────────────────

const SCAN_ACTIVITY: Record<PeriodType, { label: string; scans: number }[]> = {
  daily: [
    { label: 'Jun 16', scans: 142 }, { label: 'Jun 17', scans: 198 }, { label: 'Jun 18', scans: 175 },
    { label: 'Jun 19', scans: 221 }, { label: 'Jun 20', scans: 189 }, { label: 'Jun 21', scans: 134 },
    { label: 'Jun 22', scans: 156 }, { label: 'Jun 23', scans: 201 }, { label: 'Jun 24', scans: 168 },
    { label: 'Jun 25', scans: 244 },
  ],
  monthly: [
    { label: 'Jan', scans: 820  }, { label: 'Feb', scans: 940  }, { label: 'Mar', scans: 1100 },
    { label: 'Apr', scans: 1245 }, { label: 'May', scans: 1380 }, { label: 'Jun', scans: 1245 },
  ],
  yearly: [
    { label: '2022', scans: 5200 }, { label: '2023', scans: 8400 },
    { label: '2024', scans: 11200 }, { label: '2025', scans: 14800 }, { label: '2026', scans: 7400 },
  ],
}

const TOP_PRODUCTS = [
  { name: 'Spark Plug Iridium',  scans: 312 },
  { name: 'Brake Pads Set',      scans: 278 },
  { name: 'Oil Filter',          scans: 241 },
  { name: 'Shock Absorber',      scans: 198 },
  { name: 'Timing Belt Kit',     scans: 167 },
  { name: 'Oxygen Sensor',       scans: 144 },
  { name: 'Air Filter',          scans: 121 },
]

const TOP_MECHANICS = [
  { name: 'Akmal Karimov',    avatar: 'AK', region: 'Tashkent',   scans: 148, earned: 520000 },
  { name: 'Eldor Nazarov',    avatar: 'EN', region: 'Samarkand',  scans: 134, earned: 480000 },
  { name: 'Nodir Qodirov',    avatar: 'NQ', region: 'Namangan',   scans: 121, earned: 395000 },
  { name: 'Firdavs Rakhimov', avatar: 'FR', region: 'Tashkent',   scans: 109, earned: 360000 },
  { name: 'Komil Hasanov',    avatar: 'KH', region: "Farg'ona",   scans: 97,  earned: 310000 },
]


// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt     = (n: number) => n.toLocaleString('ru-RU').replace(/,/g, ' ')
const rankBg  = ['bg-amber-400', 'bg-slate-400', 'bg-orange-400']
const aColors = ['bg-blue-500','bg-violet-500','bg-emerald-500','bg-amber-500','bg-pink-500','bg-cyan-500','bg-rose-500','bg-teal-500']
const aColor  = (s: string) => aColors[(s.charCodeAt(0) + s.charCodeAt(1)) % aColors.length]

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })


// ─── Period type dropdown ─────────────────────────────────────────────────────

function PeriodTypeDropdown({ value, onChange }: { value: PeriodType; onChange: (v: PeriodType) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = PERIOD_OPTIONS.find((o) => o.value === value)!
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)}
        className={['flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-semibold border-2 transition-all whitespace-nowrap',
          open ? 'border-primary text-primary bg-primary/5' : 'border-black/[0.08] text-foreground bg-card hover:border-black/20'].join(' ')}>
        {current.label}
        <svg className={['w-4 h-4 transition-transform', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 right-0 bg-card rounded-xl border border-black/[0.08] overflow-hidden z-30 min-w-[140px]" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {PERIOD_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }}
              className={['w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-medium transition-colors',
                opt.value === value ? 'bg-primary/[0.08] text-primary font-semibold' : 'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>
              {opt.label}
              {opt.value === value && <svg className="w-3.5 h-3.5 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Day cell (calendar range selection) ─────────────────────────────────────

function DayCell({ d, start, end, hover, onDayClick, onDayHover }: {
  d: Date; start: Date | null; end: Date | null; hover: Date | null
  onDayClick: (d: Date) => void; onDayHover: (d: Date | null) => void
}) {
  const effectiveEnd = end ?? hover
  let lo: Date | null = null
  let hi: Date | null = null
  if (start && effectiveEnd) {
    if (start <= effectiveEnd) { lo = start; hi = effectiveEnd }
    else { lo = effectiveEnd; hi = start }
  } else if (start) { lo = start }

  const isLo       = !!lo && sameDay(d, lo)
  const isHi       = !!hi && sameDay(d, hi)
  const inBetween  = !!lo && !!hi && d > lo && d < hi
  const isSelected = isLo || isHi
  const hasRange   = !!hi && !sameDay(lo!, hi!)
  const isToday    = sameDay(d, new Date())

  return (
    <div className="relative w-8 h-8 flex items-center justify-center">
      {inBetween  && <div className="absolute inset-0 bg-primary/10 pointer-events-none" />}
      {isLo && hasRange && <div className="absolute right-0 top-0 w-1/2 h-full bg-primary/10 pointer-events-none" />}
      {isHi && hasRange && <div className="absolute left-0 top-0 w-1/2 h-full bg-primary/10 pointer-events-none" />}
      <button
        onClick={() => onDayClick(d)}
        onMouseEnter={() => onDayHover(d)}
        onMouseLeave={() => onDayHover(null)}
        className={['relative z-10 w-7 h-7 rounded-full text-[12px] flex items-center justify-center transition-colors',
          isSelected ? 'bg-primary text-white font-bold' :
          isToday    ? 'border border-primary text-primary font-semibold' :
          'text-foreground hover:bg-primary/15 font-medium'].join(' ')}
      >
        {d.getDate()}
      </button>
    </div>
  )
}

// ─── Daily picker (single calendar, 3-step: days → months → years) ───────────

function DailyPicker({ onSelect }: { onSelect: (label: string) => void }) {
  type View = 'days' | 'months' | 'years'
  const today = new Date()
  const [view,      setView]      = useState<View>('days')
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [start, setStart] = useState<Date | null>(null)
  const [end,   setEnd]   = useState<Date | null>(null)
  const [hover, setHover] = useState<Date | null>(null)

  const decadeStart = Math.floor(viewYear / 10) * 10

  // ── Navigation ──
  const prevNav = () => {
    if (view === 'days')   { if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) } else setViewMonth((m) => m - 1) }
    if (view === 'months') setViewYear((y) => y - 1)
    if (view === 'years')  setViewYear((y) => y - 10)
  }
  const nextNav = () => {
    if (view === 'days')   { if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) } else setViewMonth((m) => m + 1) }
    if (view === 'months') setViewYear((y) => y + 1)
    if (view === 'years')  setViewYear((y) => y + 10)
  }

  // ── Header label ──
  const headerLabel =
    view === 'days'   ? `${MONTH_NAMES[viewMonth]} ${viewYear}` :
    view === 'months' ? `${viewYear}` :
    `${decadeStart} – ${decadeStart + 9}`

  // ── Click handlers ──
  const handleDayClick = (d: Date) => {
    if (!start || (start && end)) { setStart(d); setEnd(null); return }
    if (sameDay(d, start))        { setStart(null); return }
    const [lo, hi] = d < start ? [d, start] : [start, d]
    setStart(lo); setEnd(hi)
    onSelect(`${fmtDate(lo)} – ${fmtDate(hi)}`)
  }
  const handleHover    = (d: Date | null) => { if (start && !end) setHover(d) }
  const handleMonthClick = (m: number)   => { setViewMonth(m); setView('days') }
  const handleYearClick  = (y: number)   => { setViewYear(y);  setView('months') }

  // ── Sub-views ──
  const DaysView = () => {
    const firstDay    = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const cells: (Date | null)[] = Array(firstDay).fill(null)
    for (let i = 1; i <= daysInMonth; i++) cells.push(new Date(viewYear, viewMonth, i))
    while (cells.length % 7) cells.push(null)
    return (
      <div className="grid grid-cols-7">
        {DAY_NAMES.map((d) => <div key={d} className="w-8 h-7 flex items-center justify-center text-[10px] font-semibold text-muted-foreground">{d}</div>)}
        {cells.map((d, i) => d
          ? <DayCell key={i} d={d} start={start} end={end} hover={hover} onDayClick={handleDayClick} onDayHover={handleHover} />
          : <div key={i} className="w-8 h-8" />
        )}
      </div>
    )
  }

  const MonthsView = () => (
    <div className="grid grid-cols-3 gap-1.5 px-1">
      {MONTH_ABBR.map((label, m) => (
        <button key={m} onClick={() => handleMonthClick(m)}
          className={['rounded-xl py-2.5 text-[12px] font-semibold transition-all',
            m === viewMonth ? 'bg-primary text-white' : 'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>
          {label}
        </button>
      ))}
    </div>
  )

  const YearsView = () => (
    <div className="grid grid-cols-3 gap-1.5 px-1">
      {Array.from({ length: 12 }, (_, i) => decadeStart - 1 + i).map((y) => {
        const outside = y < decadeStart || y > decadeStart + 9
        return (
          <button key={y} onClick={() => handleYearClick(y)}
            className={['rounded-xl py-2.5 text-[12px] font-semibold transition-all',
              y === viewYear  ? 'bg-primary text-white' :
              outside         ? 'text-muted-foreground/50 hover:bg-[#F4F5F7]' :
              'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>
            {y}
          </button>
        )
      })}
    </div>
  )

  const NavIcon = ({ dir }: { dir: 'prev' | 'next' }) => (
    <button onClick={dir === 'prev' ? prevNav : nextNav}
      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] transition-colors shrink-0">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        {dir === 'prev' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
      </svg>
    </button>
  )

  return (
    <div className="p-4 select-none w-[280px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <NavIcon dir="prev" />
        <button
          onClick={() => view !== 'years' && setView(view === 'days' ? 'months' : 'years')}
          className={['flex items-center gap-1.5 px-2 py-1 rounded-lg text-[13px] font-bold text-foreground transition-colors',
            view !== 'years' ? 'hover:bg-[#F4F5F7]' : 'cursor-default'].join(' ')}>
          {headerLabel}
          {view !== 'years' && (
            <svg className="w-3.5 h-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          )}
        </button>
        <NavIcon dir="next" />
      </div>

      {/* View */}
      {view === 'days'   && <DaysView />}
      {view === 'months' && <MonthsView />}
      {view === 'years'  && <YearsView />}

      {view === 'days' && start && !end && (
        <p className="text-[11px] font-medium text-muted-foreground text-center mt-3 pt-3 border-t border-black/[0.05]">Select end date</p>
      )}
    </div>
  )
}


// ─── Monthly picker ───────────────────────────────────────────────────────────

function MonthlyPicker({ onSelect }: { onSelect: (label: string) => void }) {
  const [year,  setYear]  = useState(new Date().getFullYear())
  const [start, setStart] = useState<{ y: number; m: number } | null>(null)
  const [hover, setHover] = useState<{ y: number; m: number } | null>(null)

  const key = (y: number, m: number) => y * 100 + m
  const isStart  = (m: number) => start?.y === year && start?.m === m
  const inRangeM = (m: number) => {
    if (!start) return false
    const end = hover ?? start
    const lo  = key(start.y, start.m) < key(end.y, end.m) ? start : end
    const hi  = key(start.y, start.m) < key(end.y, end.m) ? end   : start
    const k   = key(year, m)
    return k > key(lo.y, lo.m) && k < key(hi.y, hi.m)
  }
  const isEndM = (m: number) => {
    if (!start || !hover) return false
    const end = hover
    const hi  = key(start.y, start.m) < key(end.y, end.m) ? end : start
    return hi.y === year && hi.m === m && !isStart(m)
  }

  const handleMonth = (m: number) => {
    if (!start)             { setStart({ y: year, m }); return }
    if (isStart(m))         { setStart(null); return }
    const clicked = { y: year, m }
    const [lo, hi] = key(start.y, start.m) < key(year, m)
      ? [start, clicked] : [clicked, start]
    onSelect(`${MONTH_ABBR[lo.m]} ${lo.y} – ${MONTH_ABBR[hi.m]} ${hi.y}`)
  }

  const navBtn = (dir: 'prev' | 'next') => (
    <button onClick={() => setYear((y) => y + (dir === 'next' ? 1 : -1))}
      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] transition-colors">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        {dir === 'prev' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
      </svg>
    </button>
  )

  return (
    <div className="p-4 w-[260px]">
      <div className="flex items-center justify-between mb-4">
        {navBtn('prev')}
        <p className="text-[13px] font-bold text-foreground">{year}</p>
        {navBtn('next')}
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {MONTH_ABBR.map((label, m) => (
          <button key={m}
            onClick={() => handleMonth(m)}
            onMouseEnter={() => start && setHover({ y: year, m })}
            onMouseLeave={() => setHover(null)}
            className={['rounded-xl py-2 text-[12px] font-semibold transition-all',
              isStart(m) || isEndM(m) ? 'bg-primary text-white' :
              inRangeM(m)             ? 'bg-primary/10 text-primary' :
              'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>
            {label}
          </button>
        ))}
      </div>
      {start && !hover && (
        <p className="text-[11px] font-medium text-muted-foreground text-center mt-3 pt-3 border-t border-black/[0.05]">Select end month</p>
      )}
    </div>
  )
}

// ─── Yearly picker ────────────────────────────────────────────────────────────

function YearlyPicker({ onSelect }: { onSelect: (label: string) => void }) {
  const cur   = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => cur - 4 + i)
  const [start, setStart] = useState<number | null>(null)
  const [hover, setHover] = useState<number | null>(null)

  const lo = start !== null && hover !== null ? Math.min(start, hover) : start
  const hi = start !== null && hover !== null ? Math.max(start, hover) : null

  const handleYear = (y: number) => {
    if (start === null)   { setStart(y); return }
    if (y === start)      { setStart(null); return }
    const [loY, hiY] = y < start ? [y, start] : [start, y]
    onSelect(`${loY} – ${hiY}`)
  }

  return (
    <div className="p-4 w-[260px]">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Select year range</p>
      <div className="grid grid-cols-5 gap-1.5">
        {years.map((y) => {
          const isSt    = y === start
          const isEnd   = hi !== null && y === hi
          const inRange = lo !== null && hi !== null && y > lo && y < hi
          return (
            <button key={y}
              onClick={() => handleYear(y)}
              onMouseEnter={() => start !== null && setHover(y)}
              onMouseLeave={() => setHover(null)}
              className={['rounded-xl py-2.5 text-[12px] font-semibold transition-all',
                isSt || isEnd ? 'bg-primary text-white' :
                inRange       ? 'bg-primary/10 text-primary' :
                'text-foreground hover:bg-[#F4F5F7]'].join(' ')}>
              {y}
            </button>
          )
        })}
      </div>
      {start !== null && hi === null && (
        <p className="text-[11px] font-medium text-muted-foreground text-center mt-3 pt-3 border-t border-black/[0.05]">Select end year</p>
      )}
    </div>
  )
}

// ─── Range picker (wrapper) ───────────────────────────────────────────────────

function RangePicker({ periodType }: { periodType: PeriodType }) {
  const [open,  setOpen]  = useState(false)
  const [label, setLabel] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setLabel(null); setOpen(false) }, [periodType])

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleSelect = (l: string) => { setLabel(l); setOpen(false) }

  const placeholder = { daily: 'Select dates', monthly: 'Select months', yearly: 'Select years' }[periodType]

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)}
        className={['flex items-center gap-2 h-9 pl-3.5 pr-3 rounded-xl text-[13px] font-semibold border-2 transition-all whitespace-nowrap',
          open || label ? 'border-primary text-primary bg-primary/5' : 'border-black/[0.08] text-foreground bg-card hover:border-black/20'].join(' ')}>
        <svg className="w-4 h-4 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className={label ? 'text-foreground' : 'text-[12px] text-muted-foreground'}>{label ?? placeholder}</span>
        {label && (
          <span role="button" onClick={(e) => { e.stopPropagation(); setLabel(null) }}
            className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors ml-0.5 shrink-0">
            <svg className="w-2.5 h-2.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </span>
        )}
        {!label && <svg className={['w-4 h-4 transition-transform shrink-0', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>}
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 right-0 bg-card rounded-xl border border-black/[0.08] z-30 overflow-hidden"
          style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {periodType === 'daily'   && <DailyPicker   key="d" onSelect={handleSelect} />}
          {periodType === 'monthly' && <MonthlyPicker key="m" onSelect={handleSelect} />}
          {periodType === 'yearly'  && <YearlyPicker  key="y" onSelect={handleSelect} />}
        </div>
      )}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, iconBg, icon, valueColor }: {
  label: string; value: string; sub?: string; iconBg: string; icon: React.ReactNode; valueColor?: string
}) {
  return (
    <div className="bg-card rounded-2xl border border-black/[0.06] p-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2 min-w-0">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className={['text-[24px] font-extrabold leading-none tracking-tight', valueColor ?? 'text-foreground'].join(' ')}>{value}</p>
          {sub && <p className="text-[12px] font-medium text-muted-foreground">{sub}</p>}
        </div>
        <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <span className="w-5 h-5 text-white">{icon}</span>
        </span>
      </div>
    </div>
  )
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, unit = '' }: {
  active?: boolean; payload?: { value: number }[]; label?: string; unit?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card rounded-xl border border-black/[0.08] px-3.5 py-2.5" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
      <p className="text-[11px] font-semibold text-muted-foreground mb-1">{label}</p>
      <p className="text-[14px] font-extrabold text-foreground">
        {fmt(payload[0].value)}{unit && <span className="text-[11px] font-semibold text-muted-foreground ml-1">{unit}</span>}
      </p>
    </div>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────

function Card({ title, subtitle, action, children }: {
  title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06]">
        <div>
          <p className="text-[14px] font-extrabold text-foreground">{title}</p>
          {subtitle && <p className="text-[12px] font-medium text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [periodType, setPeriodType] = useState<PeriodType>('monthly')

  const scanData   = SCAN_ACTIVITY[periodType]
  const totalScans = scanData.reduce((s, d) => s + d.scans, 0)
  const totalBonus      = 4_500_000
  const totalReceived   = 6_200_000
  const totalWithdrawn  = 1_750_000

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-[13px] font-medium text-muted-foreground mt-0.5">Overview of platform activity and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodTypeDropdown value={periodType} onChange={setPeriodType} />
          <RangePicker periodType={periodType} key={periodType} />
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Scans" value={fmt(totalScans)} sub={`${scanData.length} data points`} iconBg="bg-primary"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><rect x="7" y="7" width="10" height="10" rx="1" /></svg>}
        />
        <KpiCard label="Total Bonus Awarded" value={fmt(totalBonus)} sub="UZS" iconBg="bg-emerald-500" valueColor="text-emerald-600"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></svg>}
        />
        <KpiCard label="Bonuses Received" value={fmt(totalReceived)} sub="UZS" iconBg="bg-emerald-500" valueColor="text-emerald-600"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>}
        />
        <KpiCard label="Bonuses Withdrawn" value={fmt(totalWithdrawn)} sub="UZS" iconBg="bg-red-400" valueColor="text-red-500"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>}
        />
      </div>

      {/* Scan Activity */}
      <div>
        <Card title="Scan Activity" subtitle="Number of product scans over time"
          action={<span className="text-[11px] font-semibold text-primary bg-primary/[0.08] px-2.5 py-1 rounded-lg capitalize">{periodType}</span>}>
          <div className="px-2 pt-5 pb-3">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={scanData} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip content={<ChartTooltip unit="scans" />} cursor={{ stroke: '#2563EB', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="scans" stroke="#2563EB" strokeWidth={2.5} fill="url(#scanGrad)"
                  dot={false} activeDot={{ r: 5, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Products + Mechanics Row */}
      <div className="grid grid-cols-2 gap-4">
        <Card title="Top Performing Products" subtitle="Most scanned products this period">
          <div className="px-2 pt-5 pb-3">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={TOP_PRODUCTS} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }} barSize={10}>
                <CartesianGrid horizontal={false} stroke="#E5E7EB" strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip unit="scans" />} cursor={{ fill: 'rgba(37,99,235,0.05)' }} />
                <Bar dataKey="scans" fill="#2563EB" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Top Mechanics" subtitle="Ranked by total scans">
          <div className="divide-y divide-black/[0.04]">
            {TOP_MECHANICS.map((m, i) => (
              <div key={m.name} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#F4F5F7]/70 transition-colors">
                <div className="w-6 shrink-0 flex justify-center">
                  {i < 3
                    ? <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white ${rankBg[i]}`}>{i + 1}</span>
                    : <span className="text-[13px] font-bold text-muted-foreground">{i + 1}</span>
                  }
                </div>
                <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-bold ${aColor(m.avatar)}`}>{m.avatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{m.name}</p>
                  <p className="text-[11px] font-medium text-muted-foreground">{m.region}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-bold text-foreground">{m.scans} <span className="text-[11px] font-medium text-muted-foreground">scans</span></p>
                  <p className="text-[11px] font-semibold text-emerald-600">+{fmt(m.earned)} UZS</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

