import { getUnitWindows } from '../data/departments.js'
import { listMedReports, hasMedList } from '../data/meds.js'
import { medsAlertLevel } from '../data/shiftAlert.js'
import ScreenHeader from './ScreenHeader.jsx'

const monthKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')

export default function UnitBoard({ unit, onOpenWindow, onSelectUnit, onGoHome, onBack, categoryName }) {
  // בקרת תרופות נחתמה החודש? (לצביעת כפתור "בקרת תרופות חודשית") – רק למחלקה עם רשימה
  const medsDone = listMedReports(unit.id).some((r) => r.record.month === monthKey())
  const medsLevel = hasMedList(unit.id) ? medsAlertLevel(medsDone) : null

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
        <div className={'card-grid' + (unit.rooms.length % 2 ? ' single-col' : '')}>
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
      <ScreenHeader title={unit.name} onBack={onBack} trail={trail} />

      <div className={'card-grid' + (windows.length % 2 ? ' single-col' : '')}>
        {windows.map((w) => (
          <div
            key={w.id}
            className={
              'window-card win-' + w.id + (w.enabled ? ' clickable' : ' disabled') +
              (w.id === 'meds' && medsLevel ? ' alert-' + medsLevel : '')
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
