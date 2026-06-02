import { categories, getCategoryUnits } from '../data/departments.js'

export default function Home({ onOpenCategory, onOpenDashboard }) {
  return (
    <div>
      {/* מסך פתיחה – לוגו HMC ממורכז */}
      <div className="home-hero">
        <img
          className="home-logo"
          src={import.meta.env.BASE_URL + 'logo.png'}
          alt="הרצליה מדיקל סנטר"
        />
        <p className="home-sub">הרצליה מדיקל סנטר · כוחות עזר</p>
      </div>

      {/* כפתור רחב – דשבורד ביצועים */}
      <button className="dash-btn" onClick={onOpenDashboard}>
        <span className="db-title">דשבורד ביצועים</span>
        <span className="db-sub">מעקב אחוזי ביצוע יומי · שבועי · חודשי לכל מחלקה</span>
      </button>

      {/* רשת קטגוריות – עמודה אחת אם המספר אי-זוגי */}
      <div className={'cat-grid' + (categories.length % 2 ? ' single-col' : '')}>
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
