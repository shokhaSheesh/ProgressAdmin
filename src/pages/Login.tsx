import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
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
    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
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
          {/* Credentials */}
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Credentials
            </p>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-[13px] font-semibold text-foreground">
                Username
              </label>
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

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[13px] font-semibold text-foreground">
                Password
              </label>
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

          {error && (
            <div className="flex items-center gap-2 bg-red-50 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-[11px] font-semibold text-red-500">{error}</p>
            </div>
          )}

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
              'Sign in'
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
