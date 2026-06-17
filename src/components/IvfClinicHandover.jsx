import { useMemo, useState } from 'react'
import ScreenHeader from './ScreenHeader.jsx'
import { getCurrentShift } from '../data/departments.js'
import {
  IVF_CLINIC_ITEMS,
  emptyIvfClinicHandover,
  saveHandover,
  listHandovers,
  fullName,
  getDeviceNurse,
  rememberDeviceNurse,
} from '../data/handover.js'
import { buildIvfClinicHandoverImage, shareHandoverImage } from './handoverImage.js'
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

const todayStr = () => new Date().toLocaleDateString('en-CA')

// סעיף הושלם לצורך חתימה: סעיפי חובה (בוצע/לא-בוצע, כן/לא) מחייבים בחירה;
// טקסט חובה מחייב תוכן. סעיף שאינו חובה תמיד נחשב מושלם.
function itemComplete(it, v) {
  v = v || {}
  if (!it.required) return true
  if (it.type === 'text') return (v.text || '').trim() !== ''
  return v.val !== null && v.val !== undefined
}

/* ===== טופס מילוי מרפאה IVF ===== */
function IvfClinicForm({ unit, onSent, onReset }) {
  const shifts = unit.shifts || ['בוקר']
  const suggested = shifts.includes(getCurrentShift()) ? getCurrentShift() : shifts[shifts.length - 1]
  const blank = emptyIvfClinicHandover(unit.id, unit.name, suggested)

  const [shift, setShift] = useState(suggested)
  // שם מלא בשדה אחד (ב-first); אחות מוסרת מולאת מראש מהמכשיר
  const [names, setNames] = useState({ nurseOut: { first: getDeviceNurse(), last: '' }, nurseIn: { first: '', last: '' } })
  const [items, setItems] = useState(blank.items)
  const [err, setErr] = useState(false) // שמות חסרים
  const [itemsErr, setItemsErr] = useState(false) // סעיפי חובה שלא נבחרו
  const [signedRec, setSignedRec] = useState(null)

  const closed = isUnitClosed(unit.id)
  const outName = fullName(names.nurseOut)
  const doneShifts = useMemo(() => {
    const today = todayStr()
    return new Set(listHandovers(unit.id).filter((r) => r.record.date === today).map((r) => r.record.shift))
  }, [unit.id])

  const setName = (id, field, v) => setNames((n) => ({ ...n, [id]: { ...n[id], [field]: v } }))
  const setVal = (id, val) => {
    setItems((m) => ({ ...m, [id]: { ...m[id], val } }))
    setItemsErr(false)
  }
  const setNote = (id, note) => setItems((m) => ({ ...m, [id]: { ...m[id], note } }))
  const setText = (id, text) => setItems((m) => ({ ...m, [id]: { ...m[id], text } }))

  function reset() {
    const e = emptyIvfClinicHandover(unit.id, unit.name, shift)
    setNames({ nurseOut: { first: getDeviceNurse(), last: '' }, nurseIn: { first: '', last: '' } })
    setItems(e.items)
    setErr(false)
    setItemsErr(false)
    setSignedRec(null)
    if (onReset) onReset()
  }

  // כל סעיפי החובה הושלמו לפני חתימה ושמירה
  const allComplete = IVF_CLINIC_ITEMS.every((it) => itemComplete(it, items[it.id]))

  function sign() {
    const namesOk = names.nurseOut.first.trim() && names.nurseIn.first.trim()
    if (!namesOk || !allComplete) {
      setErr(!namesOk)
      setItemsErr(!allComplete)
      return
    }
    setErr(false)
    setItemsErr(false)
    rememberDeviceNurse(names.nurseOut.first)
    const record = {
      kind: 'ivf-clinic',
      unitId: unit.id,
      unitName: unit.name,
      date: todayStr(),
      shift,
      savedAt: new Date().toISOString(),
      nurseOut: names.nurseOut,
      nurseIn: names.nurseIn,
      items,
      nurse: outName,
    }
    saveHandover(record)
    setSignedRec(record)
    onSent()
  }
  function shareWa() {
    if (signedRec) { try { shareHandoverImage(buildIvfClinicHandoverImage(signedRec)).catch(() => {}) } catch (e) { /* noop */ } }
  }

  const nameFields = [
    { id: 'nurseOut', label: 'שם האחות המוסרת משמרת', hint: true },
    { id: 'nurseIn', label: 'שם האחות המקבלת משמרת' },
  ]

  return (
    <div className="glass plan-card ho-form">
      {/* בחירת משמרת – זהה לשאר דו״חות אחראית המשמרת */}
      <div className="ho-shift-pick">
        <div className="ho-shift-title">משמרת</div>
        <div className="ho-shift-sub">נבחרה אוטומטית לפי השעה — ניתן לשנות</div>
        <div className="ho-shift-btns">
          {shifts.map((s) => {
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
          {/* בלוק 1 – פרטי מוסרת/מקבלת */}
          <div className="ho-block">
            <div className="ho-block-title">פרטי המשמרת</div>
            {nameFields.map((it) => (
              <div className="field" key={it.id}>
                <label>{it.label} <span className="req">*</span></label>
                <input
                  className={'input' + (err && !names[it.id].first.trim() ? ' invalid' : '')}
                  type="text"
                  placeholder="שם מלא"
                  value={names[it.id].first}
                  onChange={(e) => setName(it.id, 'first', e.target.value)}
                />
                {it.hint && <span className="ho-auto-hint">נשמר במכשיר ויופיע מראש בפעם הבאה</span>}
              </div>
            ))}
            {err && <div className="err">חובה למלא את שם האחות המוסרת והמקבלת.</div>}
          </div>

          {/* בלוק 2 – משימות ומסירת מרפאה */}
          <div className="ho-block">
            <div className="ho-block-title">משימות ומסירת מרפאה</div>
            {IVF_CLINIC_ITEMS.map((it) => {
              const v = items[it.id] || {}
              const missing = itemsErr && !itemComplete(it, v)

              if (it.type === 'text') {
                return (
                  <div className="field" key={it.id} style={{ marginTop: 14 }}>
                    <label>{it.label} {it.required && <span className="req">*</span>}</label>
                    <textarea
                      className={'input' + (missing ? ' invalid' : '')}
                      rows={3}
                      placeholder={it.placeholder}
                      value={v.text || ''}
                      onChange={(e) => setText(it.id, e.target.value)}
                    />
                  </div>
                )
              }

              const isYesNo = it.type === 'yesno'
              const onLabel = isYesNo ? 'כן' : 'בוצע'
              const offLabel = isYesNo ? 'לא' : 'לא בוצע'
              const onVal = isYesNo ? 'yes' : 'done'
              const offVal = isYesNo ? 'no' : 'notDone'
              return (
                <div className={'yn-row' + (missing ? ' invalid' : '')} key={it.id}>
                  <div className="yn-head">
                    <span className="yn-label">{it.label} {it.required && <span className="req">*</span>}</span>
                    <div className="yn-btns">
                      <button className={'yn-btn yes' + (v.val === onVal ? ' active' : '')} onClick={() => setVal(it.id, onVal)}>{onLabel}</button>
                      <button className={'yn-btn no' + (v.val === offVal ? ' active' : '')} onClick={() => setVal(it.id, offVal)}>{offLabel}</button>
                    </div>
                  </div>
                  {/* אירועים חריגים: פירוט נפתח כשנבחר "כן". סעיפי בוצע/לא-בוצע: הערות לא חובה. */}
                  {isYesNo ? (
                    <div className={'yn-detail' + (v.val === 'yes' ? ' open' : '')}>
                      <textarea
                        className="input"
                        rows={3}
                        placeholder="פירוט האירוע החריג..."
                        value={v.note || ''}
                        onChange={(e) => setNote(it.id, e.target.value)}
                      />
                    </div>
                  ) : it.notes ? (
                    <div className="field" style={{ marginTop: 8 }}>
                      <label>הערות</label>
                      <input
                        className="input"
                        type="text"
                        placeholder="הערות (לא חובה)"
                        value={v.note || ''}
                        onChange={(e) => setNote(it.id, e.target.value)}
                      />
                    </div>
                  ) : null}
                </div>
              )
            })}
            {itemsErr && <div className="err">יש להשלים את כל סעיפי החובה לפני חתימה ושמירה.</div>}
          </div>

          {/* בלוק 3 – אישור וחתימה */}
          <div className="ho-block">
            <div className="ho-block-title">אישור וחתימה</div>
            <div className={'sign-confirm' + (outName ? ' filled' : '')}>
              <span className="sc-label">חתימת אחות מוסרת:</span>
              <span className="sc-name">{outName || 'יש למלא שם אחות מוסרת בבלוק "פרטי המשמרת"'}</span>
            </div>
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

/* ===== תצוגת רישום שמור ===== */
function IvfClinicView({ unit, record }) {
  async function reshare() {
    if (document.fonts && document.fonts.ready) await document.fonts.ready
    await shareHandoverImage(buildIvfClinicHandoverImage(record))
  }
  const time = record.savedAt ? new Date(record.savedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : ''
  const statusText = (it, v) => {
    v = v || {}
    if (it.type === 'text') return v.text || '—'
    if (it.type === 'yesno') return v.val === 'yes' ? 'כן' : v.val === 'no' ? 'לא' : '—'
    return v.val === 'done' ? '✓ בוצע' : v.val === 'notDone' ? '✗ לא בוצע' : '—'
  }
  const isPositive = (it, v) => {
    v = v || {}
    if (it.type === 'text') return !!(v.text || '').trim()
    if (it.type === 'yesno') return v.val === 'yes'
    return v.val === 'done'
  }
  return (
    <div className="glass plan-card ho-form">
      <div className="ho-subrow">
        <span className="ho-date">מחלקה: {unit.name} · תאריך: {record.date}{time ? ' · שעה: ' + time : ''} · משמרת {record.shift}</span>
      </div>
      {record.nurse && <div className="ho-nurse">אחות מוסרת: <b>{record.nurse}</b></div>}

      <div className="ho-block">
        <div className="ho-block-title">פרטי המשמרת</div>
        <div className="ho-view-row">
          <span className="vr-label">שם האחות המוסרת משמרת</span>
          <span className="vr-status yes">{fullName(record.nurseOut) || '—'}</span>
        </div>
        <div className="ho-view-row">
          <span className="vr-label">שם האחות המקבלת משמרת</span>
          <span className="vr-status yes">{fullName(record.nurseIn) || '—'}</span>
        </div>
      </div>

      <div className="ho-block">
        <div className="ho-block-title">משימות ומסירת מרפאה</div>
        {IVF_CLINIC_ITEMS.map((it) => {
          const v = (record.items && record.items[it.id]) || {}
          // מלל חופשי מוצג כפסקה עוטפת שורות (vr-text) ולא בתוך שורת הסטטוס, כדי לא לחרוג מהמסגרת
          if (it.type === 'text') {
            return (
              <div className="ho-view-row" key={it.id}>
                <span className="vr-label">{it.label}</span>
                <p className="vr-text">{(v.text || '').trim() || '—'}</p>
              </div>
            )
          }
          const showNote = v.note && v.note.trim()
          return (
            <div className="ho-view-row" key={it.id}>
              <span className="vr-label">{it.label}</span>
              <span className={'vr-status' + (isPositive(it, v) ? ' yes' : '')}>{statusText(it, v)}</span>
              {showNote && <p className="vr-text">{(it.type === 'yesno' ? 'פירוט: ' : 'הערה: ') + v.note}</p>}
            </div>
          )
        })}
      </div>

      <div className="ho-actions">
        <button className="wa-btn" onClick={reshare}><WhatsAppIcon /> שלח שוב לקבוצה</button>
      </div>
      <div className="ho-footer">הרצליה מדיקל סנטר</div>
    </div>
  )
}

/* ===== מסך ראשי – טופס / ארכיון / תצוגה ===== */
export default function IvfClinicHandover({ unit, onBack, onGoHome, onBackToCategory, categoryName }) {
  const [mode, setMode] = useState('form')
  const [openRec, setOpenRec] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const [savedFlash, setSavedFlash] = useState(false)
  const records = useMemo(() => listHandovers(unit.id), [unit.id, refresh])

  const baseTrail = [{ label: 'ראשי', onClick: onGoHome }]
  if (categoryName) baseTrail.push({ label: categoryName, onClick: onBackToCategory })
  baseTrail.push({ label: unit.name, onClick: onBack })

  const goForm = () => { setMode('form'); setOpenRec(null) }
  const title = 'דו״ח אחראית משמרת - ' + unit.name

  if (mode === 'list') {
    return (
      <div>
        <ScreenHeader title={title} onBack={goForm} trail={[...baseTrail, { label: 'דו״ח אחראית משמרת', onClick: goForm }, { label: 'דו״חות שמורים' }]} />
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
        <ScreenHeader title={title} onBack={() => setMode('list')} trail={[...baseTrail, { label: 'דו״ח אחראית משמרת', onClick: goForm }, { label: openRec.dateLabel }]} />
        <IvfClinicView unit={unit} record={openRec.record} />
      </div>
    )
  }

  return (
    <div>
      <ScreenHeader title={title} onBack={onBack} trail={[...baseTrail, { label: 'דו״ח אחראית משמרת' }]} />
      <IvfClinicForm unit={unit} onSent={() => { setRefresh((n) => n + 1); setSavedFlash(true) }} />
      {records.length > 0 && (
        <button className="ho-archive-link" onClick={() => { setSavedFlash(false); setMode('list') }}>
          צפייה בדו״חות שמורים ({records.length})
        </button>
      )}
      {savedFlash && <div className="save-flash save-flash-bottom">העברת המשמרת נשמרה ונשלחה ✓</div>}
    </div>
  )
}
