// כותרת מסך אחידה: כפתור "חזרה" ברור, פירורי לחם (breadcrumb), כותרת,
// ושורת תאריך/שעה/משמרת אוטומטית במסגרת מתחת לכותרת (אחידה בכל העמודים).
import { getCurrentShift } from '../data/departments.js'

export default function ScreenHeader({ title, trail = [], onBack, right }) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('he-IL')
  const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  const shift = getCurrentShift()
  return (
    <div className="screen-head">
      <div className="crumb-bar">
        {onBack && (
          <button className="back-link" onClick={onBack} aria-label="חזרה">
            <span className="bl-arrow">→</span>
            <span className="bl-text"> חזרה</span>
          </button>
        )}
        <nav className="crumbs" aria-label="מיקום">
          {trail.map((c, i) => (
            <span className="crumb" key={i}>
              {i > 0 && <span className="crumb-sep">‹</span>}
              {c.onClick ? (
                <button className="crumb-link" onClick={c.onClick}>{c.label}</button>
              ) : (
                <span className="crumb-cur">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      </div>
      <img
        className="sh-logo"
        src={import.meta.env.BASE_URL + 'logo.png'}
        alt="הרצליה מדיקל סנטר"
      />
      <div className="screen-head-main">
        <h1 className="page-title">{title}</h1>
        {right}
      </div>
      <div className="screen-meta">
        <span className="dot" />
        <span>{dateStr} · {timeStr} · משמרת {shift}</span>
      </div>
    </div>
  )
}
