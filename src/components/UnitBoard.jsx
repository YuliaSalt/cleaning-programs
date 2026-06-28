import { useState } from 'react'
import { getUnitWindows } from '../data/departments.js'
import { listMedReports, hasMedList } from '../data/meds.js'
import { medsAlertLevel } from '../data/shiftAlert.js'
import { isUnitClosed } from '../data/closures.js'
import { getMonthEntry, currentYM, monthName, currentMonth1 } from '../data/monthlyControls.js'
import ScreenHeader from './ScreenHeader.jsx'
import ClosurePanel from './ClosurePanel.jsx'
import MonthlyControls from './MonthlyControls.jsx'

const monthKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')

export default function UnitBoard({ unit, onOpenWindow, onSelectUnit, onGoHome, onBack, categoryName }) {
  const [showControls, setShowControls] = useState(false)
  // כשהיחידה סגורה היום – להשתיק התראות "טרם נחתם / באיחור"
  const closed = isUnitClosed(unit.id)
  // בקרת תרופות נחתמה החודש? (לצביעת כפתור "בקרת תרופות חודשית") – רק למחלקה עם רשימה
  const medsDone = listMedReports(unit.id).some((r) => r.record.month === monthKey())
  const medsLevel = !closed && hasMedList(unit.id) ? medsAlertLevel(medsDone) : null

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
          {unit.rooms.map((r, i) => (
            <button key={r.id} className={'unit-card tint-' + (i % 5)} onClick={() => onSelectUnit(r.id)}>
              <span className="uc-name">{r.name}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const windows = getUnitWindows(unit.id)

  // שיבוץ החודש הנוכחי – להצגה על כפתור "שיבוץ בקרה חודשית"
  const ctl = getMonthEntry(unit.id, currentYM())
  const ctlMeds = ctl.meds.name.trim()
  const ctlCrash = ctl.crash.name.trim()

  // מסך "בקרות חודשיות" (ניהול תור אחראי תרופות / עגלת החייאה)
  if (showControls) {
    return (
      <MonthlyControls
        unit={unit}
        onBack={() => setShowControls(false)}
        onGoHome={onGoHome}
        categoryName={categoryName}
      />
    )
  }

  return (
    <div>
      <ScreenHeader title={unit.name} onBack={onBack} trail={trail} />

      <ClosurePanel unit={unit} />

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

      {/* כפתור בשורה נפרדת בתחתית – שיבוץ בקרה חודשית (ניהול תור אחיות) */}
      <div className="card-grid single-col" style={{ marginTop: 16 }}>
        <div
          className="window-card win-controls clickable"
          role="button"
          tabIndex={0}
          onClick={() => setShowControls(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setShowControls(true)
            }
          }}
        >
          <div className="wc-top">
            <h3>שיבוץ בקרה חודשית</h3>
          </div>
          <p>עגלת החייאה ותרופות · שיבוץ אחיות</p>
          <div className="mc-assign">
            <span className="mc-assign-month">{monthName(currentMonth1())}</span>
            <span className="mc-assign-row">
              <span className="mc-assign-role">תרופות</span>
              <span className={'mc-assign-name' + (ctlMeds ? '' : ' empty')}>{ctlMeds || 'טרם שובץ'}</span>
            </span>
            <span className="mc-assign-row">
              <span className="mc-assign-role">עגלת החייאה</span>
              <span className={'mc-assign-name' + (ctlCrash ? '' : ' empty')}>{ctlCrash || 'טרם שובץ'}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
