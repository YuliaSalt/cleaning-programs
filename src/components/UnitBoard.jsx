import { unitWindows, getCurrentShift } from '../data/departments.js'
import Icon from './Icons.jsx'

export default function UnitBoard({ unit, onOpenWindow, onGoHome }) {
  const shift = getCurrentShift()

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="breadcrumb">
            <button
              onClick={onGoHome}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', font: 'inherit', padding: 0 }}
            >
              מסך ראשי
            </button>
            {unit.groupName && <> · {unit.groupName}</>} · <b>{unit.name}</b>
          </div>
          <h1 className="page-title">{unit.name}</h1>
        </div>
        <div className="shift-chip">
          <Icon name="clock" size={16} />
          משמרת נוכחית: {shift}
        </div>
      </div>

      <div className="section-head">
        <h2>לוח חלונות</h2>
        <span className="pill">{unit.shifts.length} משמרות · {unit.shifts.join(' / ')}</span>
      </div>

      <div className="card-grid">
        {unitWindows.map((w) => (
          <div
            key={w.id}
            className={
              'window-card' + (w.enabled ? ' clickable' : ' disabled')
            }
            role={w.enabled ? 'button' : undefined}
            tabIndex={w.enabled ? 0 : undefined}
            onClick={() => w.enabled && onOpenWindow(w.id)}
            onKeyDown={(e) => {
              if (w.enabled && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                onOpenWindow(w.id)
              }
            }}
          >
            <div className="wc-top">
              <span className="wc-icon"><Icon name={w.icon} size={24} /></span>
              <h3>{w.title}</h3>
            </div>
            <p>{w.description}</p>
            {!w.enabled && <span className="wc-soon">בקרוב</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
