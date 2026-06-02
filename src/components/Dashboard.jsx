import { categories, getCategoryUnits } from '../data/departments.js'
import { computeUnitProgress } from '../data/progress.js'
import ScreenHeader from './ScreenHeader.jsx'

// צבע לפי אחוז ביצוע: 0–60% אדום · 60–90% צהוב · 90–100% מנטה
function progColor(v) {
  if (v >= 90) return '#1faf8f' // מנטה
  if (v >= 60) return '#e6b400' // צהוב
  return '#e2554e' // אדום
}

/* טבעת התקדמות עגולה (שעון) */
function Ring({ value, label }) {
  const size = 78
  const stroke = 8
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const has = value !== null && value !== undefined
  const pct = has ? value : 0
  const offset = c - (pct / 100) * c
  const color = has ? progColor(pct) : null
  return (
    <div className="ring">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="ring-track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
        />
        {has && (
          <circle
            className="ring-prog"
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth={stroke}
            fill="none"
            style={{ stroke: color }}
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
        <text
          className="ring-text"
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          style={has ? { fill: color } : undefined}
        >
          {has ? pct + '%' : '—'}
        </text>
      </svg>
      <span className="ring-label">{label}</span>
    </div>
  )
}

export default function Dashboard({ onGoHome, onSelectUnit }) {
  return (
    <div>
      <ScreenHeader
        title="דשבורד ביצועים · תוכניות ניקיון"
        onBack={onGoHome}
        trail={[{ label: 'ראשי', onClick: onGoHome }, { label: 'דשבורד ביצועים · תוכניות ניקיון' }]}
      />

      <p className="empty-hint" style={{ margin: '4px 2px 24px' }}>
        אחוזי הביצוע מחושבים מתוך טפסי הניקיון שנשמרו (יומי לפי היום, שבועי לפי השבוע, חודשי לפי החודש).
        יחידה ללא נתונים שמורים תוצג כ-0%.
      </p>

      {categories.map((cat) => (
        <section key={cat.id} style={{ marginBottom: 14 }}>
          <div className="section-head">
            <h2>{cat.name}</h2>
          </div>
          <div className="dash-grid">
            {/* יחידה עם חדרים (התאוששות) מוצגת כקלף נפרד לכל חדר – נתונים נפרדים. */}
            {getCategoryUnits(cat.id)
              .flatMap((u) => (u.rooms ? u.rooms : [u]))
              .map((u) => {
              const p = computeUnitProgress(u.id)
              return (
                <button
                  key={u.id}
                  className="dash-card"
                  onClick={() => onSelectUnit(u.id)}
                  title="מעבר ליחידה"
                >
                  <span className="dc-name">{u.name}</span>
                  <div className="dc-rings">
                    <Ring value={p.daily} label="יומי" />
                    <Ring value={p.weekly} label="שבועי" />
                    <Ring value={p.monthly} label="חודשי" />
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
