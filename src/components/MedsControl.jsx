import { useState, useMemo, Fragment } from 'react'
import ScreenHeader from './ScreenHeader.jsx'
import { getMedList, emptyMedState, saveMedReport, listMedReports } from '../data/meds.js'
import { getDeviceNurse, rememberDeviceNurse, HE_MONTHS } from '../data/handover.js'

const monthKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
const monthLabel = (mk) => {
  const [y, m] = String(mk).split('-')
  return (HE_MONTHS[Number(m) - 1] || m) + ' ' + y
}

// סטטוס הבא במחזור: תקין → חסר → לא בתוקף → תקין
function nextStatus(it) {
  if (it.status === 'ok') return { ...it, status: 'missing', order: false }
  if (it.status === 'missing') return { ...it, status: 'expired', order: false }
  return { ...it, status: 'ok', order: false }
}

const STATUS = {
  ok: { mark: '✓', label: 'תקין', cls: 'med-ok' },
  missing: { mark: '−', label: 'חסר', cls: 'med-missing' },
  expired: { mark: '✗', label: 'לא בתוקף', cls: 'med-expired' },
}

/* ===== טופס מילוי בקרת תרופות ===== */
function MedForm({ unit, onSaved }) {
  const list = useMemo(() => getMedList(unit.id), [unit.id])
  const [month, setMonth] = useState(monthKey())
  const [nurse, setNurse] = useState(() => getDeviceNurse())
  const [items, setItems] = useState(() => emptyMedState(list))
  const [err, setErr] = useState(false)

  const update = (i, patch) => setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const cycle = (i) => setItems((arr) => arr.map((it, idx) => (idx === i ? nextStatus(it) : it)))
  const replaced = (i) => update(i, { status: 'ok', order: false, expiry: '' }) // הוחלף → תקין + תוקף חדש

  function save() {
    if (!nurse.trim()) {
      setErr(true)
      return
    }
    rememberDeviceNurse(nurse)
    saveMedReport(unit.id, month, items, nurse.trim())
    onSaved()
  }

  return (
    <div className="glass plan-card ho-form">
      <div className="ho-block-title">בקרת תרופות חודשית · {unit.name}</div>

      <div className="form-row" style={{ marginTop: 14 }}>
        <div className="field">
          <label>חודש הבקרה</label>
          <input className="input" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <div className="field">
          <label>שם מבצע הבקרה <span className="req">*</span></label>
          <input
            className={'input' + (err && !nurse.trim() ? ' invalid' : '')}
            type="text"
            placeholder="שם מלא"
            value={nurse}
            onChange={(e) => { setNurse(e.target.value); setErr(false) }}
          />
        </div>
      </div>

      <div className="med-list">
        {list.map((med, i) => {
          const it = items[i]
          const st = STATUS[it.status]
          const showGroup = med.group && (i === 0 || list[i - 1].group !== med.group)
          return (
            <Fragment key={i}>
              {showGroup && <div className="med-group">{med.group}</div>}
              <div className={'med-row ' + st.cls}>
                <button type="button" className="med-status" onClick={() => cycle(i)} title="לחיצה להחלפת סטטוס">
                  <span className="med-mark">{st.mark}</span>
                  <span className="med-status-label">{st.label}</span>
                </button>
                <span className="med-name">
                  {med.name}
                  {med.sku && <span className="med-sku">מק״ט {med.sku}</span>}
                </span>
                <div className="med-expiry">
                  <label>תוקף</label>
                  <input className="input" type="date" value={it.expiry} onChange={(e) => update(i, { expiry: e.target.value })} />
                </div>
                {it.status === 'expired' && (
                  <div className="med-actions">
                    <button
                      type="button"
                      className={'med-act order' + (it.order ? ' on' : '')}
                      onClick={() => update(i, { order: !it.order })}
                    >
                      {it.order ? '✓ סומן להזמנה' : 'חסר – יש להזמין'}
                    </button>
                    <button type="button" className="med-act replace" onClick={() => replaced(i)}>הוחלף (עדכון תוקף)</button>
                  </div>
                )}
              </div>
            </Fragment>
          )
        })}
      </div>

      {err && <div className="err">יש להזין שם מבצע הבקרה לפני שמירה.</div>}

      <div className="plan-foot">
        <button className="btn" onClick={save}>שמירת בקרת תרופות</button>
      </div>
    </div>
  )
}

/* ===== תצוגת דוח שמור (קריאה בלבד) ===== */
function MedView({ unit, record }) {
  const list = getMedList(unit.id)
  return (
    <div className="glass plan-card ho-form">
      <div className="ho-block-title">בקרת תרופות · {monthLabel(record.month)}</div>
      {record.by && <div className="ho-nurse">מבצע הבקרה: <b>{record.by}</b></div>}
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
                <span className="med-name">
                  {med.name}
                  {med.sku && <span className="med-sku">מק״ט {med.sku}</span>}
                </span>
                <span className="med-view-meta">
                  {it.expiry ? 'תוקף: ' + it.expiry : ''}
                  {it.status === 'expired' && it.order ? ' · להזמנה' : ''}
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
  const [ym, setYm] = useState('') // סינון לפי חודש/שנה (YYYY-MM)

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
      <MedForm unit={unit} onSaved={() => { setRefresh((n) => n + 1); setSavedFlash(true) }} />
      <button className="ho-archive-link" onClick={() => { setSavedFlash(false); setMode('list') }}>
        דוחות בקרת תרופות שמורים ({reports.length})
      </button>
      {savedFlash && <div className="save-flash save-flash-bottom">בקרת התרופות נשמרה בהצלחה ✓</div>}
    </div>
  )
}
