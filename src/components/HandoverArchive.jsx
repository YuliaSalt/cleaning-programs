import { useState } from 'react'
import { HE_MONTHS } from '../data/handover.js'
import DatePicker from './DatePicker.jsx'

// רשימת רישומי העברת משמרת: כפתור "חדש" למעלה, חיפוש (תאריכים/שם/משמרת), וארכיון לפי שנה>חודש>תאריך.
export default function HandoverArchive({ records, onNew, onOpen, savedFlash }) {
  const [q, setQ] = useState('')
  const [folder, setFolder] = useState('all') // תיקייה לפי משמרת
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const query = q.trim()

  // תיקיות לפי משמרת (בוקר/ערב/לילה) – רק אלו שקיימות בפועל
  const folders = [...new Set(records.map((r) => r.record.shift).filter(Boolean))]

  const filtered = records.filter((r) => {
    if (folder !== 'all' && r.record.shift !== folder) return false
    const date = r.record.date || ''
    if (from && date < from) return false
    if (to && date > to) return false
    if (query) {
      const hay = [r.dateLabel, r.timeLabel, r.record.shift, r.record.nurse || '', HE_MONTHS[r.month], String(r.year)].join(' ')
      if (!hay.includes(query)) return false
    }
    return true
  })

  const groups = []
  let y, mo, d
  for (const r of filtered) {
    if (r.year !== y) { y = r.year; mo = d = null; groups.push({ k: 'year', label: String(r.year) }) }
    if (r.month !== mo) { mo = r.month; d = null; groups.push({ k: 'month', label: HE_MONTHS[r.month] + ' ' + r.year }) }
    if (r.day !== d) { d = r.day; groups.push({ k: 'day', label: r.dateLabel }) }
    groups.push({ k: 'rec', r })
  }

  return (
    <div>
      {savedFlash && (
        <div className="save-flash">✓ הרישום נשמר בארכיון בהצלחה</div>
      )}

      <button className="btn wide-btn" onClick={onNew}>+ העברת משמרת חדשה</button>

      {records.length > 0 && (
        <div className="glass plan-card controls-card">
          {folders.length > 1 && (
            <div className="folder-row">
              <span className="folder-label">תיקיות:</span>
              <div className="chips">
                <button className={'chip' + (folder === 'all' ? ' active' : '')} onClick={() => setFolder('all')}>הכל</button>
                {folders.map((f) => (
                  <button key={f} className={'chip' + (folder === f ? ' active' : '')} onClick={() => setFolder(f)}>{f}</button>
                ))}
              </div>
            </div>
          )}
          <div className="filters-row">
            <span className="filters-label">חיפוש לפי:</span>
            <div className="field"><label>מתאריך</label><DatePicker value={from} onChange={setFrom} placeholder="מתאריך" /></div>
            <div className="field"><label>עד תאריך</label><DatePicker value={to} onChange={setTo} placeholder="עד תאריך" /></div>
            <div className="field">
              <label>שם</label>
              <input className="input" type="text" placeholder="שם אחות" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {(from || to || query) && (
              <button className="btn ghost sm" onClick={() => { setFrom(''); setTo(''); setQ('') }}>ניקוי</button>
            )}
          </div>
        </div>
      )}

      {records.length === 0 ? (
        <div className="glass plan-card" style={{ padding: 36, textAlign: 'center' }}>
          <p className="empty-hint" style={{ fontSize: 16 }}>אין עדיין רישומי העברת משמרת ביחידה זו.</p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="empty-hint" style={{ marginTop: 6 }}>לא נמצאו רישומים תואמים לחיפוש.</p>
      ) : (
        <div className="report-list">
          {groups.map((g, i) => {
            if (g.k === 'year') return <div key={i} className="grp-year">{g.label}</div>
            if (g.k === 'month') return <div key={i} className="grp-month">{g.label}</div>
            if (g.k === 'day') return <div key={i} className="grp-day">{g.label}</div>
            const r = g.r
            return (
              <button key={i} className="report-card" onClick={() => onOpen(r)}>
                <div className="rc-main">
                  <span className="rc-title">העברת משמרת · {r.record.shift}</span>
                  <span className="rc-sub">{r.timeLabel}{r.record.nurse ? ' · ' + r.record.nurse : ''}</span>
                </div>
                <span className="rc-by">צפייה</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
