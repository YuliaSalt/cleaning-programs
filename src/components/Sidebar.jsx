import { useState } from 'react'
import { categories, getCategoryUnits } from '../data/departments.js'

export default function Sidebar({ activeUnitId, onSelectUnit, onGoHome, onOpenDashboard, dashboardActive }) {
  // קטגוריות פתוחות כברירת מחדל
  const [open, setOpen] = useState(() =>
    Object.fromEntries(categories.map((c) => [c.id, true]))
  )

  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }))

  return (
    <aside className="sidebar">
      <button
        className="brand"
        onClick={onGoHome}
        style={{ background: 'transparent', border: 'none', width: '100%', cursor: 'pointer' }}
      >
        <span style={{ textAlign: 'right' }}>
          <span className="brand-title" style={{ display: 'block' }}>
            הרצליה מדיקל סנטר
          </span>
          <span className="brand-sub">תוכניות עבודה · כוחות עזר</span>
        </span>
      </button>

      <button className="nav-flat home" onClick={onGoHome}>
        <span className="bl-arrow">→</span> מסך ראשי
      </button>

      <button
        className={'nav-flat' + (dashboardActive ? ' active' : '')}
        onClick={onOpenDashboard}
      >
        דשבורד ביצועים
      </button>

      <div className="nav-section-label">קטגוריות</div>
      {categories.map((c) => (
        <div className="tree-group" key={c.id}>
          <button
            className={'tree-toggle' + (open[c.id] ? ' open' : '')}
            onClick={() => toggle(c.id)}
          >
            <span>{c.name}</span>
            <span className="chev">▶</span>
          </button>
          {open[c.id] && (
            <div className="tree-children">
              {getCategoryUnits(c.id).map((u) => (
                <button
                  key={u.id}
                  className={'tree-leaf' + (activeUnitId === u.id ? ' active' : '')}
                  onClick={() => onSelectUnit(u.id)}
                >
                  <span>{u.name}</span>
                  <span className="tree-badge">{u.shifts.length} משמרות</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </aside>
  )
}
