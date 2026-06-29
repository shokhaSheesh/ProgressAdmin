import { NavLink, useNavigate } from 'react-router-dom'

// ─── Nav tree ───────────────────────────────────────────────────────────────

type NavItem = { label: string; path: string; icon: React.ReactNode }
type NavGroup = { title: string; items: NavItem[] }

const nav: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        label: 'Dashboard',
        path: '/admin',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Commerce',
    items: [
      {
        label: 'Orders',
        path: '/admin/orders',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Users',
    items: [
      {
        label: 'Users',
        path: '/admin/users',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
      {
        label: 'Admin Users',
        path: '/admin/admin-users',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        ),
      },
      {
        label: 'Shops',
        path: '/admin/shops',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        ),
      },
      {
        label: 'Requests',
        path: '/admin/requests',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Catalog',
    items: [
      {
        label: 'Products',
        path: '/admin/products',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        ),
      },
      {
        label: 'Categories',
        path: '/admin/categories',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <path d="M3 17.5A3.5 3.5 0 0 0 6.5 21M3 14v.01" />
            <path d="M7 14a3 3 0 0 1 3 3v4" />
          </svg>
        ),
      },
      {
        label: 'Inventory',
        path: '/admin/inventory',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 8h14M5 8a2 2 0 1 0-4 0v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8m-14 0V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M10 12h4" />
          </svg>
        ),
      },
      {
        label: 'Banners',
        path: '/admin/banners',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        ),
      },
      {
        label: 'Brands',
        path: '/admin/brands',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Finance',
    items: [
      {
        label: 'Withdrawals',
        path: '/admin/withdrawals',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
            <path d="M12 15v-3m0 0l-1.5 1.5M12 12l1.5 1.5" />
          </svg>
        ),
      },
      {
        label: 'Bonuses',
        path: '/admin/bonuses',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        ),
      },
      {
        label: 'Bonus History',
        path: '/admin/bonus-history',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Network',
    items: [
      {
        label: 'Regions',
        path: '/admin/regions',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        ),
      },
      {
        label: 'Locations',
        path: '/admin/locations',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        label: 'Roles & Permissions',
        path: '/admin/roles',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        ),
      },
      {
        label: 'Notifications',
        path: '/admin/notifications',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        ),
      },
    ],
  },
]

// ─── Component ──────────────────────────────────────────────────────────────

interface AdminSidebarProps {
  collapsed: boolean
}

export default function AdminSidebar({ collapsed }: AdminSidebarProps) {
  const navigate = useNavigate()

  return (
    <aside
      className="flex flex-col transition-all duration-300 shrink-0"
      style={{
        width: collapsed ? 64 : 240,
        backgroundColor: '#2563EB',
        boxShadow: '4px 0 24px rgba(37,99,235,0.25)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center border-b border-white/[0.1]"
        style={{ height: 60, padding: collapsed ? '0 0 0 18px' : '0 20px' }}
      >
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2.5 min-w-0"
        >
          <span className="w-7 h-7 rounded-lg bg-white/[0.12] flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </span>
          {!collapsed && (
            <span className="text-[14px] font-extrabold text-white tracking-tight truncate">
              Progress
            </span>
          )}
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3"
        style={{ scrollbarWidth: 'none' }}>
        {nav.map((group) => (
          <div key={group.title} className="mb-1">
            {/* §5.3 Section label */}
            {!collapsed && (
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider
                            px-5 pt-3 pb-1.5">
                {group.title}
              </p>
            )}
            {collapsed && <div className="h-3" />}

            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) => [
                  'flex items-center gap-3 transition-all relative group',
                  collapsed
                    ? 'mx-2 my-0.5 px-0 py-2.5 rounded-xl justify-center'
                    : 'mx-2 my-0.5 px-3 py-2.5 rounded-xl',
                  isActive
                    ? 'bg-white/[0.15] text-white'
                    : 'text-white/60 hover:bg-white/[0.08] hover:text-white',
                ].join(' ')}
              >
                {({ isActive }) => (
                  <>
                    {/* Active left accent bar */}
                    {isActive && !collapsed && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5
                                       bg-white rounded-full" />
                    )}

                    {/* Icon */}
                    <span className={[
                      'shrink-0',
                      collapsed ? 'w-5 h-5' : 'w-[18px] h-[18px]',
                    ].join(' ')}>
                      {item.icon}
                    </span>

                    {/* Label */}
                    {!collapsed && (
                      <span className={[
                        'text-[13px] truncate',
                        isActive ? 'font-semibold' : 'font-medium',
                      ].join(' ')}>
                        {item.label}
                      </span>
                    )}

                    {/* Tooltip when collapsed */}
                    {collapsed && (
                      <span className="pointer-events-none absolute left-full ml-2 z-50
                                       bg-foreground text-white text-[11px] font-semibold
                                       px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0
                                       group-hover:opacity-100 transition-opacity"
                        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                        {item.label}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* ── Footer — Sign out ── */}
      <div className="border-t border-white/[0.1] p-2">
        <button
          onClick={() => navigate('/login')}
          className={[
            'flex items-center gap-3 w-full rounded-xl py-2.5 transition-all',
            'text-white/50 hover:bg-white/[0.08] hover:text-red-300',
            collapsed ? 'justify-center px-0' : 'px-3',
          ].join(' ')}
        >
          <span className="w-[18px] h-[18px] shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
          {!collapsed && (
            <span className="text-[13px] font-medium text-inherit">Sign out</span>
          )}
        </button>
      </div>
    </aside>
  )
}
