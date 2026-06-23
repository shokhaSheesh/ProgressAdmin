import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from '../components/AdminSidebar'

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true'
  )

  const toggle = () =>
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar collapsed={collapsed} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Topbar ── */}
        <header
          className="flex items-center gap-3 px-4 bg-card border-b border-black/[0.06] shrink-0"
          style={{ height: 60, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        >
          <button
            onClick={toggle}
            className="w-9 h-9 flex items-center justify-center rounded-xl
                       text-muted-foreground hover:bg-[#F4F5F7] hover:text-foreground
                       transition-all shrink-0"
            aria-label="Toggle sidebar"
          >
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
              <rect y="0"  width="18" height="2" rx="1" fill="currentColor" />
              <rect y="6"  width="18" height="2" rx="1" fill="currentColor" />
              <rect y="12" width="12" height="2" rx="1" fill="currentColor" />
            </svg>
          </button>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
