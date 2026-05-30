import { getUnitWindows, getCurrentShift } from '../data/departments.js'
import ScreenHeader from './ScreenHeader.jsx'

export default function UnitBoard({ unit, onOpenWindow, onGoHome, onBack, categoryName }) {
  const shift = getCurrentShift()
  const windows = getUnitWindows(unit.id)

  const trail = [{ label: 'ראשי', onClick: onGoHome }]
  if (categoryName) trail.push({ label: categoryName, onClick: onBack })
  trail.push({ label: unit.name })

  return (
    <div>
      <ScreenHeader
        title={unit.name}
        onBack={onBack}
        trail={trail}
        right={
          <div className="shift-chip">
            <span className="dot" />
            משמרת נוכחית: {shift}
          </div>
        }
      />

      <div className="section-head">
        <h2>לוח חלונות</h2>
        <span className="pill">{unit.shifts.length} משמרות · {unit.shifts.join(' / ')}</span>
      </div>

      <div className="card-grid">
        {windows.map((w) => (
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
              <h3>{w.title}</h3>
            </div>
            <p>{w.description}</p>
            {!w.enabled && <span className="wc-soon">{w.soonLabel || 'בקרוב'}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
