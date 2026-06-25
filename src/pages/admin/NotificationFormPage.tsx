import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

// ─── Shared mock data (mirrors NotificationsPage) ─────────────────────────────

export const MOCK_USERS = [
  { id: 1,  name: 'Akmal Karimov',    avatar: 'AK', phone: '+998 90 123 45 67' },
  { id: 2,  name: 'Eldor Nazarov',    avatar: 'EN', phone: '+998 91 234 56 78' },
  { id: 3,  name: 'Nodir Qodirov',    avatar: 'NQ', phone: '+998 93 345 67 89' },
  { id: 4,  name: 'Firdavs Rakhimov', avatar: 'FR', phone: '+998 94 456 78 90' },
  { id: 5,  name: 'Komil Hasanov',    avatar: 'KH', phone: '+998 95 567 89 01' },
  { id: 6,  name: 'Rustam Xoliqov',   avatar: 'RX', phone: '+998 97 678 90 12' },
  { id: 7,  name: 'Sanjar Mirzayev',  avatar: 'SM', phone: '+998 99 789 01 23' },
  { id: 8,  name: 'Zulfiya Komilov',  avatar: 'ZK', phone: '+998 90 890 12 34' },
  { id: 9,  name: 'Kamola Nazarova',  avatar: 'KN', phone: '+998 91 901 23 45' },
  { id: 10, name: 'Murod Xasanov',    avatar: 'MX', phone: '+998 93 012 34 56' },
]

export interface NotifData {
  id: number
  title: string
  recipients: string[]
  sentAt: string
  text: { uz: string; ru: string; en: string }
}

// ─── In-memory store (shared between list and form pages) ─────────────────────

export const notifStore: NotifData[] = [
  {
    id: 1,
    title: 'New bonus campaign',
    recipients: ['Akmal Karimov', 'Eldor Nazarov', 'Nodir Qodirov'],
    sentAt: 'Jun 24, 2026  14:30',
    text: {
      uz: 'Yangi bonus kampaniyasi boshlandi! Har bir mahsulotni skanerlash uchun 2x bonus oling.',
      ru: 'Запущена новая бонусная кампания! Получайте 2x бонусы за каждое сканирование товара.',
      en: 'New bonus campaign launched! Get 2x bonuses for every product scan.',
    },
  },
  {
    id: 2,
    title: 'System maintenance',
    recipients: ['All users'],
    sentAt: 'Jun 22, 2026  09:00',
    text: {
      uz: 'Tizim texnik ishlar uchun Jun 23 soat 02:00 – 04:00 oralig\'ida to\'xtatiladi.',
      ru: 'Система будет остановлена для технического обслуживания 23 июня с 02:00 до 04:00.',
      en: 'The system will be down for maintenance on Jun 23 from 02:00 – 04:00.',
    },
  },
  {
    id: 3,
    title: 'Withdrawal approved',
    recipients: ['Firdavs Rakhimov'],
    sentAt: 'Jun 20, 2026  11:15',
    text: {
      uz: 'Sizning 95 000 UZS miqdoridagi pul yechish so\'rovingiz tasdiqlandi.',
      ru: 'Ваша заявка на вывод 95 000 UZS одобрена.',
      en: 'Your withdrawal request of 95 000 UZS has been approved.',
    },
  },
  {
    id: 4,
    title: 'New products available',
    recipients: ['Komil Hasanov', 'Rustam Xoliqov', 'Sanjar Mirzayev', 'Zulfiya Komilov'],
    sentAt: 'Jun 18, 2026  16:45',
    text: {
      uz: 'Katalogda yangi mahsulotlar paydo bo\'ldi. Ularni skanerlash orqali bonus yig\'ing.',
      ru: 'В каталоге появились новые товары. Сканируйте их, чтобы накапливать бонусы.',
      en: 'New products have been added to the catalog. Scan them to earn bonuses.',
    },
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const avatarColors = ['bg-blue-500','bg-violet-500','bg-emerald-500','bg-amber-500','bg-pink-500','bg-cyan-500','bg-rose-500','bg-teal-500']
const aColor = (s: string) => avatarColors[(s.charCodeAt(0) + (s.charCodeAt(1) || 0)) % avatarColors.length]

const LANGS: { key: 'uz' | 'ru' | 'en'; label: string; placeholder: string }[] = [
  { key: 'uz', label: 'UZ', placeholder: 'O\'zbek tilidagi xabar…'   },
  { key: 'ru', label: 'RU', placeholder: 'Сообщение на русском…'     },
  { key: 'en', label: 'EN', placeholder: 'Message in English…'       },
]

const inputBase = 'w-full bg-[#F4F5F7] text-foreground rounded-xl px-4 py-3 text-[13px] font-medium border transition-all focus:outline-none focus:ring-2'
const inputCls  = (err?: boolean) =>
  `${inputBase} ${err ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-transparent focus:border-primary focus:ring-primary/20'}`

// ─── User selector ────────────────────────────────────────────────────────────

function UserSelector({ selected, onChange }: { selected: number[]; onChange: (ids: number[]) => void }) {
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  const filtered  = MOCK_USERS.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.phone.includes(search))
  const toggle    = (id: number) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
  const toggleAll = () => onChange(selected.length === MOCK_USERS.length ? [] : MOCK_USERS.map((u) => u.id))

  const label = selected.length === 0
    ? 'Select recipients'
    : selected.length === MOCK_USERS.length
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
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…"
                className="bg-transparent text-[12px] font-medium text-foreground placeholder:text-muted-foreground flex-1 focus:outline-none" />
            </div>
          </div>
          <button type="button" onClick={toggleAll}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] font-semibold text-foreground hover:bg-[#F4F5F7] transition-colors border-b border-black/[0.04]">
            <Checkbox checked={selected.length === MOCK_USERS.length} indeterminate={selected.length > 0 && selected.length < MOCK_USERS.length} />
            All users
          </button>
          <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
            {filtered.length === 0
              ? <p className="text-[12px] text-muted-foreground text-center py-4">No users found</p>
              : filtered.map((u) => {
                  const checked = selected.includes(u.id)
                  return (
                    <button key={u.id} type="button" onClick={() => toggle(u.id)}
                      className={['w-full flex items-center gap-3 px-4 py-3 transition-colors text-left',
                        checked ? 'bg-primary/[0.06]' : 'hover:bg-[#F4F5F7]'].join(' ')}>
                      <Checkbox checked={checked} />
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${aColor(u.avatar)}`}>{u.avatar}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate">{u.name}</p>
                        <p className="text-[11px] font-medium text-muted-foreground font-mono">{u.phone}</p>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationFormPage() {
  const navigate  = useNavigate()
  const { id }    = useParams<{ id: string }>()
  const isEdit    = id !== undefined
  const existing  = isEdit ? notifStore.find((n) => n.id === Number(id)) : undefined

  const initRecipients = existing
    ? existing.recipients[0] === 'All users'
      ? MOCK_USERS.map((u) => u.id)
      : MOCK_USERS.filter((u) => existing.recipients.includes(u.name)).map((u) => u.id)
    : []

  const [recipients, setRecipients] = useState<number[]>(initRecipients)
  const [text, setText] = useState({ uz: existing?.text.uz ?? '', ru: existing?.text.ru ?? '', en: existing?.text.en ?? '' })
  const [lang,   setLang]   = useState<'uz' | 'ru' | 'en'>('uz')
  const [errors, setErrors] = useState<{ recipients?: boolean; uz?: boolean; ru?: boolean; en?: boolean }>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (recipients.length === 0)  errs.recipients = true
    if (!text.uz.trim()) errs.uz = true
    if (!text.ru.trim()) errs.ru = true
    if (!text.en.trim()) errs.en = true
    if (Object.keys(errs).length) { setErrors(errs); return }

    const recipientNames = recipients.length === MOCK_USERS.length
      ? ['All users']
      : recipients.map((rid) => MOCK_USERS.find((u) => u.id === rid)!.name)
    const title = text.en.slice(0, 40) + (text.en.length > 40 ? '…' : '')

    if (isEdit && existing) {
      const idx = notifStore.findIndex((n) => n.id === existing.id)
      if (idx >= 0) notifStore[idx] = { ...notifStore[idx], title, recipients: recipientNames, text }
    } else {
      const now  = new Date()
      const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      notifStore.unshift({ id: Date.now(), title, recipients: recipientNames, sentAt: `${date}  ${time}`, text })
    }

    navigate('/admin/notifications')
  }

  const langHasError = (k: 'uz' | 'ru' | 'en') => !!errors[k]
  const allFilled    = LANGS.every((l) => text[l.key].trim())

  return (
    <div className="p-6 max-w-2xl">
      {/* Header */}
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Recipients */}
        <div className="bg-card rounded-2xl border border-black/[0.06] p-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <label className="block text-[13px] font-bold text-foreground mb-3">Recipients</label>
          <UserSelector selected={recipients} onChange={(ids) => { setRecipients(ids); setErrors((e) => ({ ...e, recipients: undefined })) }} />
          {errors.recipients && <p className="text-[11px] font-medium text-red-500 mt-1.5">Select at least one recipient</p>}
        </div>

        {/* Message */}
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

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate('/admin/notifications')}
            className="h-10 px-6 rounded-xl text-[13px] font-semibold text-muted-foreground bg-card border border-black/[0.08] hover:border-black/20 transition-colors">
            Cancel
          </button>
          <button type="submit"
            className="h-10 px-6 rounded-xl text-[13px] font-semibold bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-2">
            {isEdit ? (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                Save Changes
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                Send
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
