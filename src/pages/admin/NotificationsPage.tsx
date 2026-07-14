import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { callGateway, gatewayList, methods } from '../../api/gateway'

const LANGS: { key: 'uz' | 'ru' | 'en'; label: string }[] = [
  { key: 'uz', label: 'UZ' },
  { key: 'ru', label: 'RU' },
  { key: 'en', label: 'EN' },
]

export interface NotificationRecipient {
  guid?: string
  notifications_id?: string
  users_id?: string
  user_name?: string
  user_phone?: string
}

export interface NotificationRow {
  guid: string
  content_en?: string
  content_ru?: string
  content_uz?: string
  images?: string[]
  created_at?: string
  recipients?: NotificationRecipient[]
}

type NotificationsResponse = {
  data?: NotificationRow[]
  notifications?: NotificationRow[]
  total?: number
}

function titleOf(notif: NotificationRow) {
  const content = notif.content_en || notif.content_ru || notif.content_uz || ''
  return content.length > 40 ? `${content.slice(0, 40)}...` : content || 'Notification'
}

function formatDate(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${day}  ${time}`
}

function recipientLabel(recipient: NotificationRecipient) {
  return recipient.user_name || recipient.user_phone || recipient.users_id || 'Recipient'
}

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

function DetailModal({ notif, onClose }: { notif: NotificationRow; onClose: () => void }) {
  const [lang, setLang] = useState<'uz' | 'ru' | 'en'>('uz')
  const recipients = notif.recipients || []
  useEscClose(onClose)
  useLockScroll()
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div className="bg-card rounded-2xl w-full max-w-3xl" style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.06]">
          <div>
            <h2 className="text-[16px] font-extrabold text-foreground">{titleOf(notif)}</h2>
            <p className="text-[12px] font-medium text-muted-foreground mt-0.5">{formatDate(notif.created_at)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-[#F4F5F7] transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-5">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recipients</p>
            <div className="flex flex-wrap gap-1.5">
              {recipients.length === 0 && <span className="bg-[#F4F5F7] text-muted-foreground text-[12px] font-medium px-3 py-1 rounded-lg">No recipients</span>}
              {recipients.map((r) => (
                <span key={r.guid || r.users_id} className="bg-[#F4F5F7] text-foreground text-[12px] font-medium px-3 py-1 rounded-lg">{recipientLabel(r)}</span>
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
              {lang === 'uz' ? notif.content_uz : lang === 'ru' ? notif.content_ru : notif.content_en}
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [detailId, setDetailId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadNotifications = () => {
    setLoading(true)
    setError('')
    gatewayList<NotificationsResponse>(methods.notifications.list, { page: 1, limit: 100, sort: { created_at: -1 } })
      .then((response) => setNotifications(response.notifications || response.data || []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load notifications'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await callGateway(methods.notifications.delete, { guid: id })
    setNotifications((items) => items.filter((item) => item.guid !== id))
  }

  const detail = useMemo(() => notifications.find((n) => n.guid === detailId), [detailId, notifications])

  return (
    <div className="p-6 flex flex-col gap-6">
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
            {loading && (
              <tr><td colSpan={4} className="px-5 py-12 text-center text-[13px] font-medium text-muted-foreground">Loading notifications...</td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={4} className="px-5 py-12 text-center text-[13px] font-medium text-red-500">{error}</td></tr>
            )}
            {!loading && !error && notifications.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-12 text-center text-[13px] font-medium text-muted-foreground">No notifications sent yet</td></tr>
            )}
            {!loading && !error && notifications.map((n) => {
              const recipients = n.recipients || []
              return (
                <tr key={n.guid} onClick={() => setDetailId(n.guid)} className="hover:bg-[#F4F5F7]/60 transition-colors cursor-pointer">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                      </span>
                      <p className="text-[13px] font-semibold text-foreground">{titleOf(n)}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                      {recipients.slice(0, 3).map((r) => (
                        <span key={r.guid || r.users_id} className="bg-[#F4F5F7] text-foreground text-[11px] font-medium px-2.5 py-1 rounded-lg whitespace-nowrap">{recipientLabel(r)}</span>
                      ))}
                      {recipients.length > 3 && (
                        <span className="bg-primary/[0.08] text-primary text-[11px] font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap">+{recipients.length - 3} more</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-[13px] font-medium text-muted-foreground whitespace-nowrap">{formatDate(n.created_at)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/notifications/${n.guid}/edit`) }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDelete(n.guid, e)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {detail && <DetailModal notif={detail} onClose={() => setDetailId(null)} />}
    </div>
  )
}
