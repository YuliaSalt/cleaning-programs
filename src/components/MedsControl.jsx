import { useState, useMemo, Fragment } from 'react'
import ScreenHeader from './ScreenHeader.jsx'
import { getMedList, emptyMedState, saveMedReport, listMedReports } from '../data/meds.js'
import { getDeviceNurse, rememberDeviceNurse, HE_MONTHS } from '../data/handover.js'

const monthKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
const monthLabel = (mk) => {
  const [y, m] = String(mk).split('-')
  return (HE_MONTHS[Number(m) - 1] || m) + ' ' + y
}

const STATUS = {
  ok: { mark: '✓', label: 'תקין', cls: 'med-ok' },
  missing: { mark: '−', label: 'חסר', cls: 'med-missing' },
  expired: { mark: '✗', label: 'לא בתוקף', cls: 'med-expired' },
}

// תוקף "קצר": פג או יפוג בתוך חודשיים מהיום
function expiringSoon(exp) {
  if (!exp) return false
  const d = new Date(exp)
  if (isNaN(d.getTime())) return false
  const limit = new Date()
  limit.setMonth(limit.getMonth() + 2)
  return d <= limit
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.4.7 4.6 1.9 6.5L4 29l7-1.8c1.8 1 3.8 1.5 6 1.5 6.6 0 12-5.3 12-11.9C29 8.3 22.6 3 16 3zm0 21.7c-1.9 0-3.7-.5-5.2-1.4l-.4-.2-4.1 1.1 1.1-4-.3-.4c-1-1.6-1.5-3.5-1.5-5.5C5.6 9.2 10.2 4.7 16 4.7s10.4 4.5 10.4 10.2S21.8 24.7 16 24.7z" />
      <path d="M22 18.3c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4z" />
    </svg>
  )
}

/* ===== טופס בקרת תרופות ===== */
function MedForm({ unit, onSaved }) {
  const list = useMemo(() => getMedList(unit.id), [unit.id])
  const [items, setItems] = useState(() => emptyMedState(list))
  const [nurse, setNurse] = useState(() => getDeviceNurse())
  const [err, setErr] = useState('') // '' | 'nurse' | 'expiry'

  const now = new Date()
  const dateHe = now.toLocaleDateString('he-IL')
  const timeHe = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })

  if (!list.length) {
    return (
      <div className="glass plan-card" style={{ padding: 36, textAlign: 'center' }}>
        <p className="empty-hint" style={{ fontSize: 16 }}>
          רשימת התרופות למחלקה זו טרם הוגדרה — תתווסף בהמשך.
        </p>
      </div>
    )
  }

  const update = (i, patch) => setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))

  // פריטים חסרים/לא בתוקף – לשליחה לוואטסאפ
  const shortItems = list.filter((_, i) => items[i].status === 'missing' || items[i].status === 'expired')

  // לא ניתן לחתום אם לתרופה תקינה חסר תוקף
  const missingExpiry = list.some((_, i) => items[i].status === 'ok' && !items[i].expiry)

  function sign() {
    if (!nurse.trim()) {
      setErr('nurse')
      return
    }
    if (missingExpiry) {
      setErr('expiry')
      return
    }
    rememberDeviceNurse(nurse)
    saveMedReport(unit.id, monthKey(), items, nurse.trim())
    onSaved()
  }

  function sendWhatsApp() {
    const lines = ['בקרת תרופות חודשית – ' + unit.name, `תאריך ${dateHe} שעה ${timeHe}`]
    if (nurse.trim()) lines.push('אחות: ' + nurse.trim())
    lines.push('')
    lines.push('חוסרים להזמנה:')
    if (shortItems.length === 0) lines.push('אין חוסרים')
    else shortItems.forEach((m) => lines.push(`${m.name}    מק"ט: ${m.sku}`))
    lines.push('')
    lines.push('הרצליה מדיקל סנטר')
    const url = 'https://wa.me/?text=' + encodeURIComponent(lines.join('\n').trim())
    window.open(url, '_blank', 'noopener')
  }

  return (
    <div className="glass plan-card ho-form">
      <div className="ho-subrow">
        <span className="ho-date">תאריך: {dateHe} · שעה: {timeHe}</span>
      </div>

      <div className="med-list">
        {list.map((med, i) => {
          const it = items[i]
          const showGroup = med.group && (i === 0 || list[i - 1].group !== med.group)
          const soon = expiringSoon(it.expiry)
          return (
            <Fragment key={i}>
              {showGroup && <div className="med-group">{med.group}</div>}
              <div className={'med-row ' + STATUS[it.status].cls}>
                <span className="med-name">{med.name}</span>
                <div className="med-stbtns">
                  <button type="button" className={'med-stbtn ok' + (it.status === 'ok' ? ' on' : '')} onClick={() => update(i, { status: 'ok' })}>תקין</button>
                  <button type="button" className={'med-stbtn missing' + (it.status === 'missing' ? ' on' : '')} onClick={() => update(i, { status: 'missing' })}>חסר</button>
                  <button type="button" className={'med-stbtn expired' + (it.status === 'expired' ? ' on' : '')} onClick={() => update(i, { status: 'expired' })}>לא בתוקף</button>
                </div>
                <div className="med-expiry">
                  <label>תוקף</label>
                  <input
                    className={'input' + (soon ? ' expiry-soon' : '') + (err === 'expiry' && it.status === 'ok' && !it.expiry ? ' invalid' : '')}
                    type="date"
                    value={it.expiry}
                    onChange={(e) => { update(i, { expiry: e.target.value }); if (err === 'expiry') setErr('') }}
                  />
                </div>
                {it.status === 'expired' && (
                  <div className="med-actions">
                    <button
                      type="button"
                      className={'med-act order' + (it.order ? ' on' : '')}
                      onClick={() => update(i, { order: !it.order })}
                    >
                      {it.order ? '✓ חסר – להזמין' : 'חסר – יש להזמין'}
                    </button>
                    <button
                      type="button"
                      className="med-act replace"
                      onClick={() => update(i, { status: 'ok', order: false, expiry: '' })}
                    >
                      הוחלף → תקין + תוקף חדש
                    </button>
                  </div>
                )}
              </div>
            </Fragment>
          )
        })}
      </div>

      {/* חתימת אחות – בלחיצה נחתם ונשמר */}
      <div className="med-sign">
        <div className="field" style={{ flex: 1, minWidth: 180 }}>
          <label>חתימת אחות <span className="req">*</span></label>
          <input
            className={'input' + (err === 'nurse' ? ' invalid' : '')}
            type="text"
            placeholder="שם מלא"
            value={nurse}
            onChange={(e) => { setNurse(e.target.value); if (err === 'nurse') setErr('') }}
          />
        </div>
        <button className="btn cysto-sign-btn" style={{ width: 'auto' }} onClick={sign}>חתימה ושמירה</button>
      </div>
      {err === 'nurse' && <div className="err">יש להזין שם אחות חותמת לפני שמירה.</div>}
      {err === 'expiry' && <div className="err">יש להזין תאריך תוקף לכל תרופה תקינה לפני חתימה (השדות החסרים מסומנים).</div>}

      {/* ואחר כך – שליחת חוסרים לקבוצת וואטסאפ (רק חסר/לא בתוקף, עם מק״ט) */}
      <div className="ho-actions">
        <button className="wa-btn" onClick={sendWhatsApp}>
          <WhatsAppIcon /> שליחת חוסרים לקבוצה ({shortItems.length})
        </button>
      </div>
    </div>
  )
}

/* ===== תצוגת דוח שמור (קריאה בלבד) ===== */
function MedView({ unit, record }) {
  const list = getMedList(unit.id)
  return (
    <div className="glass plan-card ho-form">
      <div className="med-meta">בקרת תרופות · {monthLabel(record.month)}</div>
      {record.by && <div className="ho-nurse">חתימת אחות: <b>{record.by}</b></div>}
      <div className="med-list">
        {list.map((med, i) => {
          const it = (record.items && record.items[i]) || { status: 'ok', expiry: '' }
          const st = STATUS[it.status] || STATUS.ok
          const showGroup = med.group && (i === 0 || list[i - 1].group !== med.group)
          return (
            <Fragment key={i}>
              {showGroup && <div className="med-group">{med.group}</div>}
              <div className={'med-row ' + st.cls}>
                <span className="med-status static"><span className="med-mark">{st.mark}</span></span>
                <span className="med-name">{med.name}</span>
                <span className={'med-view-meta' + (expiringSoon(it.expiry) ? ' expiry-soon' : '')}>
                  {it.expiry ? 'תוקף: ' + it.expiry : ''}
                </span>
              </div>
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

/* ===== מסך ראשי ===== */
export default function MedsControl({ unit, onBack, onGoHome, onBackToCategory, categoryName }) {
  const [mode, setMode] = useState('form') // form | list | view
  const [openRec, setOpenRec] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const [savedFlash, setSavedFlash] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [ym, setYm] = useState('')

  const reports = useMemo(() => listMedReports(unit.id), [unit.id, refresh])

  const trail = [{ label: 'ראשי', onClick: onGoHome }]
  if (categoryName) trail.push({ label: categoryName, onClick: onBackToCategory })
  trail.push({ label: unit.name, onClick: onBack })
  trail.push({ label: 'בקרת תרופות' })

  if (mode === 'view' && openRec) {
    return (
      <div>
        <ScreenHeader title="בקרת תרופות חודשית" onBack={() => setMode('list')} trail={[...trail, { label: openRec.dateLabel }]} />
        <MedView unit={unit} record={openRec.record} />
      </div>
    )
  }

  if (mode === 'list') {
    const filtered = reports.filter((r) => {
      if (from && r.dateISO < from) return false
      if (to && r.dateISO > to) return false
      if (ym && r.record.month !== ym) return false
      return true
    })
    return (
      <div>
        <ScreenHeader title="בקרת תרופות – דוחות שמורים" onBack={() => setMode('form')} trail={[...trail, { label: 'דוחות שמורים' }]} />
        <div className="glass plan-card controls-card">
          <div className="filters-row">
            <span className="filters-label">חיפוש לפי:</span>
            <div className="field"><label>מתאריך</label><input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div className="field"><label>עד תאריך</label><input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            <div className="field"><label>חודש / שנה</label><input className="input" type="month" value={ym} onChange={(e) => setYm(e.target.value)} /></div>
            {(from || to || ym) && <button className="btn ghost sm" onClick={() => { setFrom(''); setTo(''); setYm('') }}>ניקוי</button>}
          </div>
        </div>
        {reports.length === 0 ? (
          <p className="empty-hint" style={{ marginTop: 16 }}>אין עדיין דוחות בקרת תרופות.</p>
        ) : filtered.length === 0 ? (
          <p className="empty-hint" style={{ marginTop: 16 }}>אין דוחות התואמים לסינון.</p>
        ) : (
          <div className="report-list">
            {filtered.map((r) => (
              <button key={r.key} className="report-card" onClick={() => { setOpenRec(r); setMode('view') }}>
                <div className="rc-main">
                  <span className="rc-title">בקרת תרופות · {monthLabel(r.record.month)}</span>
                  <span className="rc-sub">{r.dateLabel} · {r.timeLabel}</span>
                </div>
                <span className="rc-by">{r.record.by || 'צפייה'}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // mode === 'form'
  return (
    <div>
      <ScreenHeader title="בקרת תרופות חודשית" onBack={onBack} trail={trail} />
      <MedForm key={refresh} unit={unit} onSaved={() => { setRefresh((n) => n + 1); setSavedFlash(true) }} />
      <button className="ho-archive-link" onClick={() => { setSavedFlash(false); setMode('list') }}>
        דוחות בקרת תרופות שמורים ({reports.length})
      </button>
      {savedFlash && <div className="save-flash save-flash-bottom">בקרת התרופות נחתמה ונשמרה ✓</div>}
    </div>
  )
}
