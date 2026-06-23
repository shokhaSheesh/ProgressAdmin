import { useSyncExternalStore } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type TransferStatus = 'pending' | 'in_transit' | 'received' | 'cancelled'

export interface TransferLine {
  productId: number
  name: string
  sku: string
  image: string
  quantity: number
}

export interface Transfer {
  id: number
  reference: string
  origin: string
  destination: string
  status: TransferStatus
  expectedArrival: string
  note: string
  lines: TransferLine[]
  createdAt: string
}

export interface TransferInput {
  reference: string
  origin: string
  destination: string
  status: TransferStatus
  expectedArrival: string
  note: string
  lines: TransferLine[]
}

// ─── Constants ─────────────────────────────────────────────────────────────────

export const TRANSFER_ORIGINS = [
  'Central Warehouse', 'North Warehouse', 'Samarkand Depot', 'Bukhara Storage', 'Fergana Distribution',
]

export const TRANSFER_DESTINATIONS = [
  'AutoZone Tashkent', 'CarParts Express', 'MotoHub Andijan', 'DriveZone Samarkand', 'TireHub Yunusabad',
]

export const statusMeta: Record<TransferStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending:    { label: 'Pending',    bg: 'bg-amber-50',   text: 'text-amber-600',   dot: 'bg-amber-500'   },
  in_transit: { label: 'In Transit', bg: 'bg-blue-50',    text: 'text-blue-600',    dot: 'bg-blue-500'    },
  received:   { label: 'Received',   bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  cancelled:  { label: 'Cancelled',  bg: 'bg-red-50',     text: 'text-red-500',     dot: 'bg-red-400'     },
}

export const totalItems = (t: Transfer | TransferInput) => t.lines.reduce((s, l) => s + (Number(l.quantity) || 0), 0)

// ─── Seed ──────────────────────────────────────────────────────────────────────

let transfers: Transfer[] = [
  {
    id: 1, reference: 'TR-1001', origin: 'Central Warehouse', destination: 'AutoZone Tashkent',
    status: 'received', expectedArrival: 'Jan 18, 2026', note: '',
    lines: [
      { productId: 1, name: 'Spark Plug Iridium', sku: 'NGK-SP-001', image: '', quantity: 50 },
      { productId: 3, name: 'Oil Filter',         sku: 'MNN-OF-001', image: '', quantity: 80 },
    ],
    createdAt: 'Jan 12, 2026',
  },
  {
    id: 2, reference: 'TR-1002', origin: 'North Warehouse', destination: 'CarParts Express',
    status: 'in_transit', expectedArrival: 'Feb 10, 2026', note: 'Priority shipment',
    lines: [
      { productId: 2, name: 'Brake Pads Set', sku: 'BRB-BP-001', image: '', quantity: 30 },
      { productId: 10, name: 'Brake Disc',    sku: 'BSH-BD-001', image: '', quantity: 24 },
    ],
    createdAt: 'Feb 2, 2026',
  },
  {
    id: 3, reference: 'TR-1003', origin: 'Samarkand Depot', destination: 'DriveZone Samarkand',
    status: 'pending', expectedArrival: 'Mar 1, 2026', note: '',
    lines: [
      { productId: 5, name: 'Air Filter', sku: 'MNN-AF-002', image: '', quantity: 60 },
    ],
    createdAt: 'Feb 22, 2026',
  },
  {
    id: 4, reference: 'TR-1004', origin: 'Central Warehouse', destination: 'TireHub Yunusabad',
    status: 'cancelled', expectedArrival: 'Mar 5, 2026', note: 'Destination overstocked',
    lines: [
      { productId: 9, name: 'Timing Belt Kit', sku: 'CNT-TB-001', image: '', quantity: 15 },
    ],
    createdAt: 'Feb 25, 2026',
  },
  {
    id: 5, reference: 'TR-1005', origin: 'North Warehouse', destination: 'MotoHub Andijan',
    status: 'in_transit', expectedArrival: 'Mar 20, 2026', note: '',
    lines: [
      { productId: 4, name: 'Shock Absorber',   sku: 'MNR-SA-001', image: '', quantity: 20 },
      { productId: 7, name: 'Wheel Bearing Kit', sku: 'SKF-WB-001', image: '', quantity: 18 },
      { productId: 8, name: 'Oxygen Sensor',    sku: 'BSH-OS-001', image: '', quantity: 12 },
    ],
    createdAt: 'Mar 10, 2026',
  },
]

// ─── Store ─────────────────────────────────────────────────────────────────────

const listeners = new Set<() => void>()
const emit = () => listeners.forEach(l => l())
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb) } }

export function useTransfers(): Transfer[] {
  return useSyncExternalStore(subscribe, () => transfers)
}

export function getTransfer(id: number): Transfer | undefined {
  return transfers.find(t => t.id === id)
}

export function nextReference(): string {
  const max = transfers.reduce((m, t) => {
    const n = Number(t.reference.replace(/\D/g, ''))
    return Number.isFinite(n) ? Math.max(m, n) : m
  }, 1000)
  return `TR-${max + 1}`
}

export function createTransfer(input: TransferInput): Transfer {
  const transfer: Transfer = {
    id: Date.now(),
    ...input,
    reference: input.reference.trim() || nextReference(),
    createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }
  transfers = [transfer, ...transfers]
  emit()
  return transfer
}

export function updateTransfer(id: number, input: TransferInput) {
  transfers = transfers.map(t => t.id === id ? { ...t, ...input } : t)
  emit()
}

export function deleteTransfer(id: number) {
  transfers = transfers.filter(t => t.id !== id)
  emit()
}
