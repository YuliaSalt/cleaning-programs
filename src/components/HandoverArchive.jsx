import { useState } from 'react'
import { HE_MONTHS } from '../data/handover.js'

// רשימת רישומי העברת משמרת: כפתור "חדש" למעלה, חיפוש, ואז ארכיון לפי שנה>חודש>תאריך.
export default function HandoverArchive({ records, onNew, onOpen, savedFlash }) {
  const [q, setQ] = useState('')
  const query = q.trim()

  const filtered = query
    ? records.filter((r) => {
        const hay = [r.dateLabel, r.timeLabel, r.record.shift, r.record.nurse || '', HE_MONTHS[r.month], String(r.year)].join(' ')
        return hay.includes(query)
      })
    : records

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
        <div className="ho-search">
          <input
            className="input"
            type="text"
            placeholder="חיפוש לפי תאריך, חודש, שנה, שם או משמרת"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
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
