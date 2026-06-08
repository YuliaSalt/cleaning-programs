import { useMemo, useState } from 'react'
import DatePicker from './DatePicker.jsx'
import { listClosures, saveClosure, deleteClosure, unitClosureOn } from '../data/closures.js'
import { getDeviceNurse } from '../data/handover.js'

// פאנל סימון סגירת יחידה (מחלקה / מכון / חדר ניתוח) לטווח תאריכים.
export default function ClosurePanel({ unit }) {
  const [refresh, setRefresh] = useState(0)
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [reason, setReason] = useState('')
  const [by, setBy] = useState(getDeviceNurse())
  const [err, setErr] = useState(false)

  const closures = useMemo(() => listClosures(unit.id), [unit.id, refresh])
  const active = useMemo(() => unitClosureOn(unit.id), [unit.id, refresh])

  function reset() {
    setFrom(''); setTo(''); setReason(''); setBy(getDeviceNurse()); setErr(false); setOpen(false)
  }

  function save() {
    // חובה: טווח תאריכים תקין + סיבה + שם מדווח
    if (!from || !to || to < from || !reason.trim() || !by.trim()) { setErr(true); return }
    saveClosure({ unitId: unit.id, unitName: unit.name, from, to, reason, by })
    reset()
    setRefresh((n) => n + 1)
  }

  function remove(key) {
    deleteClosure(key)
    setRefresh((n) => n + 1)
  }

  const fmt = (iso) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('he-IL') : '')

  return (
    <div className="glass plan-card closure-panel">
      {active ? (
        <div className="closure-banner">
          <span className="cb-icon" aria-hidden="true">🔒</span>
          <div className="cb-body">
            <b>היחידה מסומנת כסגורה</b>
            <span className="cb-range">{fmt(active.from)} – {fmt(active.to)}</span>
            {active.reason && <span className="cb-reason">סיבה: {active.reason}</span>}
            {active.by && <span className="cb-by">דווח ע״י {active.by}</span>}
          </div>
        </div>
      ) : (
        <div className="closure-head">
          <div>
            <b>סטטוס פעילות היחידה</b>
            <p className="sec-note" style={{ margin: '2px 0 0' }}>סימון סגירה משתיק התראות "טרם נחתם" בימים הסגורים ומתועד בדוחות.</p>
          </div>
        </div>
      )}

      {!open ? (
        <button className="btn ghost sm" style={{ marginTop: 10 }} onClick={() => setOpen(true)}>סימון סגירת יחידה</button>
      ) : (
        <div className="closure-form" style={{ marginTop: 12 }}>
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
      )}

      {closures.length > 0 && (
        <div className="closure-list" style={{ marginTop: 14 }}>
          <div className="group-sub">סגירות מתועדות</div>
          {closures.map((c) => (
            <div className="closure-row" key={c.key}>
              <span className="cr-range">{fmt(c.record.from)} – {fmt(c.record.to)}</span>
              {c.record.reason && <span className="cr-reason">{c.record.reason}</span>}
              <button className="btn ghost sm cr-del" onClick={() => remove(c.key)}>מחיקה</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
