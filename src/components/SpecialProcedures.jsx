import { useState } from 'react'
import ScreenHeader from './ScreenHeader.jsx'
import { specialProcedures } from '../data/departments.js'

export default function SpecialProcedures({ unit, onBack, onGoHome, onBackToCategory, categoryName }) {
  const [proc, setProc] = useState(null)

  const trail = [{ label: 'ראשי', onClick: onGoHome }]
  if (categoryName) trail.push({ label: categoryName, onClick: onBackToCategory })
  trail.push({ label: unit.name, onClick: onBack })
  trail.push({ label: 'פעולות מיוחדות', onClick: proc ? () => setProc(null) : undefined })
  if (proc) trail.push({ label: proc })

  if (proc) {
    return (
      <div>
        <ScreenHeader title={proc} onBack={() => setProc(null)} trail={trail} />
        <div className="glass plan-card" style={{ padding: 40, textAlign: 'center' }}>
          <p className="empty-hint" style={{ fontSize: 16 }}>התוכן יתווסף בהמשך.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <ScreenHeader title="פעולות מיוחדות" onBack={onBack} trail={trail} />
      <div className="card-grid">
        {specialProcedures.map((p) => (
          <button key={p} className="unit-card" onClick={() => setProc(p)}>
            <span className="uc-name">{p}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
