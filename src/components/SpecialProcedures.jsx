import { useState } from 'react'
import ScreenHeader from './ScreenHeader.jsx'
import { specialProcedures } from '../data/departments.js'
import ProcedureChecklist from './ProcedureChecklist.jsx'
import { PROCEDURE_CHECKLISTS } from '../data/procedureChecklists.js'

// נרמול פריט (מחרוזת פשוטה או אובייקט עם רישום באנגלית + משמעות בעברית).
function normalize(p) {
  if (typeof p === 'string') return { id: p, title: p, sub: null }
  return { id: p.id, title: p.en || p.he, sub: p.en ? p.he : null }
}

export default function SpecialProcedures({ unit, onBack, onGoHome, onBackToCategory, categoryName }) {
  const [proc, setProc] = useState(null)

  const procLabel = proc ? (proc.sub ? `${proc.title} · ${proc.sub}` : proc.title) : ''
  const checklist = proc ? PROCEDURE_CHECKLISTS[proc.id] : null

  const trail = [{ label: 'ראשי', onClick: onGoHome }]
  if (categoryName) trail.push({ label: categoryName, onClick: onBackToCategory })
  trail.push({ label: unit.name, onClick: onBack })
  trail.push({ label: 'פעולות מיוחדות', onClick: proc ? () => setProc(null) : undefined })
  if (proc) trail.push({ label: procLabel })

  if (proc) {
    return (
      <div>
        <ScreenHeader title={procLabel + ' · ' + unit.name} onBack={() => setProc(null)} trail={trail} />
        {checklist ? (
          <ProcedureChecklist
            key={proc.id}
            procId={proc.id}
            title={checklist.title}
            waTitle={checklist.waTitle}
            blocks={checklist.blocks}
          />
        ) : (
          <div className="glass plan-card" style={{ padding: 40, textAlign: 'center' }}>
            <p className="empty-hint" style={{ fontSize: 16 }}>התוכן יתווסף בהמשך.</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <ScreenHeader title={'פעולות מיוחדות · ' + unit.name} onBack={onBack} trail={trail} />
      <div className="card-grid">
        {specialProcedures.map((p) => {
          const n = normalize(p)
          return (
            <button key={n.id} className="unit-card" onClick={() => setProc(n)}>
              <span className="uc-name">{n.title}</span>
              {n.sub && <span className="uc-sub">{n.sub}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
