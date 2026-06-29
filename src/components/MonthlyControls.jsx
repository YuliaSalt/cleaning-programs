import { useState } from 'react'
import ScreenHeader from './ScreenHeader.jsx'
import {
  MONTH_NAMES_HE,
  ymKey,
  currentYear,
  currentMonth1,
  monthName,
  getMonthEntry,
  saveMonthEntry,
} from '../data/monthlyControls.js'

// שורת חודש בודדת: שם החודש + שני שדות שיבוץ (תרופות / עגלת החייאה).
// עריכה ישירה בשורה (ללא חלון). נשמר אוטומטית ביציאה מהשדה.
function MonthRow({ unitId, year, month1, isCurrent }) {
  const ym = ymKey(year, month1)
  const [meds, setMeds] = useState(() => getMonthEntry(unitId, ym).meds.name)
  const [crash, setCrash] = useState(() => getMonthEntry(unitId, ym).crash.name)
  const [saved, setSaved] = useState(false)

  function persist() {
    saveMonthEntry(unitId, ym, { meds: { name: meds, note: '' }, crash: { name: crash, note: '' } })
    setSaved(true)
  }

  return (
    <div className={'glass plan-card mc-row' + (isCurrent ? ' mc-current' : '')}>
      <div className="mc-row-head">
        <span className="mc-month">{monthName(month1)} {year}</span>
        {isCurrent && <span className="mc-now">חודש נוכחי</span>}
        {saved && <span className="mc-saved">✓ נשמר</span>}
      </div>
      <div className="mc-fields">
        <label className="mc-field">
          <span className="mc-role">בקרת תרופות</span>
          <input
            className="input"
            type="text"
            placeholder="שם אחות"
            value={meds}
            onChange={(e) => { setMeds(e.target.value); setSaved(false) }}
            onBlur={persist}
          />
        </label>
        <label className="mc-field">
          <span className="mc-role">בקרת עגלת החייאה</span>
          <input
            className="input"
            type="text"
            placeholder="שם אחות"
            value={crash}
            onChange={(e) => { setCrash(e.target.value); setSaved(false) }}
            onBlur={persist}
          />
        </label>
      </div>
    </div>
  )
}

export default function MonthlyControls({ unit, onBack, onGoHome, categoryName }) {
  const year = currentYear()
  const curMonth = currentMonth1()

  const trail = [{ label: 'ראשי', onClick: onGoHome }]
  if (categoryName) trail.push({ label: categoryName, onClick: onBack })
  trail.push({ label: unit.name, onClick: onBack })
  trail.push({ label: 'שיבוץ בקרה חודשית' })

  return (
    <div className="plan-wrap wide">
      <ScreenHeader title={'שיבוץ בקרה חודשית · ' + unit.name} onBack={onBack} trail={trail} />
      <p className="tab-note" style={{ marginBottom: 14 }}>
        ניהול תור: לכל חודש שם האחות האחראית לבקרת התרופות ולבקרת עגלת החייאה. הרישום נשמר אוטומטית.
      </p>

      <div className="mc-list">
        {MONTH_NAMES_HE.map((_, i) => (
          <MonthRow
            key={unit.id + '-' + (i + 1)}
            unitId={unit.id}
            year={year}
            month1={i + 1}
            isCurrent={i + 1 === curMonth}
          />
        ))}
      </div>
    </div>
  )
}
