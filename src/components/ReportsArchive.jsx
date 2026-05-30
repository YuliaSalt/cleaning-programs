import { useMemo, useState } from 'react'
import ScreenHeader from './ScreenHeader.jsx'
import { signoffKind } from '../data/cleaningTemplates.js'
import { listReports, flattenSectionTasks, TYPE_LABELS, HE_MONTHS } from '../data/reports.js'

/* ===== תצוגת דוח בודד (קריאה בלבד) + הדפסה ===== */
function ReportDetail({ unit, report, onBack }) {
  const { section, record } = report
  const tasks = flattenSectionTasks(section)
  const signoff = (section ? section.signoff : []) || []

  return (
    <div>
      <div className="no-print" style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <button className="back-link" onClick={onBack}>
          <span className="bl-arrow">→</span> חזרה לרשימת הדוחות
        </button>
        <button className="btn" onClick={() => window.print()}>הדפסה</button>
      </div>

      <div className="report-print">
        <div className="rp-head">
          <div className="rp-brand">הרצליה מדיקל סנטר · תוכניות עבודה כוחות עזר</div>
          <h2 className="rp-title">{report.title}</h2>
          <div className="rp-meta">
            <span><b>יחידה:</b> {unit.name}</span>
            {report.room && <span><b>חדר:</b> {report.room}</span>}
            <span><b>סוג:</b> {TYPE_LABELS[report.tabId] || report.tabId}</span>
            {report.shift && <span><b>משמרת:</b> {report.shift}</span>}
            <span><b>תאריך:</b> {report.dateLabel}</span>
            <span><b>שעה:</b> {report.timeLabel}</span>
          </div>
        </div>

        {tasks.length > 0 && (
          <div className="rp-section">
            <h3>משימות שבוצעו</h3>
            <ul className="rp-tasks">
              {tasks.map((t, i) => (
                <li key={i}>
                  {t.firstInGroup && t.group && <div className="rp-group">{t.group}</div>}
                  <span className={'rp-mark' + (record.checked && record.checked[i] ? ' on' : '')}>
                    {record.checked && record.checked[i] ? '✓' : '—'}
                  </span>
                  <span className="rp-task-label">{t.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rp-section">
          <h3>חתימות ואישורים</h3>
          <ul className="rp-signs">
            {signoff.map((label, i) => {
              const kind = signoffKind(label)
              if (kind === 'name') {
                return (
                  <li key={i}>
                    <span className="rp-sign-label">{label}:</span>{' '}
                    <b>{(record.names && record.names[i]) || '—'}</b>
                  </li>
                )
              }
              return (
                <li key={i}>
                  <span className="rp-sign-label">{label}:</span>{' '}
                  <b>{record.signs && record.signs[i] ? 'נחתם ✓' : 'לא נחתם'}</b>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="rp-foot">נשמר ב-{new Date(report.savedAt).toLocaleString('he-IL')}</div>
      </div>
    </div>
  )
}

/* ===== ארכיון הדוחות של היחידה ===== */
export default function ReportsArchive({ unit, onBack, onGoHome, onBackToCategory, categoryName }) {
  const reports = useMemo(() => listReports(unit.id), [unit.id])
  const types = useMemo(() => {
    const present = new Set(reports.map((r) => r.tabId))
    return ['daily', 'weekly', 'monthly', 'isolation'].filter((t) => present.has(t))
  }, [reports])

  const [type, setType] = useState(() => types[0] || 'daily')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [performer, setPerformer] = useState('')
  const [open, setOpen] = useState(null)

  const trail = [{ label: 'ראשי', onClick: onGoHome }]
  if (categoryName) trail.push({ label: categoryName, onClick: onBackToCategory })
  trail.push({ label: unit.name, onClick: onBack })
  trail.push({ label: 'דוחות ביצוע' })

  const header = (
    <ScreenHeader
      title="דוחות ביצוע"
      onBack={onBack}
      trail={trail}
    />
  )

  if (open) {
    return (
      <div>
        <div className="no-print">{header}</div>
        <ReportDetail unit={unit} report={open} onBack={() => setOpen(null)} />
      </div>
    )
  }

  const filtered = reports.filter((r) => {
    if (r.tabId !== type) return false
    if (from && r.dateISO < from) return false
    if (to && r.dateISO > to) return false
    if (performer.trim()) {
      const q = performer.trim()
      const hay = (r.performers.join(' ') + ' ' + r.by)
      if (!hay.includes(q)) return false
    }
    return true
  })

  // קיבוץ היררכי: שנה -> חודש -> תאריך (החדש למעלה)
  const groups = []
  let curY, curM, curD
  for (const r of filtered) {
    if (r.year !== curY) {
      curY = r.year
      curM = curD = null
      groups.push({ kind: 'year', label: String(r.year) })
    }
    if (r.month !== curM) {
      curM = r.month
      curD = null
      groups.push({ kind: 'month', label: HE_MONTHS[r.month] + ' ' + r.year })
    }
    if (r.day !== curD) {
      curD = r.day
      groups.push({ kind: 'day', label: r.dateLabel })
    }
    groups.push({ kind: 'report', report: r })
  }

  return (
    <div>
      {header}

      {reports.length === 0 ? (
        <div className="glass plan-card" style={{ padding: 40, textAlign: 'center' }}>
          <p className="empty-hint" style={{ fontSize: 16 }}>אין עדיין דוחות ביצוע ביחידה זו.</p>
        </div>
      ) : (
        <>
          <div className="glass plan-card controls-card">
            <div className="tabs">
              {types.map((t) => (
                <button
                  key={t}
                  className={'tab' + (type === t ? ' active' : '')}
                  onClick={() => setType(t)}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            <div className="filters-row">
              <div className="field">
                <label>מתאריך</label>
                <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="field">
                <label>עד תאריך</label>
                <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <div className="field">
                <label>שם מבצע / חותם</label>
                <input
                  className="input"
                  type="text"
                  placeholder="חיפוש לפי שם"
                  value={performer}
                  onChange={(e) => setPerformer(e.target.value)}
                />
              </div>
              {(from || to || performer) && (
                <button
                  className="btn ghost sm"
                  onClick={() => { setFrom(''); setTo(''); setPerformer('') }}
                >
                  ניקוי סינון
                </button>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="empty-hint" style={{ marginTop: 16 }}>אין דוחות התואמים לסינון.</p>
          ) : (
            <div className="report-list">
              {groups.map((g, i) => {
                if (g.kind === 'year') return <div key={i} className="grp-year">{g.label}</div>
                if (g.kind === 'month') return <div key={i} className="grp-month">{g.label}</div>
                if (g.kind === 'day') return <div key={i} className="grp-day">{g.label}</div>
                const r = g.report
                return (
                  <button key={i} className="report-card" onClick={() => setOpen(r)}>
                    <div className="rc-main">
                      <span className="rc-title">{r.title}</span>
                      <span className="rc-sub">
                        {r.timeLabel}
                        {r.shift && <> · משמרת {r.shift}</>}
                        {r.room && <> · {r.room}</>}
                      </span>
                    </div>
                    <span className="rc-by">{r.performers[0] || r.by || '—'}</span>
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
