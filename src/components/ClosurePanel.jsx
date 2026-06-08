import { useState } from 'react'
import DatePicker from './DatePicker.jsx'
import { saveClosure, unitClosureOn } from '../data/closures.js'
import { getDeviceNurse } from '../data/handover.js'

// פאנל קומפקטי לסימון סגירת יחידה (מחלקה / מכון / חדר ניתוח) לטווח תאריכים.
// כשהיחידה סגורה – מוצגת הודעה בלבד. התיעוד נשמר בארכיון "דוחות ביצוע".
export default function ClosurePanel({ unit }) {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [reason, setReason] = useState('')
  const [by, setBy] = useState(getDeviceNurse())
  const [err, setErr] = useState(false)

  // נקרא בכל רנדר; לאחר שמירה reset() מעדכן state ומרענן את הסטטוס מיד
  const active = unitClosureOn(unit.id)

  function reset() {
    setFrom(''); setTo(''); setReason(''); setBy(getDeviceNurse()); setErr(false); setOpen(false)
  }

  function save() {
    // חובה: טווח תאריכים תקין + סיבה + שם מדווח
    if (!from || !to || to < from || !reason.trim() || !by.trim()) { setErr(true); return }
    saveClosure({ unitId: unit.id, unitName: unit.name, from, to, reason, by })
    reset()
  }

  const fmt = (iso) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('he-IL') : '')

  // יחידה סגורה – הודעה בלבד (ללא מחיקה/עריכה; התיעוד בארכיון הדוחות)
  if (active) {
    return (
      <div className="closure-banner compact">
        <span className="cb-icon" aria-hidden="true">🔒</span>
        <div className="cb-body">
          <b>היחידה סגורה{active.kind ? ' · ' + active.kind : ''}</b>
          {!active.auto && <span className="cb-range">{fmt(active.from)} – {fmt(active.to)}</span>}
        </div>
      </div>
    )
  }

  // קומפקטי: כברירת מחדל רק כפתור קטן; בלחיצה נפתח טופס הסימון
  if (!open) {
    return (
      <button className="btn ghost sm closure-mark-btn" onClick={() => setOpen(true)}>
        סימון סגירת יחידה
      </button>
    )
  }

  return (
    <div className="glass plan-card closure-panel">
      <div className="closure-form">
        <div className="occ-numbers">
          <div className="field">
            <label>מתאריך <span className="req">*</span></label>
            <DatePicker value={from} onChange={setFrom} placeholder="מתאריך" />
          </div>
          <div className="field">
            <label>עד תאריך <span className="req">*</span></label>
            <DatePicker value={to} onChange={setTo} placeholder="עד תאריך" />
          </div>
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>סיבת הסגירה <span className="req">*</span></label>
          <input className={'input' + (err && !reason.trim() ? ' invalid' : '')} type="text" placeholder="לדוגמה: שיפוץ / חוסר בתקן / ניקיון יסודי" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>שם המדווח <span className="req">*</span></label>
          <input className={'input' + (err && !by.trim() ? ' invalid' : '')} type="text" placeholder="שם מלא" value={by} onChange={(e) => setBy(e.target.value)} />
        </div>
        {err && <div className="err">יש למלא טווח תאריכים תקין, סיבה ושם מדווח.</div>}
        <div className="ho-actions" style={{ marginTop: 12 }}>
          <button className="btn" onClick={save}>שמירת סגירה</button>
          <button className="btn ghost" onClick={reset}>ביטול</button>
        </div>
      </div>
    </div>
  )
}
