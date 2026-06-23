import { useSyncExternalStore } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type Status = 'active' | 'inactive'

export interface AttrDef {
  id: string
  name: string
  values: string[]
  valueImages?: Record<string, string>
}

export interface Variant {
  key: string
  attributes: Record<string, string>
  sku: string
  brandName: string
  price: string
  quantity: string
  image: string
  selected: boolean
}

export interface Product {
  id: number
  name: string
  sku: string
  category: string
  brand: string
  model: string
  location: string
  description: string
  price: number
  image: string
  images: string[]
  status: Status
  hasVariants: boolean
  attributes: AttrDef[]
  variants: Variant[]
  createdAt: string
}

export interface ProductInput {
  name: string; sku: string
  category: string; brand: string; model: string
  location: string; description: string
  image: string; images: string[]; status: Status
  hasVariants: boolean; attributes: AttrDef[]; variants: Variant[]
}

// ─── Constants ─────────────────────────────────────────────────────────────────

export const CATEGORIES = [
  'Engine Parts', 'Brakes', 'Suspension', 'Electrical',
  'Body Parts', 'Tires & Wheels', 'Filters', 'Transmission', 'Exhaust', 'Cooling System',
]

export const BRANDS = [
  'Bosch', 'NGK', 'Denso', 'Monroe', 'Brembo',
  'Mahle', 'Mann', 'Sachs', 'SKF', 'Febi', 'Valeo', 'Continental',
]

export const LOCATIONS = [
  'Central Warehouse', 'AutoZone Tashkent', 'Samarkand Depot', 'CarParts Express',
  'North Warehouse', 'MotoHub Andijan', 'Bukhara Storage', 'TireHub Yunusabad',
]

// ─── Seed data ─────────────────────────────────────────────────────────────────

type SeedVariant = Pick<Variant, 'key' | 'attributes' | 'sku' | 'price' | 'quantity'>
type SeedProduct = {
  id: number; name: string; sku: string; category: string; brand: string; model: string
  price: number; status: Status; location: string
  hasVariants: boolean; attributes: AttrDef[]; variants: SeedVariant[]; createdAt: string
}

const fillVariant = (v: SeedVariant): Variant => ({
  brandName: '', image: '', selected: true, ...v,
})

const fillProduct = (p: SeedProduct): Product => ({
  description: '', image: '', images: [],
  ...p,
  variants: p.variants.map(fillVariant),
})

const seed: SeedProduct[] = [
  {
    id: 1, name: 'Spark Plug Iridium', sku: 'NGK-SP-001', category: 'Engine Parts',
    brand: 'NGK', model: 'IRIDIUM IX', price: 12500, status: 'active', location: 'Central Warehouse',
    hasVariants: true,
    attributes: [{ id: 'a1', name: 'Size', values: ['14mm', '16mm'] }],
    variants: [
      { key: '14mm', attributes: { Size: '14mm' }, sku: 'NGK-SP-001-14MM', price: '12500', quantity: '150' },
      { key: '16mm', attributes: { Size: '16mm' }, sku: 'NGK-SP-001-16MM', price: '13500', quantity: '80' },
    ],
    createdAt: 'Jan 5, 2026',
  },
  {
    id: 2, name: 'Brake Pads Set', sku: 'BRB-BP-001', category: 'Brakes',
    brand: 'Brembo', model: 'P06005', price: 72000, status: 'active', location: 'AutoZone Tashkent',
    hasVariants: true,
    attributes: [{ id: 'a1', name: 'Axle', values: ['Front', 'Rear'] }],
    variants: [
      { key: 'Front', attributes: { Axle: 'Front' }, sku: 'BRB-BP-001-FRONT', price: '85000', quantity: '40' },
      { key: 'Rear',  attributes: { Axle: 'Rear'  }, sku: 'BRB-BP-001-REAR',  price: '72000', quantity: '35' },
    ],
    createdAt: 'Jan 12, 2026',
  },
  {
    id: 3, name: 'Oil Filter', sku: 'MNN-OF-001', category: 'Filters',
    brand: 'Mann', model: 'W 712/22', price: 18000, status: 'active', location: 'Central Warehouse',
    hasVariants: false, attributes: [], variants: [],
    createdAt: 'Jan 20, 2026',
  },
  {
    id: 4, name: 'Shock Absorber', sku: 'MNR-SA-001', category: 'Suspension',
    brand: 'Monroe', model: 'OESpectrum', price: 125000, status: 'active', location: 'North Warehouse',
    hasVariants: true,
    attributes: [{ id: 'a1', name: 'Position', values: ['Front Left', 'Front Right', 'Rear Left', 'Rear Right'] }],
    variants: [
      { key: 'Front Left',  attributes: { Position: 'Front Left'  }, sku: 'MNR-SA-001-FL', price: '145000', quantity: '12' },
      { key: 'Front Right', attributes: { Position: 'Front Right' }, sku: 'MNR-SA-001-FR', price: '145000', quantity: '12' },
      { key: 'Rear Left',   attributes: { Position: 'Rear Left'   }, sku: 'MNR-SA-001-RL', price: '125000', quantity: '8'  },
      { key: 'Rear Right',  attributes: { Position: 'Rear Right'  }, sku: 'MNR-SA-001-RR', price: '125000', quantity: '8'  },
    ],
    createdAt: 'Feb 3, 2026',
  },
  {
    id: 5, name: 'Air Filter', sku: 'MNN-AF-002', category: 'Filters',
    brand: 'Mann', model: 'C 2882', price: 22000, status: 'active', location: 'AutoZone Tashkent',
    hasVariants: false, attributes: [], variants: [],
    createdAt: 'Feb 15, 2026',
  },
  {
    id: 6, name: 'Alternator Belt', sku: 'CNT-AB-001', category: 'Engine Parts',
    brand: 'Continental', model: '6PK1546', price: 35000, status: 'inactive', location: 'Central Warehouse',
    hasVariants: false, attributes: [], variants: [],
    createdAt: 'Mar 1, 2026',
  },
  {
    id: 7, name: 'Wheel Bearing Kit', sku: 'SKF-WB-001', category: 'Suspension',
    brand: 'SKF', model: 'VKBA3546', price: 58000, status: 'active', location: 'Samarkand Depot',
    hasVariants: true,
    attributes: [{ id: 'a1', name: 'Axle', values: ['Front', 'Rear'] }],
    variants: [
      { key: 'Front', attributes: { Axle: 'Front' }, sku: 'SKF-WB-001-FRONT', price: '68000', quantity: '20' },
      { key: 'Rear',  attributes: { Axle: 'Rear'  }, sku: 'SKF-WB-001-REAR',  price: '58000', quantity: '15' },
    ],
    createdAt: 'Mar 18, 2026',
  },
  {
    id: 8, name: 'Oxygen Sensor', sku: 'BSH-OS-001', category: 'Electrical',
    brand: 'Bosch', model: '0 258 006', price: 95000, status: 'active', location: 'CarParts Express',
    hasVariants: false, attributes: [], variants: [],
    createdAt: 'Apr 5, 2026',
  },
  {
    id: 9, name: 'Timing Belt Kit', sku: 'CNT-TB-001', category: 'Engine Parts',
    brand: 'Continental', model: 'CT1139K3', price: 185000, status: 'active', location: 'Central Warehouse',
    hasVariants: false, attributes: [], variants: [],
    createdAt: 'Apr 20, 2026',
  },
  {
    id: 10, name: 'Brake Disc', sku: 'BSH-BD-001', category: 'Brakes',
    brand: 'Bosch', model: '0 986 479', price: 110000, status: 'active', location: 'AutoZone Tashkent',
    hasVariants: true,
    attributes: [{ id: 'a1', name: 'Axle', values: ['Front', 'Rear'] }],
    variants: [
      { key: 'Front', attributes: { Axle: 'Front' }, sku: 'BSH-BD-001-FRONT', price: '110000', quantity: '18' },
      { key: 'Rear',  attributes: { Axle: 'Rear'  }, sku: 'BSH-BD-001-REAR',  price: '92000',  quantity: '14' },
    ],
    createdAt: 'May 3, 2026',
  },
]

let products: Product[] = seed.map(fillProduct)

// ─── Store ─────────────────────────────────────────────────────────────────────

const listeners = new Set<() => void>()
const emit = () => listeners.forEach(l => l())
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb) } }

function effectivePrice(input: ProductInput): number {
  if (input.hasVariants) {
    const sel = input.variants.filter(v => v.selected)
    const list = sel.length > 0 ? sel : input.variants
    if (list.length > 0) return Math.min(...list.map(v => Number(v.price) || 0))
  }
  if (input.variants.length > 0) return Number(input.variants[0].price) || 0
  return 0
}

export function useProducts(): Product[] {
  return useSyncExternalStore(subscribe, () => products)
}

export function getProduct(id: number): Product | undefined {
  return products.find(p => p.id === id)
}

export function createProduct(input: ProductInput): Product {
  const product: Product = {
    id: Date.now(),
    ...input,
    price: effectivePrice(input),
    image: input.images[0] ?? '',
    createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }
  products = [product, ...products]
  emit()
  return product
}

export function updateProduct(id: number, input: ProductInput) {
  products = products.map(p => p.id === id
    ? { ...p, ...input, price: effectivePrice(input), image: input.images[0] ?? '' }
    : p)
  emit()
}

export function deleteProduct(id: number) {
  products = products.filter(p => p.id !== id)
  emit()
}

// ─── Variant helpers ───────────────────────────────────────────────────────────

export interface VariantBase {
  sku: string; brandName: string; price: string
}

export const DEFAULT_VARIANT_KEY = '__default__'

function makeVariant(key: string, attributes: Record<string, string>, base: VariantBase, suffix: string, image: string): Variant {
  return {
    key, attributes,
    sku: base.sku ? (suffix ? `${base.sku}-${suffix}` : base.sku) : suffix,
    brandName: base.brandName,
    price: base.price || '0', quantity: '0', image, selected: true,
  }
}

export function cartesian(attrs: AttrDef[]): Record<string, string>[] {
  const valid = attrs.filter(a => a.name.trim() && a.values.length > 0)
  if (valid.length === 0) return []
  let result: Record<string, string>[] = [{}]
  for (const attr of valid) {
    const next: Record<string, string>[] = []
    for (const combo of result)
      for (const val of attr.values)
        next.push({ ...combo, [attr.name]: val })
    result = next
  }
  return result
}

/** Generate variants from attributes. With no valid attributes, returns a single default variant. */
export function generateVariants(attrs: AttrDef[], base: VariantBase, existing: Variant[]): Variant[] {
  const valid = attrs.filter(a => a.name.trim() && a.values.length > 0)
  const combos = cartesian(attrs)

  if (combos.length === 0) {
    const found = existing.find(e => e.key === DEFAULT_VARIANT_KEY)
    return [found ?? makeVariant(DEFAULT_VARIANT_KEY, {}, base, '', '')]
  }

  const firstAttr = valid[0]
  return combos.map(combo => {
    const key = Object.values(combo).join('|')
    const found = existing.find(e => e.key === key)
    if (found) return found
    const suffix = Object.values(combo).map(v => v.toUpperCase().replace(/\s+/g, '-')).join('-')
    const img = firstAttr?.valueImages?.[combo[firstAttr.name]] ?? ''
    return makeVariant(key, combo, base, suffix, img)
  })
}

export const hasValidVariants = (attrs: AttrDef[]) =>
  attrs.some(a => a.name.trim() && a.values.length > 0)
