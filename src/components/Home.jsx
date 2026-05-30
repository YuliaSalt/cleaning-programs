import { groups, standaloneUnits } from '../data/departments.js'
import Icon from './Icons.jsx'

export default function Home({ onSelectUnit }) {
  return (
    <div>
      <div className="topbar">
        <div>
          <div className="breadcrumb">מסך ראשי</div>
          <h1 className="page-title">מחלקות ויחידות</h1>
        </div>
      </div>

      {groups.map((g) => (
        <section key={g.id}>
          <div className="section-head">
            <span className="sh-icon"><Icon name={g.icon} size={22} /></span>
            <h2>{g.name}</h2>
            <span className="pill">{g.units.length} מחלקות</span>
          </div>
          <div className="card-grid">
            {g.units.map((u) => (
              <button
                key={u.id}
                className="unit-card"
                onClick={() => onSelectUnit(u.id)}
              >
                <span className="uc-group">{g.name}</span>
                <span className="uc-icon"><Icon name={g.icon} size={26} /></span>
                <span className="uc-name">{u.name}</span>
                <span className="uc-meta">{(u.shifts || g.shifts).join(' · ')}</span>
              </button>
            ))}
          </div>
        </section>
      ))}

      <section>
        <div className="section-head">
          <span className="sh-icon"><Icon name="department" size={22} /></span>
          <h2>יחידות עצמאיות</h2>
          <span className="pill">{standaloneUnits.length} יחידות · 2 משמרות</span>
        </div>
        <div className="card-grid">
          {standaloneUnits.map((u) => (
            <button
              key={u.id}
              className="unit-card"
              onClick={() => onSelectUnit(u.id)}
            >
              <span className="uc-icon"><Icon name={u.icon} size={26} /></span>
              <span className="uc-name">{u.name}</span>
              <span className="uc-meta">{u.shifts.join(' · ')}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
