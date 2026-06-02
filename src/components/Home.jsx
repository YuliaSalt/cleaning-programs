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
        <p className="home-sub">הרצליה מדיקל סנטר</p>
      </div>

      {/* רשת קטגוריות + דשבורד כקובייה חמישית רחבה */}
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
        {/* דשבורד ביצועים – קובייה חמישית, לרוחב מלא */}
        <button className="cat-card cat-dash" onClick={onOpenDashboard}>
          <span className="cc-name">דשבורד ביצועים</span>
          <span className="cc-sub">מעקב אחוזי ביצוע יומי · שבועי · חודשי לכל מחלקה</span>
        </button>
      </div>
    </div>
  )
}
