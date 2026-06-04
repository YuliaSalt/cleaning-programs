import { useMemo, useState, Fragment } from 'react'
import ScreenHeader from './ScreenHeader.jsx'
import { getShortageCategories, itemKey, sendWhatsApp } from '../data/shortages.js'

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.4.7 4.6 1.9 6.5L4 29l7-1.8c1.8 1 3.8 1.5 6 1.5 6.6 0 12-5.3 12-11.9C29 8.3 22.6 3 16 3zm0 21.7c-1.9 0-3.7-.5-5.2-1.4l-.4-.2-4.1 1.1 1.1-4-.3-.4c-1-1.6-1.5-3.5-1.5-5.5C5.6 9.2 10.2 4.7 16 4.7s10.4 4.5 10.4 10.2S21.8 24.7 16 24.7z" />
      <path d="M22 18.3c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4z" />
    </svg>
  )
}

const norm = (s) => (s || '').toString().toLowerCase()

/* שורת פריט: ברירת מחדל ✓ ירוק (תקין); לחיצה על "חסר" צובעת אדום בהיר. מק״ט מוסתר. */
function ItemRow({ item, missing, onToggle }) {
  return (
    <div className={'sh-row' + (missing ? ' missing' : '')}>
      <span className="sh-mark">{missing ? '✗' : '✓'}</span>
      <span className="sh-name">{item.name}</span>
      <button type="button" className={'sh-toggle' + (missing ? ' on' : '')} onClick={onToggle}>
        ✗ חסר
      </button>
    </div>
  )
}

/* רשימת פריטים של קטגוריה (עם כותרות-קבוצה אם קיימות) + כפתור שליחה לוואטסאפ */
function CategoryList({ category, items, isMissing, onToggle }) {
  const missingItems = category.items.filter((it) => isMissing(category.id, it))
  return (
    <div className="sh-list">
      {items.length === 0 ? (
        <p className="empty-hint" style={{ marginTop: 8 }}>אין פריטים להצגה.</p>
      ) : (
        items.map((it, i) => {
          const showGroup = it.group && (i === 0 || items[i - 1].group !== it.group)
          return (
            <Fragment key={itemKey(category.id, it)}>
              {showGroup && <div className="med-group">{it.group}</div>}
              <ItemRow item={it} missing={isMissing(category.id, it)} onToggle={() => onToggle(category.id, it)} />
            </Fragment>
          )
        })
      )}

      <div className="ho-actions">
        <button
          className="wa-btn"
          disabled={missingItems.length === 0}
          onClick={() => sendWhatsApp(category, missingItems)}
        >
          <WhatsAppIcon /> שליחת חוסרים לקבוצת «חסרים» ({missingItems.length})
        </button>
        {missingItems.length > 0 && (
          <p className="sh-hint">בלחיצה ייפתח וואטסאפ עם ההודעה מוכנה — בחר/י את קבוצת «חסרים» מרשימת הצ׳אטים ושלח/י.</p>
        )}
      </div>
    </div>
  )
}

export default function ShortagesReport({ unit, onBack, onGoHome, onBackToCategory, categoryName }) {
  const categories = useMemo(() => getShortageCategories(unit.id), [unit.id])
  const [query, setQuery] = useState('')
  const [catId, setCatId] = useState(null) // קטגוריה נבחרת
  const [missing, setMissing] = useState({}) // { [key]: true }

  const isMissing = (cid, item) => !!missing[itemKey(cid, item)]
  const toggle = (cid, item) => {
    const k = itemKey(cid, item)
    setMissing((m) => ({ ...m, [k]: !m[k] }))
  }
  const totalMissing = (cat) => cat.items.filter((it) => isMissing(cat.id, it)).length

  const q = norm(query.trim())
  const matchItems = (cat) => (q ? cat.items.filter((it) => norm(it.name).includes(q)) : cat.items)

  const activeCat = catId ? categories.find((c) => c.id === catId) : null

  const trail = [{ label: 'ראשי', onClick: onGoHome }]
  if (categoryName) trail.push({ label: categoryName, onClick: onBackToCategory })
  trail.push({ label: unit.name, onClick: onBack })
  trail.push({ label: 'דיווח על חסרים', onClick: activeCat ? () => setCatId(null) : undefined })
  if (activeCat) trail.push({ label: activeCat.label })

  return (
    <div>
      <ScreenHeader
        title="דיווח על חסרים"
        onBack={activeCat ? () => setCatId(null) : onBack}
        trail={trail}
      />

      {/* שורת חיפוש גלובלית – מסננת פריטים בכל הקטגוריות במקביל */}
      <div className="glass plan-card controls-card">
        <input
          className="input sh-search"
          type="search"
          placeholder="חיפוש פריט בכל הקטגוריות…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* תצוגת חיפוש גלובלי: תוצאות מכל הקטגוריות במקביל */}
      {q ? (
        (() => {
          const groups = categories
            .map((cat) => ({ cat, items: matchItems(cat) }))
            .filter((g) => g.items.length > 0)
          if (groups.length === 0) {
            return <p className="empty-hint" style={{ marginTop: 16 }}>לא נמצאו פריטים תואמים.</p>
          }
          return groups.map(({ cat, items }) => (
            <div className="glass plan-card" key={cat.id} style={{ marginTop: 14 }}>
              <div className="sh-cat-head">{cat.label}</div>
              <CategoryList category={cat} items={items} isMissing={isMissing} onToggle={toggle} />
            </div>
          ))
        })()
      ) : activeCat ? (
        /* תצוגת קטגוריה נבחרת */
        <div className="glass plan-card" style={{ marginTop: 14 }}>
          <CategoryList category={activeCat} items={activeCat.items} isMissing={isMissing} onToggle={toggle} />
        </div>
      ) : (
        /* הַאב: שלושת כפתורי הקטגוריות */
        <div className="card-grid single-col" style={{ marginTop: 14 }}>
          {categories.map((cat) => {
            const miss = totalMissing(cat)
            const empty = cat.items.length === 0
            return (
              <button key={cat.id} className="unit-card drill-card" onClick={() => setCatId(cat.id)}>
                <span className="uc-name">{cat.label}</span>
                <span className="uc-meta">
                  {empty ? 'טרם הוגדרה רשימה' : miss > 0 ? `${miss} חסרים מסומנים` : `${cat.items.length} פריטים`}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
