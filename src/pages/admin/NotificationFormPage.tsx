import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { callGateway, gatewayList, methods } from '../../api/gateway'

interface ApiUserRow {
  guid: string
  full_name?: string
  phone?: string
  login?: string
}

interface ApiNotificationRecipient {
  guid?: string
  users_id?: string
}

interface ApiNotificationRow {
  guid: string
  content_en?: string
  content_ru?: string
  content_uz?: string
  recipients?: ApiNotificationRecipient[]
}

type UsersResponse = {
  data?: ApiUserRow[]
  users?: ApiUserRow[]
}

type NotificationResponse = {
  notification?: ApiNotificationRow
}

const avatarColors = ['bg-blue-500','bg-violet-500','bg-emerald-500','bg-amber-500','bg-pink-500','bg-cyan-500','bg-rose-500','bg-teal-500']
const aColor = (s: string) => avatarColors[(s.charCodeAt(0) + (s.charCodeAt(1) || 0)) % avatarColors.length]

const LANGS: { key: 'uz' | 'ru' | 'en'; label: string; placeholder: string }[] = [
  { key: 'uz', label: 'UZ', placeholder: 'O\'zbek tilidagi xabar...'   },
  { key: 'ru', label: 'RU', placeholder: 'Сообщение на русском...'     },
  { key: 'en', label: 'EN', placeholder: 'Message in English...'       },
]

const inputBase = 'w-full bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[13px] font-medium border transition-all focus:outline-none focus:ring-2'
const inputCls  = (err?: boolean) =>
  `${inputBase} ${err ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-transparent focus:border-primary focus:ring-primary/20'}`

function initials(user: ApiUserRow) {
  const name = user.full_name || user.login || user.phone || '#'
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '#'
}

function userName(user: ApiUserRow) {
  return user.full_name || user.login || user.phone || 'User'
}

function UserSelector({
  users,
  selected,
  onChange,
}: {
  users: ApiUserRow[]
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  const filtered = users.filter((u) => {
    const query = search.toLowerCase()
    return userName(u).toLowerCase().includes(query) || (u.phone || '').includes(search)
  })
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
  const toggleAll = () => onChange(selected.length === users.length ? [] : users.map((u) => u.guid))

  const label = selected.length === 0
    ? 'Select recipients'
    : selected.length === users.length
    ? 'All users'
    : `${selected.length} user${selected.length > 1 ? 's' : ''} selected`

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className={['w-full flex items-center justify-between gap-2 bg-[#F4F5F7] rounded-xl px-4 py-3 text-[13px] font-medium border transition-all focus:outline-none',
          open ? 'border-primary ring-2 ring-primary/20' : 'border-transparent',
          selected.length > 0 ? 'text-foreground' : 'text-muted-foreground'].join(' ')}>
        <span className="truncate">{label}</span>
        <svg className={['w-4 h-4 text-muted-foreground shrink-0 transition-transform', open ? 'rotate-180' : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-card rounded-xl border border-black/[0.08] z-10 overflow-hidden"
          style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          <div className="p-2 border-b border-black/[0.06]">
            <div className="flex items-center gap-2 bg-[#F4F5F7] rounded-lg px-3 py-2">
              <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..."
                className="bg-transparent text-[12px] font-medium text-foreground placeholder:text-muted-foreground flex-1 focus:outline-none" />
            </div>
          </div>
          <button type="button" onClick={toggleAll}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] font-semibold text-foreground hover:bg-[#F4F5F7] transition-colors border-b border-black/[0.04]">
            <Checkbox checked={users.length > 0 && selected.length === users.length} indeterminate={selected.length > 0 && selected.length < users.length} />
            All users
          </button>
          <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
            {filtered.length === 0
              ? <p className="text-[12px] text-muted-foreground text-center py-4">No users found</p>
              : filtered.map((u) => {
                  const checked = selected.includes(u.guid)
                  return (
                    <button key={u.guid} type="button" onClick={() => toggle(u.guid)}
                      className={['w-full flex items-center gap-3 px-4 py-3 transition-colors text-left',
                        checked ? 'bg-primary/[0.06]' : 'hover:bg-[#F4F5F7]'].join(' ')}>
                      <Checkbox checked={checked} />
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${aColor(initials(u))}`}>{initials(u)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate">{userName(u)}</p>
                        <p className="text-[11px] font-medium text-muted-foreground font-mono">{u.phone || u.login || u.guid}</p>
                      </div>
                    </button>
                  )
                })
            }
          </div>
        </div>
      )}
    </div>
  )
}

function Checkbox({ checked, indeterminate }: { checked: boolean; indeterminate?: boolean }) {
  return (
    <span className={['w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors',
      checked || indeterminate ? 'bg-primary border-primary' : 'border-black/20 bg-white'].join(' ')}>
      {checked && !indeterminate && (
        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      )}
      {indeterminate && <span className="w-2 h-0.5 bg-white rounded" />}
    </span>
  )
}

export default function NotificationFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const [users, setUsers] = useState<ApiUserRow[]>([])
  const [recipients, setRecipients] = useState<string[]>([])
  const [text, setText] = useState({ uz: '', ru: '', en: '' })
  const [lang, setLang] = useState<'uz' | 'ru' | 'en'>('uz')
  const [errors, setErrors] = useState<{ recipients?: boolean; uz?: boolean; ru?: boolean; en?: boolean; submit?: string }>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      gatewayList<UsersResponse>(methods.users.list, { page: 1, limit: 500, sort: { created_at: -1 } }),
      isEdit && id ? callGateway<NotificationResponse>(methods.notifications.get, { guid: id }) : Promise.resolve(null),
    ])
      .then(([usersResponse, notificationResponse]) => {
        if (!active) return
        setUsers(usersResponse.users || usersResponse.data || [])
        const notification = notificationResponse?.notification
        if (notification) {
          setText({
            uz: notification.content_uz || '',
            ru: notification.content_ru || '',
            en: notification.content_en || '',
          })
          setRecipients((notification.recipients || []).map((row) => row.users_id || '').filter(Boolean))
        }
      })
      .catch((err) => setErrors((current) => ({ ...current, submit: err instanceof Error ? err.message : 'Failed to load notification' })))
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id, isEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (recipients.length === 0)  errs.recipients = true
    if (!text.uz.trim()) errs.uz = true
    if (!text.ru.trim()) errs.ru = true
    if (!text.en.trim()) errs.en = true
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    setErrors({})
    const payload = {
      content_uz: text.uz.trim(),
      content_ru: text.ru.trim(),
      content_en: text.en.trim(),
      recipients: recipients.map((users_id) => ({ users_id })),
    }

    try {
      await callGateway(isEdit && id ? methods.notifications.update : methods.notifications.create, isEdit && id ? { ...payload, guid: id } : payload)
      navigate('/admin/notifications')
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to save notification' })
    } finally {
      setSaving(false)
    }
  }

  const langHasError = (k: 'uz' | 'ru' | 'en') => !!errors[k]
  const allFilled = LANGS.every((l) => text[l.key].trim())

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/notifications')}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-card border border-black/[0.08] transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div>
          <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">
            {isEdit ? 'Edit Notification' : 'Send Notification'}
          </h1>
          <p className="text-[13px] font-medium text-muted-foreground mt-0.5">
            {isEdit ? 'Update the content and recipients' : 'Compose and send a push notification'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-card rounded-2xl border border-black/[0.06] p-8 text-center text-[13px] font-medium text-muted-foreground">Loading...</div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="bg-card rounded-2xl border border-black/[0.06] p-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <label className="block text-[13px] font-bold text-foreground mb-3">Recipients</label>
            <UserSelector users={users} selected={recipients} onChange={(ids) => { setRecipients(ids); setErrors((e) => ({ ...e, recipients: undefined })) }} />
            {errors.recipients && <p className="text-[11px] font-medium text-red-500 mt-1.5">Select at least one recipient</p>}
          </div>

          <div className="bg-card rounded-2xl border border-black/[0.06] p-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center justify-between mb-3">
              <label className="text-[13px] font-bold text-foreground">Message</label>
              <div className="flex bg-[#F4F5F7] rounded-lg p-0.5 gap-0.5">
                {LANGS.map((l) => (
                  <button key={l.key} type="button" onClick={() => setLang(l.key)}
                    className={['px-3 py-1.5 rounded-md text-[11px] font-bold transition-all relative',
                      lang === l.key ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'].join(' ')}>
                    {l.label}
                    {langHasError(l.key) && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500" />}
                  </button>
                ))}
              </div>
            </div>

            {LANGS.map((l) => (
              <div key={l.key} className={lang === l.key ? 'block' : 'hidden'}>
                <textarea
                  value={text[l.key]}
                  onChange={(e) => { setText((t) => ({ ...t, [l.key]: e.target.value })); setErrors((er) => ({ ...er, [l.key]: undefined })) }}
                  placeholder={l.placeholder}
                  rows={6}
                  className={`${inputCls(errors[l.key])} resize-none`}
                />
                {errors[l.key] && <p className="text-[11px] font-medium text-red-500 mt-1">Required</p>}
              </div>
            ))}

            {!allFilled && (
              <p className="text-[11px] font-medium text-muted-foreground mt-2">Fill in all 3 languages before sending.</p>
            )}
          </div>

          {errors.submit && <p className="text-[12px] font-semibold text-red-500">{errors.submit}</p>}

          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => navigate('/admin/notifications')}
              className="h-10 px-6 rounded-xl text-[13px] font-semibold text-muted-foreground bg-card border border-black/[0.08] hover:border-black/20 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="h-10 px-6 rounded-xl text-[13px] font-semibold bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60">
              {isEdit ? (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                  {saving ? 'Saving...' : 'Save Changes'}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                  {saving ? 'Sending...' : 'Send'}
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
