import { type ReactNode } from 'react'

interface SellerLayoutProps {
  children?: ReactNode
}

export default function SellerLayout({ children }: SellerLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Seller Sidebar — placeholder */}
      <aside
        className="w-64 shrink-0 bg-card border-r border-black/[0.08]"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
      />

      {/* Main content area — placeholder */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
