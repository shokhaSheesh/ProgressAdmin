import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { initialInventory } from './InventoryPage'

// ─── Types ────────────────────────────────────────────────────────────────────

type LabelSize = 'sm' | 'md' | 'lg'

const LABEL_SIZES: { key: LabelSize; label: string; px: number; qr: number; font: number; sub: number }[] = [
  { key: 'sm', label: 'Small (3×3 cm)',  px: 96,  qr: 60,  font: 6,  sub: 5  },
  { key: 'md', label: 'Medium (5×5 cm)', px: 160, qr: 100, font: 9,  sub: 8  },
  { key: 'lg', label: 'Large (7×7 cm)',  px: 224, qr: 140, font: 11, sub: 10 },
]

// ─── Single label ─────────────────────────────────────────────────────────────

function QrLabel({ sku, name, serial, size }: { sku: string; name: string; serial: string; size: LabelSize }) {
  const cfg  = LABEL_SIZES.find((s) => s.key === size)!
  const data = `${sku}::${serial}`
  return (
    <div
      className="flex flex-col items-center justify-center bg-white border border-black/10 rounded"
      style={{ width: cfg.px, height: cfg.px, padding: 6, gap: 3 }}>
      <QRCodeSVG value={data} size={cfg.qr} level="M" />
      <p className="text-center font-bold leading-tight text-black truncate w-full text-center"
        style={{ fontSize: cfg.font }}>{name}</p>
      <p className="font-mono text-center leading-none text-black/60 truncate w-full text-center"
        style={{ fontSize: cfg.sub }}>{sku}</p>
      <p className="font-mono text-center leading-none text-black/40 truncate w-full text-center"
        style={{ fontSize: cfg.sub }}>#{serial}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryQrPrintPage() {
  const navigate     = useNavigate()
  const { id }       = useParams<{ id: string }>()
  const item         = initialInventory.find((it) => it.id === Number(id))

  const [qty,  setQty]  = useState(item ? Math.max(1, item.available) : 1)
  const [size, setSize] = useState<LabelSize>('md')

  if (!item) {
    return (
      <div className="p-6">
        <p className="text-[13px] font-semibold text-muted-foreground">Item not found.</p>
        <button onClick={() => navigate('/admin/inventory')} className="mt-2 text-[13px] font-semibold text-primary hover:underline">Back to Inventory</button>
      </div>
    )
  }

  const serials = Array.from({ length: qty }, (_, i) => String(i + 1).padStart(4, '0'))
  const cfg     = LABEL_SIZES.find((s) => s.key === size)!

  return (
    <>
      {/* ── Screen UI (hidden on print) ── */}
      <div className="print:hidden p-6 flex flex-col gap-6 min-h-screen bg-background">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/inventory')}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-card border border-black/[0.08] transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div>
            <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Print QR Labels</h1>
            <p className="text-[13px] font-medium text-muted-foreground mt-0.5">{item.name} · {item.sku} · {item.shop}</p>
          </div>
        </div>

        <div className="flex gap-6 items-start">

          {/* ── Left: settings ── */}
          <div className="flex flex-col gap-4 w-80 shrink-0">

            {/* Quantity */}
            <div className="bg-card rounded-2xl border border-black/[0.06] p-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <p className="text-[12px] font-bold text-foreground mb-3">Quantity</p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-xl flex items-center justify-center border-2 border-black/[0.08] hover:bg-[#F4F5F7] transition-colors shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                </button>
                <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                  className="flex-1 min-w-0 text-center bg-[#F4F5F7] text-foreground rounded-xl px-3 py-2.5 text-[15px] font-bold border border-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                <button type="button" onClick={() => setQty((q) => q + 1)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center border-2 border-black/[0.08] hover:bg-[#F4F5F7] transition-colors shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                </button>
              </div>
              <p className="text-[11px] font-medium text-muted-foreground mt-2">{item.available} units in stock</p>
            </div>

            {/* Label size */}
            <div className="bg-card rounded-2xl border border-black/[0.06] p-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <p className="text-[12px] font-bold text-foreground mb-3">Label Size</p>
              <div className="flex flex-col gap-2">
                {LABEL_SIZES.map((s) => (
                  <button key={s.key} type="button" onClick={() => setSize(s.key)}
                    className={['flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left',
                      size === s.key ? 'border-primary bg-primary/5 text-primary' : 'border-black/[0.08] text-foreground hover:border-black/20'].join(' ')}>
                    <span className={['w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                      size === s.key ? 'border-primary' : 'border-black/20'].join(' ')}>
                      {size === s.key && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </span>
                    <span className="text-[13px] font-semibold">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Label preview */}
            <div className="bg-card rounded-2xl border border-black/[0.06] p-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <p className="text-[12px] font-bold text-foreground mb-3">Label Preview</p>
              <div className="flex justify-center">
                <QrLabel sku={item.sku} name={item.name} serial="0001" size={size} />
              </div>
            </div>

            {/* Print button */}
            <button onClick={() => window.print()}
              className="flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-white text-[13px] font-bold hover:bg-primary/90 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
              </svg>
              Print {qty} Label{qty !== 1 ? 's' : ''}
            </button>
          </div>

          {/* ── Right: grid preview ── */}
          <div className="flex-1 bg-card rounded-2xl border border-black/[0.06] p-5 overflow-auto" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', maxHeight: 'calc(100vh - 160px)' }}>
            <p className="text-[12px] font-bold text-foreground mb-4">{qty} Label{qty !== 1 ? 's' : ''} · {cfg.label}</p>
            <div className="flex flex-wrap gap-2">
              {serials.map((serial) => (
                <QrLabel key={serial} sku={item.sku} name={item.name} serial={serial} size={size} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Print-only sheet ── */}
      <div className="hidden print:block">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: 8 }}>
          {serials.map((serial) => (
            <QrLabel key={serial} sku={item.sku} name={item.name} serial={serial} size={size} />
          ))}
        </div>
      </div>
    </>
  )
}
