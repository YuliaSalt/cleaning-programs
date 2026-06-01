import { useMemo, useState } from 'react'
import ScreenHeader from './ScreenHeader.jsx'
import { getCurrentShift } from '../data/departments.js'
import {
  GEN_OCC_NAMES,
  GEN_OCC_NUMBERS,
  GEN_REPORT_ITEMS,
  GEN_CHECK_ITEMS,
  emptyGeneralHandover,
  saveHandover,
  listHandovers,
  fullName,
  getDeviceNurse,
  rememberDeviceNurse,
} from '../data/handover.js'
import { buildGeneralHandoverImage, shareHandoverImage } from './handoverImage.js'
import HandoverArchive from './HandoverArchive.jsx'

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.4.7 4.6 1.9 6.5L4 29l7-1.8c1.8 1 3.8 1.5 6 1.5 6.6 0 12-5.3 12-11.9C29 8.3 22.6 3 16 3zm0 21.7c-1.9 0-3.7-.5-5.2-1.4l-.4-.2-4.1 1.1 1.1-4-.3-.4c-1-1.6-1.5-3.5-1.5-5.5C5.6 9.2 10.2 4.7 16 4.7s10.4 4.5 10.4 10.2S21.8 24.7 16 24.7z" />
      <path d="M22 18.3c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4z" />
    </svg>
  )
}

const todayStr = () => new Date().toLocaleDateString('en-CA')

/* ===== טופס מילוי כללי ===== */
function GeneralForm({ unit, onSent, onReset }) {
  const shifts = unit.shifts || ['בוקר', 'ערב']
  // בחירת משמרת היא שלב חובה; הזמן רק ממליץ
  const suggested = shifts.includes(getCurrentShift()) ? getCurrentShift() : shifts[shifts.length - 1]
  const blank = emptyGeneralHandover(unit.id, unit.name, suggested)

  const [shift, setShift] = useState(suggested) // נבחרת אוטומטית לפי השעה; ניתן לשנות
  // שם מלא בשדה אחד (ב-first); אחות מוסרת מולאת מראש מהמכשיר
  const [names, setNames] = useState({ nurseOut: { first: getDeviceNurse(), last: '' }, nurseIn: { first: '', last: '' } })
  const [numbers, setNumbers] = useState(blank.numbers)
  const [occNote, setOccNote] = useState('')
  const [reports, setReports] = useState(blank.reports)
  const [checks, setChecks] = useState(blank.checks)
  const [err, setErr] = useState(false)
  const [busy, setBusy] = useState(false)

  const dateHe = new Date().toLocaleDateString('he-IL')
  const outName = fullName(names.nurseOut)

  const setName = (id, field, v) => setNames((n) => ({ ...n, [id]: { ...n[id], [field]: v } }))
  const setNum = (id, v) => setNumbers((o) => ({ ...o, [id]: v }))
  const setHas = (id, has) => setReports((r) => ({ ...r, [id]: { ...r[id], has, text: has ? r[id].text : '' } }))
  const setText = (id, v) => setReports((r) => ({ ...r, [id]: { ...r[id], text: v } }))
  const setChk = (i, field, v) => setChecks((c) => ({ ...c, [i]: { ...c[i], [field]: v } }))

  function reset() {
    const e = emptyGeneralHandover(unit.id, unit.name, shift)
    setNames({ nurseOut: { first: getDeviceNurse(), last: '' }, nurseIn: { first: '', last: '' } })
    setNumbers(e.numbers)
    setOccNote('')
    setReports(e.reports)
    setChecks(e.checks)
    setErr(false)
    if (onReset) onReset()
  }

  function send() {
    if (!names.nurseOut.first.trim()) {
      setErr(true)
      return
    }
    setErr(false)
    rememberDeviceNurse(names.nurseOut.first) // שמירת שם האחות המוסרת קבוע במכשיר
    const record = {
      kind: 'general',
      unitId: unit.id,
      unitName: unit.name,
      date: todayStr(),
      shift,
      savedAt: new Date().toISOString(),
      nurseOut: names.nurseOut,
      nurseIn: names.nurseIn,
      numbers,
      occNote,
      reports,
      checks,
      nurse: outName,
    }
    // 1) שמירה לארכיון (תמיד, לפני כל דבר אחר)
    saveHandover(record)
    // 2) יצירת תמונה ושיתוף לוואטסאפ – ברקע, לא חוסם את השמירה/הניווט
    try {
      const canvas = buildGeneralHandoverImage(record)
      shareHandoverImage(canvas).catch(() => {})
    } catch (e) {
      /* הרישום כבר נשמר */
    }
    // 3) חזרה לרשימה + אישור שמירה
    onSent()
  }

  return (
    <div className="glass plan-card ho-form">
      <div className="ho-title">העברת משמרת - {unit.name}</div>

      <div className="ho-subrow">
        <span className="ho-date">מחלקה: {unit.name} · תאריך: {dateHe}</span>
      </div>

      {/* בחירת משמרת – שלב חובה ובולט לפני מילוי הטופס */}
      <div className="ho-shift-pick">
        <div className="ho-shift-title">משמרת</div>
        <div className="ho-shift-sub">נבחרה אוטומטית לפי השעה — ניתן לשנות</div>
        <div className="ho-shift-btns">
          {shifts.map((s) => (
            <button
              key={s}
              className={'ho-shift-btn' + (shift === s ? ' active' : '') + (s === suggested ? ' suggested' : '')}
              onClick={() => setShift(s)}
            >
              <span className="ho-shift-name">{s}</span>
              {s === suggested && <span className="ho-shift-tag">מומלץ לפי השעה</span>}
            </button>
          ))}
        </div>
      </div>

      {!shift && <div className="ho-shift-locked">בחר/י משמרת למעלה כדי למלא את הטופס</div>}

      {shift && (
        <>
      {/* בלוק 1 – נתוני תפוסה וצוות */}
      <div className="ho-block">
        <div className="ho-block-title">נתוני תפוסה וצוות</div>

        {GEN_OCC_NAMES.map((it) => (
          <div className="field" key={it.id}>
            <label>{it.label} {it.required && <span className="req">*</span>}</label>
            <input
              className={'input' + (err && it.required && !names[it.id].first.trim() ? ' invalid' : '')}
              type="text"
              placeholder="שם מלא"
              value={names[it.id].first}
              onChange={(e) => setName(it.id, 'first', e.target.value)}
            />
            {it.id === 'nurseOut' && <span className="ho-auto-hint">נשמר במכשיר ויופיע מראש בפעם הבאה</span>}
          </div>
        ))}

        <div className="occ-numbers">
          {GEN_OCC_NUMBERS.map((it) => (
            <div className="field" key={it.id}>
              <label>{it.label}</label>
              <input
                className="input"
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="0"
                value={numbers[it.id]}
                onChange={(e) => setNum(it.id, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="field" style={{ marginTop: 14 }}>
          <label>הערות</label>
          <textarea
            className="input"
            rows={2}
            placeholder="הערות כלליות לבלוק התפוסה והצוות..."
            value={occNote}
            onChange={(e) => setOccNote(e.target.value)}
          />
        </div>
      </div>

      {/* בלוק 2 – דיווח ובקרה קליני וניהולי */}
      <div className="ho-block">
        <div className="ho-block-title">דיווח ובקרה קליני וניהולי</div>
        {GEN_REPORT_ITEMS.map((it) => (
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

      {/* בלוק 3 – משימות ובטיחות המחלקה */}
      <div className="ho-block">
        <div className="ho-block-title">משימות ובטיחות המחלקה</div>
        {GEN_CHECK_ITEMS.map((label, i) => (
          <div className="ho-2col check-2col" key={i}>
            <button className={'ho-check' + (checks[i].on ? ' on' : '')} onClick={() => setChk(i, 'on', !checks[i].on)}>
              <span className="ho-circle">{checks[i].on ? '✓' : ''}</span>
              <span className="ho-check-label">{label}</span>
            </button>
            <div className="field">
              <label>הערות</label>
              <input
                className="input"
                type="text"
                placeholder="הערות"
                value={checks[i].note}
                onChange={(e) => setChk(i, 'note', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* בלוק 4 – אישור וחתימה (אחות מוסרת – אותו שם מבלוק 1) */}
      <div className="ho-block">
        <div className="ho-block-title">אישור וחתימה</div>
        <div className={'sign-confirm' + (outName ? ' filled' : '')}>
          <span className="sc-label">חתימת אחות מוסרת:</span>
          <span className="sc-name">{outName || 'יש למלא שם אחות מוסרת בבלוק "נתוני תפוסה וצוות"'}</span>
        </div>
        {err && <div className="err">חובה למלא את שם האחות המוסרת לפני שמירה ושליחה.</div>}
      </div>

      <div className="ho-actions">
        <button className="wa-btn" onClick={send} disabled={busy}>
          <WhatsAppIcon /> {busy ? 'מכין תמונה...' : 'שלח לקבוצה'}
        </button>
        <button className="reset-btn" onClick={reset}>איפוס רשימה</button>
      </div>
        </>
      )}

      <div className="ho-footer">הרצליה מדיקל סנטר</div>
    </div>
  )
}

/* ===== תצוגת רישום שמור ===== */
function GeneralView({ unit, record }) {
  async function reshare() {
    if (document.fonts && document.fonts.ready) await document.fonts.ready
    await shareHandoverImage(buildGeneralHandoverImage(record))
  }
  const time = record.savedAt ? new Date(record.savedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : ''
  return (
    <div className="glass plan-card ho-form">
      <div className="ho-title">העברת משמרת - {unit.name}</div>
      <div className="ho-subrow">
        <span className="ho-date">מחלקה: {unit.name} · תאריך: {record.date}{time ? ' · שעה: ' + time : ''} · משמרת {record.shift}</span>
      </div>
      {record.nurse && <div className="ho-nurse">אחות מוסרת: <b>{record.nurse}</b></div>}

      <div className="ho-block">
        <div className="ho-block-title">נתוני תפוסה וצוות</div>
        {GEN_OCC_NAMES.map((it) => (
          <div className="ho-view-row" key={it.id}>
            <span className="vr-label">{it.label}</span>
            <span className="vr-status yes">{fullName(record[it.id]) || '—'}</span>
          </div>
        ))}
        {GEN_OCC_NUMBERS.map((it) => (
          <div className="ho-view-row" key={it.id}>
            <span className="vr-label">{it.label}</span>
            <span className="vr-status yes">{(record.numbers && record.numbers[it.id]) || '—'}</span>
          </div>
        ))}
        {record.occNote && (
          <div className="ho-view-row"><span className="vr-label">הערות</span><p className="vr-text">{record.occNote}</p></div>
        )}
      </div>

      <div className="ho-block">
        <div className="ho-block-title">דיווח ובקרה קליני וניהולי</div>
        {GEN_REPORT_ITEMS.map((it) => {
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

      <div className="ho-block">
        <div className="ho-block-title">משימות ובטיחות המחלקה</div>
        {GEN_CHECK_ITEMS.map((label, i) => {
          const c = record.checks[i] || {}
          return (
            <div className="ho-view-row" key={i}>
              <span className="vr-label">{label}</span>
              <span className={'vr-status' + (c.on ? ' yes' : '')}>{c.on ? '✓ בוצע' : '— לא סומן'}</span>
              {c.note && <p className="vr-text">הערה: {c.note}</p>}
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

/* ===== מסך ראשי ===== */
export default function GeneralHandover({ unit, onBack, onGoHome, onBackToCategory, categoryName }) {
  const [mode, setMode] = useState('list')
  const [openRec, setOpenRec] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const [savedFlash, setSavedFlash] = useState(false)
  const records = useMemo(() => listHandovers(unit.id), [unit.id, refresh])

  const baseTrail = [{ label: 'ראשי', onClick: onGoHome }]
  if (categoryName) baseTrail.push({ label: categoryName, onClick: onBackToCategory })
  baseTrail.push({ label: unit.name, onClick: onBack })

  const goList = () => { setMode('list'); setOpenRec(null) }
  const title = 'העברת משמרת - ' + unit.name

  if (mode === 'form') {
    return (
      <div>
        <ScreenHeader title={title} onBack={goList} trail={[...baseTrail, { label: 'העברת משמרת', onClick: goList }, { label: 'רישום חדש' }]} />
        <GeneralForm unit={unit} onSent={() => { setRefresh((n) => n + 1); setSavedFlash(true); goList() }} />
      </div>
    )
  }

  if (mode === 'view' && openRec) {
    return (
      <div>
        <ScreenHeader title={title} onBack={goList} trail={[...baseTrail, { label: 'העברת משמרת', onClick: goList }, { label: openRec.dateLabel }]} />
        <GeneralView unit={unit} record={openRec.record} />
      </div>
    )
  }

  return (
    <div>
      <ScreenHeader title={title} onBack={onBack} trail={[...baseTrail, { label: 'העברת משמרת' }]} />
      <HandoverArchive
        records={records}
        savedFlash={savedFlash}
        onNew={() => { setSavedFlash(false); setMode('form') }}
        onOpen={(r) => { setSavedFlash(false); setOpenRec(r); setMode('view') }}
      />
    </div>
  )
}
