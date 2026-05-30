import { categories, getCategoryUnits } from '../data/departments.js'

export default function Home({ onOpenCategory, onOpenDashboard }) {
  return (
    <div>
      <div className="topbar">
        <div>
          <div className="breadcrumb">מסך ראשי</div>
          <h1 className="page-title">מחלקות ויחידות</h1>
        </div>
      </div>

      {/* כפתור רחב – דשבורד ביצועים */}
      <button className="dash-btn" onClick={onOpenDashboard}>
        <span className="db-title">דשבורד ביצועים</span>
        <span className="db-sub">מעקב אחוזי ביצוע יומי · שבועי · חודשי לכל מחלקה</span>
      </button>

      {/* רשת 2x2 של קטגוריות */}
      <div className="cat-grid">
        {categories.map((c) => {
          const count = getCategoryUnits(c.id).length
          return (
            <button key={c.id} className="cat-card" onClick={() => onOpenCategory(c.id)}>
              <span className="cc-name">{c.name}</span>
              <span className="cc-sub">{c.subtitle}</span>
              <span className="cc-count">{count} יחידות</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
