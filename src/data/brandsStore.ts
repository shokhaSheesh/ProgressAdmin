import { useSyncExternalStore } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type BrandStatus = 'active' | 'inactive'

export interface BrandModel {
  id: number
  name: string
  logo: string
  createdAt: string
}

export interface Brand {
  id: number
  name: string
  logo: string
  status: BrandStatus
  createdAt: string
  models: BrandModel[]
}

export interface BrandInput {
  name: string
  logo: string
  status: BrandStatus
}

export interface BrandModelInput {
  name: string
  logo: string
}

// ─── Seed ──────────────────────────────────────────────────────────────────────

let brands: Brand[] = [
  {
    id: 1, name: 'Bosch', logo: '', status: 'active', createdAt: 'Jan 5, 2026',
    models: [
      { id: 11, name: 'Bosch Automotive', logo: '', createdAt: 'Jan 5, 2026' },
      { id: 12, name: 'Bosch Professional', logo: '', createdAt: 'Jan 5, 2026' },
    ],
  },
  {
    id: 2, name: 'Denso', logo: '', status: 'active', createdAt: 'Jan 5, 2026',
    models: [
      { id: 21, name: 'Denso OEM', logo: '', createdAt: 'Jan 5, 2026' },
    ],
  },
  { id: 3,  name: 'NGK',         logo: '', status: 'active',   createdAt: 'Jan 5, 2026',  models: [] },
  { id: 4,  name: 'Monroe',      logo: '', status: 'active',   createdAt: 'Jan 10, 2026', models: [] },
  { id: 5,  name: 'SKF',         logo: '', status: 'active',   createdAt: 'Jan 10, 2026', models: [] },
  { id: 6,  name: 'Mann Filter', logo: '', status: 'active',   createdAt: 'Jan 10, 2026', models: [] },
  { id: 7,  name: 'Continental', logo: '', status: 'active',   createdAt: 'Feb 1, 2026',  models: [] },
  { id: 8,  name: 'Brembo',      logo: '', status: 'active',   createdAt: 'Feb 1, 2026',  models: [] },
  { id: 9,  name: 'Gates',       logo: '', status: 'inactive', createdAt: 'Feb 14, 2026', models: [] },
  { id: 10, name: 'Mahle',       logo: '', status: 'active',   createdAt: 'Feb 14, 2026', models: [] },
  { id: 11, name: 'Sachs',       logo: '', status: 'active',   createdAt: 'Mar 2, 2026',  models: [] },
  { id: 12, name: 'Valeo',       logo: '', status: 'inactive', createdAt: 'Mar 2, 2026',  models: [] },
]

// ─── Store ─────────────────────────────────────────────────────────────────────

const listeners = new Set<() => void>()
const emit = () => listeners.forEach(l => l())
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb) } }

export function useBrands(): Brand[] {
  return useSyncExternalStore(subscribe, () => brands)
}

export function getBrand(id: number): Brand | undefined {
  return brands.find(b => b.id === id)
}

export function createBrand(input: BrandInput): Brand {
  const brand: Brand = {
    id: Date.now(), ...input,
    createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    models: [],
  }
  brands = [...brands, brand]
  emit()
  return brand
}

export function updateBrand(id: number, input: BrandInput) {
  brands = brands.map(b => b.id === id ? { ...b, ...input } : b)
  emit()
}

export function deleteBrand(id: number) {
  brands = brands.filter(b => b.id !== id)
  emit()
}

// ─── Model CRUD ────────────────────────────────────────────────────────────────

export function addModel(brandId: number, input: BrandModelInput): BrandModel {
  const model: BrandModel = {
    id: Date.now(), ...input,
    createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }
  brands = brands.map(b => b.id === brandId ? { ...b, models: [...b.models, model] } : b)
  emit()
  return model
}

export function updateModel(brandId: number, modelId: number, input: BrandModelInput) {
  brands = brands.map(b =>
    b.id === brandId
      ? { ...b, models: b.models.map(m => m.id === modelId ? { ...m, ...input } : m) }
      : b
  )
  emit()
}

export function deleteModel(brandId: number, modelId: number) {
  brands = brands.map(b =>
    b.id === brandId ? { ...b, models: b.models.filter(m => m.id !== modelId) } : b
  )
  emit()
}
