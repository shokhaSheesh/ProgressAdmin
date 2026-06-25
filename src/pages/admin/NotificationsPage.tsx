import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { notifStore } from './NotificationFormPage'
import type { NotifData } from './NotificationFormPage'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LANGS: { key: 'uz' | 'ru' | 'en'; label: string }[] = [
  { key: 'uz', label: 'UZ' },
  { key: 'ru', label: 'RU' },
  { key: 'en', label: 'EN' },
]

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useEscClose(onClose: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
}

function useLockScroll() {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])
}

// ─── Detail modal ─────────────────────────────────────────────────────────────

function DetailModal({ notif, onClose }: { notif: NotifData; onClose: () => void }) {
  const [lang, setLang] = useState<'uz' | 'ru' | 'en'>('uz')
  useEscClose(onClose)
  useLockScroll()
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div className="bg-card rounded-2xl w-full max-w-3xl" style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.06]">
          <div>
            <h2 className="text-[16px] font-extrabold text-foreground">{notif.title}</h2>
            <p className="text-[12px] font-medium text-muted-foreground mt-0.5">{notif.sentAt}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-5">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recipients</p>
            <div className="flex flex-wrap gap-1.5">
              {notif.recipients.map((r) => (
                <span key={r} className="bg-[#F4F5F7] text-foreground text-[12px] font-medium px-3 py-1 rounded-lg">{r}</span>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Message</p>
              <div className="flex bg-[#F4F5F7] rounded-lg p-0.5 gap-0.5">
                {LANGS.map((l) => (
                  <button key={l.key} type="button" onClick={() => setLang(l.key)}
                    className={['px-3 py-1 rounded-md text-[11px] font-bold transition-all',
                      lang === l.key ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'].join(' ')}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="bg-[#F4F5F7] rounded-xl px-4 py-3 text-[13px] font-medium text-foreground leading-relaxed">
              {notif.text[lang]}
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<NotifData[]>([...notifStore])
  const [detailId, setDetailId] = useState<number | null>(null)

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const idx = notifStore.findIndex((n) => n.id === id)
    if (idx >= 0) notifStore.splice(idx, 1)
    setNotifications([...notifStore])
  }

  const detail = detailId !== null ? notifications.find((n) => n.id === detailId) : null

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Notifications</h1>
          <p className="text-[13px] font-medium text-muted-foreground mt-0.5">Sent push notifications to users</p>
        </div>
        <button onClick={() => navigate('/admin/notifications/new')}
          className="flex items-center gap-2 h-9 px-4 bg-primary text-white rounded-xl text-[13px] font-semibold hover:bg-primary/90 transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Create
        </button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-black/[0.06] overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-black/[0.06]">
              {['Title', 'Recipients', 'Sent At', ''].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04]">
            {notifications.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-12 text-center text-[13px] font-medium text-muted-foreground">No notifications sent yet</td></tr>
            )}
            {notifications.map((n) => (
              <tr key={n.id} onClick={() => setDetailId(n.id)} className="hover:bg-[#F4F5F7]/60 transition-colors cursor-pointer">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    </span>
                    <p className="text-[13px] font-semibold text-foreground">{n.title}</p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1.5 max-w-xs">
                    {n.recipients.slice(0, 3).map((r) => (
                      <span key={r} className="bg-[#F4F5F7] text-foreground text-[11px] font-medium px-2.5 py-1 rounded-lg whitespace-nowrap">{r}</span>
                    ))}
                    {n.recipients.length > 3 && (
                      <span className="bg-primary/[0.08] text-primary text-[11px] font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap">+{n.recipients.length - 3} more</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="text-[13px] font-medium text-muted-foreground whitespace-nowrap">{n.sentAt}</p>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/admin/notifications/${n.id}/edit`) }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDelete(n.id, e)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && <DetailModal notif={detail} onClose={() => setDetailId(null)} />}
    </div>
  )
}
