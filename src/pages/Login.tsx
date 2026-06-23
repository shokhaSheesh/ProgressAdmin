import { useState, type FormEvent, type ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'

type Role = 'super' | 'seller'

const roles: { id: Role; label: string; sub: string; icon: ReactElement }[] = [
  {
    id: 'super',
    label: 'Super Admin',
    sub: 'Full platform access',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6
             11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623
             5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152
             c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    id: 'seller',
    label: 'Seller Admin',
    sub: 'Shop & orders only',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5
             0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0
             0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0
             1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0
             1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5
             0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0
             015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3
             3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75
             0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
      </svg>
    ),
  },
]

export default function Login() {
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('super')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) {
      setError('Please enter your username and password.')
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    // TODO: replace with real auth — navigate based on role
    navigate(role === 'super' ? '/admin' : '/seller')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">

      {/* §5.2 Card */}
      <div
        className="bg-card rounded-2xl border border-black/[0.08] p-8 w-full max-w-[440px]"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
      >

        {/* Brand */}
        <div className="flex flex-col items-center gap-2 mb-7">
          <div className="w-11 h-11 rounded-2xl bg-secondary flex items-center justify-center mb-1">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Progress</h1>
          <p className="text-[12px] font-medium text-muted-foreground">Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

          {/* ── Role selector ── */}
          <div className="flex flex-col gap-2">
            {/* §5.3 Section label */}
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Sign in as
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {roles.map((r) => {
                const active = role === r.id
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => { setRole(r.id); setError('') }}
                    className={[
                      'flex items-center gap-3 rounded-xl px-3.5 py-3.5 border-2 transition-all text-left',
                      active
                        ? 'bg-primary border-primary'
                        : 'bg-[#F4F5F7] border-transparent hover:border-black/10',
                    ].join(' ')}
                    style={active ? { boxShadow: '0 4px 16px rgba(37,99,235,0.35)' } : {}}
                  >
                    {/* Icon circle */}
                    <span className={[
                      'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                      active ? 'bg-white/20' : 'bg-white',
                    ].join(' ')}>
                      <span className={active ? 'text-white' : 'text-primary'}>
                        {r.icon}
                      </span>
                    </span>
                    <span className="flex flex-col gap-0.5 min-w-0">
                      <span className={[
                        'text-[13px] font-semibold leading-tight',
                        active ? 'text-white' : 'text-foreground',
                      ].join(' ')}>
                        {r.label}
                      </span>
                      <span className={[
                        'text-[11px] font-medium leading-tight',
                        active ? 'text-white/70' : 'text-muted-foreground',
                      ].join(' ')}>
                        {r.sub}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Credentials ── */}
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Credentials
            </p>

            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-[13px] font-semibold text-foreground">
                Username
              </label>
              {/* §5.5 */}
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full bg-[#F4F5F7] text-foreground placeholder-muted-foreground
                           rounded-xl px-4 py-3.5 text-sm font-normal border border-transparent
                           focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                           transition-all"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[13px] font-semibold text-foreground">
                Password
              </label>
              {/* §5.5 */}
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-[#F4F5F7] text-foreground placeholder-muted-foreground
                           rounded-xl px-4 py-3.5 text-sm font-normal border border-transparent
                           focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                           transition-all"
              />
            </div>
          </div>

          {/* Error — §1.2 Failed = bg-red-50 / text-red-500 */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-[11px] font-semibold text-red-500">{error}</p>
            </div>
          )}

          {/* §5.4 Primary button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white rounded-xl py-3.5 text-[14px] font-semibold
                       hover:bg-primary-hover active:scale-[0.98] transition-all
                       flex items-center justify-center gap-2
                       disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            style={{ boxShadow: '0 4px 20px rgba(37,99,235,0.45)' }}
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in…
              </>
            ) : (
              `Sign in as ${role === 'super' ? 'Super Admin' : 'Seller Admin'}`
            )}
          </button>
        </form>

        <p className="text-center text-[11px] font-medium text-muted-foreground mt-6">
          Progress © {new Date().getFullYear()} · Admin Panel
        </p>
      </div>
    </div>
  )
}
