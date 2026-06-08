import { useMemo, useState } from 'react'
import ScreenHeader from './ScreenHeader.jsx'
import { signoffKind, specialTaskText, taskResolved } from '../data/cleaningTemplates.js'
import { listReports, flattenSectionTasks, TYPE_LABELS, HE_MONTHS } from '../data/reports.js'
import { getCleaningPlan } from '../data/cleaningTemplates.js'
import DatePicker from './DatePicker.jsx'

/* ===== תצוגת דוח בודד (קריאה בלבד) + הדפסה ===== */
function ReportDetail({ unit, report, onBack }) {
  const { section, record } = report

  // סגירת יחידה – תצוגה ייעודית (אין משימות/חתימות)
  if (report.tabId === 'closure') {
    const c = report.closure || record || {}
    const fmt = (iso) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('he-IL') : '—')
    return (
      <div>
        <div className="no-print rd-toolbar">
          <button className="back-link" onClick={onBack}>
            <span className="bl-arrow">→</span> חזרה לרשימת הדוחות
          </button>
          <button className="btn rd-print" onClick={() => window.print()}>הדפסה</button>
        </div>
        <div className="report-print">
          <div className="rp-head">
            <img className="rp-logo" src={import.meta.env.BASE_URL + 'logo.png'} alt="הרצליה מדיקל סנטר" />
            <div className="rp-brand">הרצליה מדיקל סנטר · כוחות עזר</div>
            <h2 className="rp-title">{report.title}</h2>
            <div className="rp-meta">
              <span><b>יחידה:</b> {unit.name}</span>
              <span><b>סוג:</b> {TYPE_LABELS.closure}</span>
              <span><b>תועד בתאריך:</b> {report.dateLabel}</span>
              {report.timeLabel && <span><b>שעה:</b> {report.timeLabel}</span>}
            </div>
          </div>
          <div className="rp-section">
            <h3>פרטי הסגירה</h3>
            <ul className="rp-signs">
              <li><span className="rp-sign-label">מתאריך:</span> <b>{fmt(c.from)}</b></li>
              <li><span className="rp-sign-label">עד תאריך:</span> <b>{fmt(c.to)}</b></li>
              <li><span className="rp-sign-label">סיבה:</span> <b>{c.reason || '—'}</b></li>
              <li><span className="rp-sign-label">דווח ע״י:</span> <b>{c.by || '—'}</b></li>
            </ul>
          </div>
          <div className="rp-foot">נשמר ב-{new Date(report.savedAt).toLocaleString('he-IL')}</div>
        </div>
      </div>
    )
  }

  const tasks = flattenSectionTasks(section)
  const signoff = (section ? section.signoff : []) || []

  return (
    <div>
      <div className="no-print rd-toolbar">
        <button className="back-link" onClick={onBack}>
          <span className="bl-arrow">→</span> חזרה לרשימת הדוחות
        </button>
        <button className="btn rd-print" onClick={() => window.print()}>הדפסה</button>
      </div>

      <div className="report-print">
        <div className="rp-head">
          <img className="rp-logo" src={import.meta.env.BASE_URL + 'logo.png'} alt="הרצליה מדיקל סנטר" />
          <div className="rp-brand">הרצליה מדיקל סנטר · כוחות עזר</div>
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
              {tasks.map((t, i) => {
                const v = record.checked && record.checked[i]
                const resolved = taskResolved(t.kind, v)
                const special = t.kind ? specialTaskText(t.kind, v) : ''
                return (
                  <li key={i}>
                    {t.firstInGroup && t.group && <div className="rp-group">{t.group}</div>}
                    <span className={'rp-mark' + (resolved ? ' on' : '')}>{resolved ? '✓' : '—'}</span>
                    <span className="rp-task-label">{t.label}{special ? ' — ' + special : ''}</span>
                  </li>
                )
              })}
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
export default function ReportsArchive({ unit, onBack, onGoHome, onBackToCategory, categoryName, onBackToPlan }) {
  const reports = useMemo(() => listReports(unit.id), [unit.id])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [performer, setPerformer] = useState('')
  const [folder, setFolder] = useState('all') // תיקייה: יומי בוקר/ערב · שבועי · חודשי
  const [open, setOpen] = useState(null)

  // תיקיות לפי תדירות – מתוך התוכנית (יומי/שבועי/חודשי), כך שהכפתורים תמיד מוצגים
  const folderOf = (r) => TYPE_LABELS[r.tabId] || r.tabId
  const plan = getCleaningPlan(unit.id)
  const folders = plan ? [...new Set(plan.tabs.map((t) => TYPE_LABELS[t.id] || t.id))] : []
  // הוספת תיקיית "סגירות" אם תועדו סגירות ליחידה
  if (reports.some((r) => r.tabId === 'closure') && !folders.includes(TYPE_LABELS.closure)) {
    folders.push(TYPE_LABELS.closure)
  }

  const trail = [{ label: 'ראשי', onClick: onGoHome }]
  if (categoryName) trail.push({ label: categoryName, onClick: onBackToCategory })
  trail.push({ label: unit.name, onClick: onBack })
  if (onBackToPlan) trail.push({ label: 'תוכניות ניקיון', onClick: onBackToPlan })
  trail.push({ label: 'דוחות ביצוע' })

  const header = (
    <ScreenHeader
      title="דוחות ביצוע"
      onBack={onBackToPlan || onBack}
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

  // סגירות מוצגות ראשונות בכל חודש (גם בתצוגת "הכל"), כדי שיהיו בולטות
  const TYPE_ORDER = { closure: -1, daily: 0, weekly: 1, monthly: 2, isolation: 3 }

  const filtered = reports.filter((r) => {
    if (folder !== 'all' && folderOf(r) !== folder) return false
    if (from && r.dateISO < from) return false
    if (to && r.dateISO > to) return false
    if (performer.trim()) {
      const q = performer.trim()
      const hay = (r.performers.join(' ') + ' ' + r.by)
      if (!hay.includes(q)) return false
    }
    return true
  })

  // קיבוץ היררכי: שנה -> חודש -> סוג -> תאריך (החדש למעלה)
  const sorted = [...filtered].sort(
    (a, b) =>
      b.year - a.year ||
      b.month - a.month ||
      (TYPE_ORDER[a.tabId] ?? 9) - (TYPE_ORDER[b.tabId] ?? 9) ||
      b.day - a.day ||
      b.sortTs - a.sortTs
  )
  const groups = []
  let curY, curM, curT, curD
  for (const r of sorted) {
    if (r.year !== curY) { curY = r.year; curM = curT = curD = null; groups.push({ kind: 'year', label: String(r.year) }) }
    if (r.month !== curM) { curM = r.month; curT = curD = null; groups.push({ kind: 'month', label: HE_MONTHS[r.month] + ' ' + r.year }) }
    if (r.tabId !== curT) { curT = r.tabId; curD = null; groups.push({ kind: 'type', label: TYPE_LABELS[r.tabId] || r.tabId }) }
    if (r.day !== curD) { curD = r.day; groups.push({ kind: 'day', label: r.dateLabel }) }
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
            {folders.length > 0 && (
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
              <div className="field">
                <label>מתאריך</label>
                <DatePicker value={from} onChange={setFrom} placeholder="מתאריך" />
              </div>
              <div className="field">
                <label>עד תאריך</label>
                <DatePicker value={to} onChange={setTo} placeholder="עד תאריך" />
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
                // בתיקייה ספציפית הסוג כבר ידוע – לא מציגים שוב כותרת סוג
                if (g.kind === 'type') return folder === 'all' ? <div key={i} className="grp-type">{g.label}</div> : null
                if (g.kind === 'day') return <div key={i} className="grp-day">{g.label}</div>
                const r = g.report
                const isClosure = r.tabId === 'closure'
                return (
                  <button key={i} className={'report-card' + (isClosure ? ' closure-card' : '')} onClick={() => setOpen(r)}>
                    <div className="rc-main">
                      <span className="rc-title">{isClosure ? '🔒 ' : ''}{r.title}</span>
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
