import { useSyncExternalStore } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled'

export interface OrderProduct {
  productId: number
  name: string
  sku: string
  image: string
  price: number
}

export interface Order {
  id: number
  orderNumber: string
  buyerName: string
  buyerPhone: string
  shop: string
  date: string
  status: OrderStatus
  product: OrderProduct
  mechanicBonus: number
  createdAt: string
}

export interface OrderInput {
  orderNumber: string
  buyerName: string
  buyerPhone: string
  shop: string
  date: string
  status: OrderStatus
  product: OrderProduct
  mechanicBonus: number
}

// ─── Constants ─────────────────────────────────────────────────────────────────

export const ORDER_SHOPS = [
  'AutoZone Tashkent', 'CarParts Express', 'MotoHub Andijan', 'DriveZone Samarkand', 'TireHub Yunusabad',
]

export const statusMeta: Record<OrderStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending:    { label: 'Pending',    bg: 'bg-amber-50',   text: 'text-amber-600',   dot: 'bg-amber-500'   },
  processing: { label: 'Processing', bg: 'bg-blue-50',    text: 'text-blue-600',    dot: 'bg-blue-500'    },
  completed:  { label: 'Completed',  bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  cancelled:  { label: 'Cancelled',  bg: 'bg-red-50',     text: 'text-red-500',     dot: 'bg-red-400'     },
}

export const orderTotal = (o: Order | OrderInput) => o.product.price

// ─── Seed ──────────────────────────────────────────────────────────────────────

let orders: Order[] = [
  {
    id: 1, orderNumber: 'ORD-0001',
    buyerName: 'Alisher Nazarov', buyerPhone: '+998 90 123 45 67',
    shop: 'AutoZone Tashkent',
    date: 'Jan 15, 2026', status: 'completed',
    product: { productId: 1, name: 'Spark Plug Iridium', sku: 'NGK-SP-001', image: '', price: 12500 },
    mechanicBonus: 5000, createdAt: 'Jan 15, 2026',
  },
  {
    id: 2, orderNumber: 'ORD-0002',
    buyerName: 'Kamola Mirzayeva', buyerPhone: '+998 91 234 56 78',
    shop: 'CarParts Express',
    date: 'Jan 22, 2026', status: 'completed',
    product: { productId: 2, name: 'Brake Pads Set', sku: 'BRB-BP-001', image: '', price: 185000 },
    mechanicBonus: 12000, createdAt: 'Jan 22, 2026',
  },
  {
    id: 3, orderNumber: 'ORD-0003',
    buyerName: 'Ruslan Xolmatov', buyerPhone: '+998 93 345 67 89',
    shop: 'MotoHub Andijan',
    date: 'Feb 3, 2026', status: 'processing',
    product: { productId: 4, name: 'Shock Absorber', sku: 'MNR-SA-001', image: '', price: 320000 },
    mechanicBonus: 0, createdAt: 'Feb 3, 2026',
  },
  {
    id: 4, orderNumber: 'ORD-0004',
    buyerName: 'Zulfiya Rashidova', buyerPhone: '+998 94 456 78 90',
    shop: 'DriveZone Samarkand',
    date: 'Feb 18, 2026', status: 'pending',
    product: { productId: 7, name: 'Wheel Bearing Kit', sku: 'SKF-WB-001', image: '', price: 145000 },
    mechanicBonus: 0, createdAt: 'Feb 18, 2026',
  },
  {
    id: 5, orderNumber: 'ORD-0005',
    buyerName: 'Temur Sodiqov', buyerPhone: '+998 95 567 89 01',
    shop: 'TireHub Yunusabad',
    date: 'Mar 5, 2026', status: 'cancelled',
    product: { productId: 9, name: 'Timing Belt Kit', sku: 'CNT-TB-001', image: '', price: 220000 },
    mechanicBonus: 0, createdAt: 'Mar 5, 2026',
  },
  {
    id: 6, orderNumber: 'ORD-0006',
    buyerName: 'Nilufar Hasanova', buyerPhone: '+998 97 678 90 12',
    shop: 'AutoZone Tashkent',
    date: 'Mar 12, 2026', status: 'completed',
    product: { productId: 8, name: 'Oxygen Sensor', sku: 'BSH-OS-001', image: '', price: 175000 },
    mechanicBonus: 18000, createdAt: 'Mar 12, 2026',
  },
]

// ─── Store ─────────────────────────────────────────────────────────────────────

const listeners = new Set<() => void>()
const emit = () => listeners.forEach(l => l())
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb) } }

export function useOrders(): Order[] {
  return useSyncExternalStore(subscribe, () => orders)
}

export function getOrder(id: number): Order | undefined {
  return orders.find(o => o.id === id)
}

export function nextOrderNumber(): string {
  const max = orders.reduce((m, o) => {
    const n = Number(o.orderNumber.replace(/\D/g, ''))
    return Number.isFinite(n) ? Math.max(m, n) : m
  }, 0)
  return `ORD-${String(max + 1).padStart(4, '0')}`
}

export function createOrder(input: OrderInput): Order {
  const order: Order = {
    id: Date.now(), ...input,
    orderNumber: input.orderNumber.trim() || nextOrderNumber(),
    createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }
  orders = [order, ...orders]
  emit()
  return order
}

export function updateOrder(id: number, input: OrderInput) {
  orders = orders.map(o => o.id === id ? { ...o, ...input } : o)
  emit()
}

export function deleteOrder(id: number) {
  orders = orders.filter(o => o.id !== id)
  emit()
}
