import { useMemo, useState } from 'react'
import ScreenHeader from './ScreenHeader.jsx'
import { getGastroShift } from '../data/departments.js'
import {
  GASTRO_REPORT_ITEMS,
  GASTRO_CHECK_BLOCKS,
  emptyHandover,
  saveHandover,
  listHandovers,
  getDeviceNurse,
  rememberDeviceNurse,
} from '../data/handover.js'
import { buildHandoverImage, shareHandoverImage } from './handoverImage.js'
import HandoverArchive from './HandoverArchive.jsx'
import { shiftAlertLevel } from '../data/shiftAlert.js'
import { isUnitClosed } from '../data/closures.js'

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.4.7 4.6 1.9 6.5L4 29l7-1.8c1.8 1 3.8 1.5 6 1.5 6.6 0 12-5.3 12-11.9C29 8.3 22.6 3 16 3zm0 21.7c-1.9 0-3.7-.5-5.2-1.4l-.4-.2-4.1 1.1 1.1-4-.3-.4c-1-1.6-1.5-3.5-1.5-5.5C5.6 9.2 10.2 4.7 16 4.7s10.4 4.5 10.4 10.2S21.8 24.7 16 24.7z" />
      <path d="M22 18.3c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4z" />
    </svg>
  )
}

const SHIFTS = ['בוקר', 'ערב']
const todayStr = () => new Date().toLocaleDateString('en-CA')

/* ===== טופס מילוי ===== */
function HandoverForm({ unit, onSent, onReset }) {
  const now = new Date()
  // בחירת משמרת היא שלב חובה; הזמן רק ממליץ (06:30–15:00 בוקר, 15:00–23:00 ערב)
  const suggested = getGastroShift()
  const [shift, setShift] = useState(suggested) // נבחרת אוטומטית לפי השעה; ניתן לשנות
  const [reports, setReports] = useState(() => emptyHandover(unit.id, unit.name, shift).reports)
  const [checks, setChecks] = useState(() => emptyHandover(unit.id, unit.name, shift).checks)
  const [nurse, setNurse] = useState(() => getDeviceNurse()) // שם מלא בשדה אחד; נשמר במכשיר
  const [err, setErr] = useState(false)
  const [checksErr, setChecksErr] = useState(false) // נדלק כשמנסים לחתום לפני שכל העיגולים סומנו
  const [signedRec, setSignedRec] = useState(null) // נחתם ונשמר – רק אז שולחים לוואטסאפ

  const dateHe = now.toLocaleDateString('he-IL')
  // משמרות שכבר מולא להן טופס היום – לצביעת כפתורי המשמרת לפי שעה
  const doneShifts = useMemo(() => {
    const today = todayStr()
    return new Set(listHandovers(unit.id).filter((r) => r.record.date === today).map((r) => r.record.shift))
  }, [unit.id])
  const closed = isUnitClosed(unit.id) // יחידה סגורה היום – משתיק התראות משמרת
  const timeHe = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })

  const setHas = (id, has) =>
    setReports((r) => ({ ...r, [id]: { has, text: has ? r[id].text : '' } }))
  const setText = (id, text) => setReports((r) => ({ ...r, [id]: { ...r[id], text } }))
  const toggle = (blk, i) => {
    setChecks((c) => ({ ...c, [blk]: { ...c[blk], [i]: !c[blk][i] } }))
    setChecksErr(false)
  }

  function reset() {
    const e = emptyHandover(unit.id, unit.name, shift)
    setReports(e.reports)
    setChecks(e.checks)
    setNurse(getDeviceNurse()) // שומר על שם האחות המוסרת השמור במכשיר
    setErr(false)
    setChecksErr(false)
    setSignedRec(null)
    if (onReset) onReset()
  }

  // כל סעיפי הצ׳קליסטים (כל הבלוקים) חייבים להיות מסומנים (✓) לפני חתימה ושמירה
  const allChecked = GASTRO_CHECK_BLOCKS.every((b) => b.items.every((_, i) => checks[b.id] && checks[b.id][i]))

  function sign() {
    const nameOk = nurse.trim()
    if (!nameOk || !allChecked) {
      setErr(!nameOk)
      setChecksErr(!allChecked)
      return
    }
    setErr(false)
    setChecksErr(false)
    rememberDeviceNurse(nurse)
    const record = {
      unitId: unit.id,
      unitName: unit.name,
      date: todayStr(),
      shift,
      savedAt: new Date().toISOString(),
      nurse: nurse.trim(),
      reports,
      checks,
    }
    saveHandover(record)
    setSignedRec(record)
    onSent()
  }
  function shareWa() {
    if (signedRec) { try { shareHandoverImage(buildHandoverImage(signedRec)).catch(() => {}) } catch (e) { /* noop */ } }
  }

  return (
    <div className="glass plan-card ho-form">
      {/* בחירת משמרת – שלב חובה ובולט לפני מילוי הטופס */}
      <div className="ho-shift-pick">
        <div className="ho-shift-title">משמרת</div>
        <div className="ho-shift-sub">נבחרה אוטומטית לפי השעה — ניתן לשנות</div>
        <div className="ho-shift-btns">
          {SHIFTS.map((s) => {
            const lvl = closed ? null : shiftAlertLevel(s, doneShifts.has(s))
            return (
              <button
                key={s}
                className={'ho-shift-btn' + (shift === s ? ' active' : '') + (s === suggested ? ' suggested' : '') + (lvl ? ' shift-' + lvl : '')}
                onClick={() => setShift(s)}
              >
                <span className="ho-shift-name">{s}</span>
                <span className={'ho-shift-status ' + (doneShifts.has(s) ? 'done' : 'todo')}>
                  {doneShifts.has(s) ? '✓ בוצעה' : 'טרם בוצעה'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {!shift && <div className="ho-shift-locked">בחר/י משמרת למעלה כדי למלא את הטופס</div>}

      {shift && (
        <>
      {/* בלוק 1 – דיווח ובקרה */}
      <div className="ho-block">
        <div className="ho-block-title">דיווח ובקרה</div>
        {GASTRO_REPORT_ITEMS.map((it) => (
          <div className="yn-row" key={it.id}>
            <div className="yn-head">
              <span className="yn-label">{it.label}</span>
              <div className="yn-btns">
                <button className={'yn-btn yes' + (reports[it.id].has ? ' active' : '')} onClick={() => setHas(it.id, true)}>יש</button>
                <button className={'yn-btn no' + (!reports[it.id].has ? ' active' : '')} onClick={() => setHas(it.id, false)}>אין</button>
              </div>
            </div>
            <div className={'yn-detail' + (reports[it.id].has ? ' open' : '')}>
              <textarea
                className="input"
                rows={3}
                placeholder={it.placeholder}
                value={reports[it.id].text}
                onChange={(e) => setText(it.id, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* בלוקים 2-4 – צ׳קליסטים */}
      {GASTRO_CHECK_BLOCKS.map((blk) => (
        <div className="ho-block" key={blk.id}>
          <div className="ho-block-title">{blk.title}</div>
          {blk.items.map((label, i) => {
            const on = !!checks[blk.id][i]
            return (
              <button key={i} className={'ho-check' + (on ? ' on' : '') + (checksErr && !on ? ' missing' : '')} onClick={() => toggle(blk.id, i)}>
                <span className="ho-circle">{on ? '✓' : ''}</span>
                <span className="ho-check-label">{label}</span>
              </button>
            )
          })}
        </div>
      ))}

      {checksErr && <div className="err">יש לסמן (✓) את כל הסעיפים בכל הבלוקים לפני חתימה ושמירה.</div>}

      {/* חתימת אחות מוסרת – חובה (שם מלא בשדה אחד, נשמר במכשיר) */}
      <div className="ho-block">
        <div className="ho-block-title">חתימת אחות מוסרת</div>
        <div className="field">
          <label>שם האחות המוסרת <span className="req">*</span></label>
          <input
            className={'input' + (err && !nurse.trim() ? ' invalid' : '')}
            type="text"
            placeholder="שם מלא"
            value={nurse}
            onChange={(e) => setNurse(e.target.value)}
          />
          <span className="ho-auto-hint">נשמר במכשיר ויופיע מראש בפעם הבאה</span>
        </div>
        {err && <div className="err">חובה למלא את שם האחות המוסרת לפני שמירה ושליחה.</div>}
        <div className="ho-consent">חתימה על טופס זה מהווה אישור רשמי לביצוע.</div>
      </div>

      <div className="ho-actions">
        {!signedRec ? (
          <button className="btn cysto-sign-btn" style={{ width: 'auto' }} onClick={sign}>חתימה ושמירה</button>
        ) : (
          <>
            <span className="ho-signed-ok">✓ נחתם ונשמר</span>
            <button className="wa-btn" onClick={shareWa}><WhatsAppIcon /> שליחה לוואטסאפ</button>
            <button className="reset-btn" onClick={reset}>דו״ח חדש</button>
          </>
        )}
      </div>
        </>
      )}

      <div className="ho-footer">הרצליה מדיקל סנטר</div>
    </div>
  )
}

/* ===== תצוגת רישום שמור (קריאה בלבד) ===== */
function HandoverView({ record }) {
  async function reshare() {
    if (document.fonts && document.fonts.ready) await document.fonts.ready
    const canvas = buildHandoverImage(record)
    await shareHandoverImage(canvas)
  }
  return (
    <div className="glass plan-card ho-form">
      <div className="ho-subrow">
        <span className="ho-date">
          תאריך: {record.date}
          {record.savedAt && <> · שעה: {new Date(record.savedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</>}
          {' '}· משמרת {record.shift}
        </span>
      </div>
      {record.nurse && <div className="ho-nurse">אחות מוסרת: <b>{record.nurse}</b></div>}

      <div className="ho-block">
        <div className="ho-block-title">דיווח ובקרה</div>
        {GASTRO_REPORT_ITEMS.map((it) => {
          const r = record.reports[it.id] || {}
          return (
            <div className="ho-view-row" key={it.id}>
              <span className="vr-label">{it.label}</span>
              <span className={'vr-status' + (r.has ? ' yes' : '')}>{r.has ? 'יש' : 'אין'}</span>
              {r.has && r.text && <p className="vr-text">{r.text}</p>}
            </div>
          )
        })}
      </div>

      {GASTRO_CHECK_BLOCKS.map((blk) => (
        <div className="ho-block" key={blk.id}>
          <div className="ho-block-title">{blk.title}</div>
          {blk.items.map((label, i) => {
            const on = record.checks[blk.id] && record.checks[blk.id][i]
            return (
              <div className="ho-view-row" key={i}>
                <span className="vr-label">{label}</span>
                <span className={'vr-status' + (on ? ' yes' : '')}>{on ? '✓ בוצע' : '— לא סומן'}</span>
              </div>
            )
          })}
        </div>
      ))}

      <div className="ho-actions">
        <button className="wa-btn" onClick={reshare}><WhatsAppIcon /> שלח שוב לקבוצה</button>
      </div>
      <div className="ho-footer">הרצליה מדיקל סנטר</div>
    </div>
  )
}

/* ===== מסך ראשי של קוביית דו״ח אחראית משמרת ===== */
export default function GastroHandover({ unit, onBack, onGoHome, onBackToCategory, categoryName }) {
  const [mode, setMode] = useState('form') // ברירת מחדל: ישר לטופס, ללא מסך ביניים
  const [openRec, setOpenRec] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const [savedFlash, setSavedFlash] = useState(false)
  const records = useMemo(() => listHandovers(unit.id), [unit.id, refresh])

  const baseTrail = [{ label: 'ראשי', onClick: onGoHome }]
  if (categoryName) baseTrail.push({ label: categoryName, onClick: onBackToCategory })
  baseTrail.push({ label: unit.name, onClick: onBack })

  const goForm = () => { setMode('form'); setOpenRec(null) }

  if (mode === 'list') {
    return (
      <div>
        <ScreenHeader
          title="דו״ח אחראית משמרת גסטרו"
          onBack={goForm}
          trail={[...baseTrail, { label: 'דו״ח אחראית משמרת', onClick: goForm }, { label: 'דו״חות שמורים' }]}
        />
        <HandoverArchive
          records={records}
          savedFlash={false}
          onNew={goForm}
          onOpen={(r) => { setOpenRec(r); setMode('view') }}
        />
      </div>
    )
  }

  if (mode === 'view' && openRec) {
    return (
      <div>
        <ScreenHeader
          title="דו״ח אחראית משמרת גסטרו"
          onBack={() => setMode('list')}
          trail={[...baseTrail, { label: 'דו״ח אחראית משמרת', onClick: goForm }, { label: openRec.dateLabel }]}
        />
        <HandoverView record={openRec.record} />
      </div>
    )
  }

  // ברירת מחדל: טופס דו״ח אחראית משמרת ישירות
  return (
    <div>
      <ScreenHeader
        title="דו״ח אחראית משמרת גסטרו"
        onBack={onBack}
        trail={[...baseTrail, { label: 'דו״ח אחראית משמרת' }]}
      />
      <HandoverForm unit={unit} onSent={() => { setRefresh((n) => n + 1); setSavedFlash(true) }} />
      {records.length > 0 && (
        <button className="ho-archive-link" onClick={() => { setSavedFlash(false); setMode('list') }}>
          צפייה בדו״חות שמורים ({records.length})
        </button>
      )}
      {savedFlash && <div className="save-flash save-flash-bottom">העברת המשמרת נשמרה ונשלחה ✓</div>}
    </div>
  )
}
