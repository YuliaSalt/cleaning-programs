import { useState, useMemo } from 'react'
import ScreenHeader from './ScreenHeader.jsx'
import { getCurrentShift } from '../data/departments.js'
import {
  OR_SECTIONS,
  emptyORHandover,
  saveHandover,
  listHandovers,
  getDeviceNurse,
  rememberDeviceNurse,
} from '../data/handover.js'
import { buildORHandoverImage, shareHandoverImage } from './handoverImage.js'
import HandoverArchive from './HandoverArchive.jsx'
import { shiftAlertLevel } from '../data/shiftAlert.js'

const todayStr = () => new Date().toLocaleDateString('en-CA')

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.4.7 4.6 1.9 6.5L4 29l7-1.8c1.8 1 3.8 1.5 6 1.5 6.6 0 12-5.3 12-11.9C29 8.3 22.6 3 16 3zm0 21.7c-1.9 0-3.7-.5-5.2-1.4l-.4-.2-4.1 1.1 1.1-4-.3-.4c-1-1.6-1.5-3.5-1.5-5.5C5.6 9.2 10.2 4.7 16 4.7s10.4 4.5 10.4 10.2S21.8 24.7 16 24.7z" />
      <path d="M22 18.3c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4z" />
    </svg>
  )
}

// בורר שעה מבוסס מספרים (שעה + דקה) – ללא שעון אנלוגי
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))
function TimeSelect({ value, onChange }) {
  const [h, m] = value && value.includes(':') ? value.split(':') : ['', '']
  const set = (nh, nm) => onChange(nh === '' && nm === '' ? '' : `${nh || '00'}:${nm || '00'}`)
  return (
    <div className="time-sel">
      <select className="input" value={h} onChange={(e) => set(e.target.value, m)}>
        <option value="">שעה</option>
        {HOURS.map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
      <span className="ts-colon">:</span>
      <select className="input" value={m} onChange={(e) => set(h, e.target.value)}>
        <option value="">דקה</option>
        {MINS.map((x) => <option key={x} value={x}>{x}</option>)}
      </select>
    </div>
  )
}

function Field({ field, value, onChange }) {
  return (
    <div className="field">
      <label>{field.label}</label>
      {field.type === 'textarea' ? (
        <textarea className="input or-textarea" rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : field.type === 'time' ? (
        <TimeSelect value={value} onChange={onChange} />
      ) : (
        <input className="input" type="text" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  )
}

/* ===== טופס דו״ח אחראית משמרת – חדרי ניתוח ===== */
function ORForm({ unit, onSent }) {
  const shifts = unit.shifts || ['בוקר', 'ערב']
  const suggested = shifts.includes(getCurrentShift()) ? getCurrentShift() : shifts[shifts.length - 1]
  const [shift, setShift] = useState(suggested)
  const [sections, setSections] = useState(() => emptyORHandover(unit.id, unit.name, suggested).sections)
  const [nurseOut, setNurseOut] = useState(() => getDeviceNurse()) // אחות מוסרת – נשמרת במכשיר
  const [nurseIn, setNurseIn] = useState('') // אחות מקבלת
  const [err, setErr] = useState(false)
  const [signedRec, setSignedRec] = useState(null) // נחתם ונשמר – רק אז ניתן לשלוח לוואטסאפ

  const now = new Date()
  const dateHe = now.toLocaleDateString('he-IL')
  const timeHe = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })

  const doneShifts = useMemo(() => {
    const t = todayStr()
    return new Set(listHandovers(unit.id).filter((r) => r.record.date === t).map((r) => r.record.shift))
  }, [unit.id])

  const setFlag = (id, flag) => setSections((s) => ({ ...s, [id]: { ...s[id], flag } }))
  const setField = (id, fid, v) => setSections((s) => ({ ...s, [id]: { ...s[id], fields: { ...s[id].fields, [fid]: v } } }))
  const setRow = (id, idx, fid, v) => setSections((s) => ({ ...s, [id]: { ...s[id], rows: s[id].rows.map((r, i) => (i === idx ? { ...r, [fid]: v } : r)) } }))
  const addRow = (sec) => setSections((s) => ({ ...s, [sec.id]: { ...s[sec.id], rows: [...s[sec.id].rows, Object.fromEntries(sec.fields.map((f) => [f.id, '']))] } }))
  const removeRow = (id, idx) => setSections((s) => {
    const rows = s[id].rows.filter((_, i) => i !== idx)
    return { ...s, [id]: { ...s[id], rows: rows.length ? rows : s[id].rows } }
  })

  function sign() {
    if (!nurseOut.trim()) { setErr(true); return }
    rememberDeviceNurse(nurseOut)
    const record = { kind: 'or', unitId: unit.id, unitName: unit.name, date: todayStr(), shift, savedAt: new Date().toISOString(), nurse: nurseOut.trim(), nurseIn: nurseIn.trim(), sections }
    saveHandover(record)
    setSignedRec(record)
    onSent()
  }
  function shareWa() {
    if (signedRec) { try { shareHandoverImage(buildORHandoverImage(signedRec)).catch(() => {}) } catch (e) { /* noop */ } }
  }
  function reset() { setSections(emptyORHandover(unit.id, unit.name, shift).sections); setNurseIn(''); setSignedRec(null); setErr(false) }

  return (
    <div className="glass plan-card ho-form">
      <div className="ho-shift-pick">
        <div className="ho-shift-title">משמרת</div>
        <div className="ho-shift-sub">נבחרה אוטומטית לפי השעה — ניתן לשנות</div>
        <div className="ho-shift-btns">
          {shifts.map((s) => {
            const lvl = shiftAlertLevel(s, doneShifts.has(s))
            return (
              <button
                key={s}
                className={'ho-shift-btn' + (shift === s ? ' active' : '') + (s === suggested ? ' suggested' : '') + (lvl ? ' shift-' + lvl : '')}
                onClick={() => setShift(s)}
              >
                <span className="ho-shift-name">{s}</span>
              </button>
            )
          })}
        </div>
      </div>

      {OR_SECTIONS.map((s, idx) => {
        if (s.part) return <div className="ho-block-title" key={'p' + idx}>{s.part}</div>
        const st = sections[s.id]
        return (
          <div className={'or-row' + (st.flag ? ' open' : '')} key={s.id}>
            <div className="or-head">
              <span className="or-label">{s.label}</span>
              <div className="or-toggle">
                <button type="button" className={'or-tg good' + (!st.flag ? ' on' : '')} onClick={() => setFlag(s.id, false)}>{s.good}</button>
                <button type="button" className={'or-tg bad' + (st.flag ? ' on' : '')} onClick={() => setFlag(s.id, true)}>{s.bad}</button>
              </div>
            </div>
            {st.flag && (
              <div className="or-detail">
                {s.multi ? (
                  <>
                    {st.rows.map((row, ri) => (
                      <div className="or-rowfields" key={ri}>
                        {s.fields.map((f) => (
                          <Field key={f.id} field={f} value={row[f.id]} onChange={(v) => setRow(s.id, ri, f.id, v)} />
                        ))}
                        {st.rows.length > 1 && (
                          <button type="button" className="or-rm" onClick={() => removeRow(s.id, ri)}>הסר</button>
                        )}
                      </div>
                    ))}
                    <button type="button" className="btn ghost sm" onClick={() => addRow(s)}>+ הוסף שורה</button>
                  </>
                ) : (
                  s.fields.map((f) => (
                    <Field key={f.id} field={f} value={st.fields[f.id]} onChange={(v) => setField(s.id, f.id, v)} />
                  ))
                )}
              </div>
            )}
          </div>
        )
      })}

      <div className="ho-block" style={{ marginTop: 22 }}>
        <div className="ho-block-title">חתימת אחיות</div>
        <div className="field">
          <label>אחות מוסרת <span className="req">*</span></label>
          <input
            className={'input' + (err && !nurseOut.trim() ? ' invalid' : '')}
            type="text"
            placeholder="שם מלא"
            value={nurseOut}
            onChange={(e) => { setNurseOut(e.target.value); setErr(false) }}
          />
          <span className="ho-auto-hint">נשמר במכשיר ויופיע מראש בפעם הבאה</span>
        </div>
        <div className="field">
          <label>אחות מקבלת</label>
          <input
            className="input"
            type="text"
            placeholder="שם מלא"
            value={nurseIn}
            onChange={(e) => setNurseIn(e.target.value)}
          />
        </div>
        {err && <div className="err">חובה לרשום שם אחות מוסרת לפני שמירה ושליחה.</div>}
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
      <div className="ho-footer">הרצליה מדיקל סנטר</div>
    </div>
  )
}

/* ===== תצוגת רישום שמור ===== */
function ORView({ record }) {
  async function reshare() {
    if (document.fonts && document.fonts.ready) await document.fonts.ready
    await shareHandoverImage(buildORHandoverImage(record))
  }
  const time = record.savedAt ? new Date(record.savedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : ''
  return (
    <div className="glass plan-card ho-form">
      <div className="ho-subrow">
        <span className="ho-date">תאריך: {record.date}{time ? ' · שעה: ' + time : ''} · משמרת {record.shift}</span>
      </div>
      {(record.nurse || record.nurseIn) && (
        <div className="ho-nurse">
          {record.nurse && <>אחות מוסרת: <b>{record.nurse}</b></>}
          {record.nurseIn && <> · אחות מקבלת: <b>{record.nurseIn}</b></>}
        </div>
      )}
      {OR_SECTIONS.map((s, idx) => {
        if (s.part) return <div className="ho-block-title" key={'p' + idx}>{s.part}</div>
        const st = (record.sections || {})[s.id] || { flag: false }
        return (
          <div className="ho-view-row" key={s.id}>
            <span className="vr-label">{s.label}</span>
            <span className={'vr-status' + (st.flag ? ' bad' : ' yes')}>{st.flag ? s.bad : s.good}</span>
            {st.flag && (
              <div className="vr-text" style={{ flexBasis: '100%' }}>
                {s.multi
                  ? (st.rows || []).map((row, ri) => {
                      const parts = s.fields.map((f) => (row[f.id] ? f.label + ': ' + row[f.id] : '')).filter(Boolean)
                      return parts.length ? <div key={ri}>{ri + 1}. {parts.join(' · ')}</div> : null
                    })
                  : s.fields.map((f) => {
                      const v = (st.fields || {})[f.id]
                      return v && v.trim() ? <div key={f.id}>{f.label}: {v}</div> : null
                    })}
              </div>
            )}
          </div>
        )
      })}
      <div className="ho-actions">
        <button className="wa-btn" onClick={reshare}><WhatsAppIcon /> שלח שוב לקבוצה</button>
      </div>
      <div className="ho-footer">הרצליה מדיקל סנטר</div>
    </div>
  )
}

/* ===== מסך ראשי ===== */
export default function ORHandover({ unit, onBack, onGoHome, onBackToCategory, categoryName }) {
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
        <HandoverArchive records={records} savedFlash={false} onNew={goForm} onOpen={(r) => { setOpenRec(r); setMode('view') }} />
      </div>
    )
  }

  if (mode === 'view' && openRec) {
    return (
      <div>
        <ScreenHeader title={title} onBack={() => setMode('list')} trail={[...baseTrail, { label: 'דו״ח אחראית משמרת', onClick: goForm }, { label: openRec.dateLabel }]} />
        <ORView record={openRec.record} />
      </div>
    )
  }

  return (
    <div>
      <ScreenHeader title={title} onBack={onBack} trail={[...baseTrail, { label: 'דו״ח אחראית משמרת' }]} />
      <ORForm unit={unit} onSent={() => { setRefresh((n) => n + 1); setSavedFlash(true) }} />
      {records.length > 0 && (
        <button className="ho-archive-link" onClick={() => { setSavedFlash(false); setMode('list') }}>
          צפייה בדו״חות שמורים ({records.length})
        </button>
      )}
      {savedFlash && <div className="save-flash save-flash-bottom">העברת המשמרת נשמרה ונשלחה ✓</div>}
    </div>
  )
}
