import { useState } from 'react'
import { groups, standaloneUnits } from '../data/departments.js'
import Icon from './Icons.jsx'

export default function Sidebar({ activeUnitId, onSelectUnit, onGoHome }) {
  // קבוצות פתוחות כברירת מחדל
  const [open, setOpen] = useState(() =>
    Object.fromEntries(groups.map((g) => [g.id, true]))
  )

  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }))

  return (
    <aside className="sidebar">
      <button
        className="brand"
        onClick={onGoHome}
        style={{ background: 'transparent', border: 'none', width: '100%', cursor: 'pointer' }}
      >
        <span className="brand-logo">+</span>
        <span style={{ textAlign: 'right' }}>
          <span className="brand-title" style={{ display: 'block' }}>
            הרצליה מדיקל סנטר
          </span>
          <span className="brand-sub">תוכניות עבודה · כוחות עזר</span>
        </span>
      </button>

      <div className="nav-section-label">קבוצות מחלקות</div>
      {groups.map((g) => (
        <div className="tree-group" key={g.id}>
          <button
            className={'tree-toggle' + (open[g.id] ? ' open' : '')}
            onClick={() => toggle(g.id)}
          >
            <span className="tree-icon"><Icon name={g.icon} size={18} /></span>
            <span>{g.name}</span>
            <span className="chev">▶</span>
          </button>
          {open[g.id] && (
            <div className="tree-children">
              {g.units.map((u) => (
                <button
                  key={u.id}
                  className={'tree-leaf' + (activeUnitId === u.id ? ' active' : '')}
                  onClick={() => onSelectUnit(u.id)}
                >
                  <span>{u.name}</span>
                  <span className="tree-badge">{g.shifts.length} משמרות</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="nav-section-label">יחידות עצמאיות</div>
      <div className="tree-children" style={{ borderInlineStart: 'none', marginInlineStart: 0 }}>
        {standaloneUnits.map((u) => (
          <button
            key={u.id}
            className={'tree-leaf' + (activeUnitId === u.id ? ' active' : '')}
            onClick={() => onSelectUnit(u.id)}
          >
            <span className="tree-icon"><Icon name={u.icon} size={18} /></span>
            <span>{u.name}</span>
            <span className="tree-badge">{u.shifts.length} משמרות</span>
          </button>
        ))}
      </div>
    </aside>
  )
}
