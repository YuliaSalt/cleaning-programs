import { getUnitWindows, getCurrentShift } from '../data/departments.js'
import ScreenHeader from './ScreenHeader.jsx'

export default function UnitBoard({ unit, onOpenWindow, onSelectUnit, onGoHome, onBack, categoryName }) {
  const shift = getCurrentShift()

  const trail = [{ label: 'ראשי', onClick: onGoHome }]
  if (categoryName) trail.push({ label: categoryName, onClick: onBack })
  trail.push({ label: unit.name })

  // יחידה עם חדרים (לדוגמה "התאוששות"): מסך בחירת חדר לפני לוח החלונות.
  if (unit.rooms) {
    return (
      <div>
        <ScreenHeader title={unit.name} onBack={onBack} trail={trail} />
        <div className="section-head">
          <h2>בחירת חדר</h2>
        </div>
        <div className="card-grid">
          {unit.rooms.map((r) => (
            <button key={r.id} className="unit-card" onClick={() => onSelectUnit(r.id)}>
              <span className="uc-name">{r.name}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const windows = getUnitWindows(unit.id)

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
