import { useMemo, useState, useRef, Fragment } from 'react'
import ScreenHeader from './ScreenHeader.jsx'
import { getShortageCategories, itemKey, sendWhatsApp } from '../data/shortages.js'
import { emailPdf, pdfBlob, blobToBase64, pdfFilename } from '../data/reportPdf.js'
import { sendPdfEmail } from '../data/cloudSync.js'

// כתובת מייל ליעד לכל קטגוריה – נזכרת במכשיר (localStorage), לא נשמרת בקוד.
const emailKey = (catId) => 'hmc:shortemail:' + catId
const getSavedEmail = (catId) => { try { return localStorage.getItem(emailKey(catId)) || '' } catch { return '' } }

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.4.7 4.6 1.9 6.5L4 29l7-1.8c1.8 1 3.8 1.5 6 1.5 6.6 0 12-5.3 12-11.9C29 8.3 22.6 3 16 3zm0 21.7c-1.9 0-3.7-.5-5.2-1.4l-.4-.2-4.1 1.1 1.1-4-.3-.4c-1-1.6-1.5-3.5-1.5-5.5C5.6 9.2 10.2 4.7 16 4.7s10.4 4.5 10.4 10.2S21.8 24.7 16 24.7z" />
      <path d="M22 18.3c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4z" />
    </svg>
  )
}

const norm = (s) => (s || '').toString().toLowerCase()

// רמות דחיפות לבחירה (משפיעות על שורת "דחיפות" בהודעת הוואטסאפ)
export const URGENCY_LEVELS = ['רגילה', 'דחופה', 'דחופה מאוד']
const urgClass = { 'רגילה': 'lvl1', 'דחופה': 'lvl2', 'דחופה מאוד': 'lvl3' }
const urgKey = (u) => urgClass[u] || 'lvl1'

/* בורר דחיפות – מופיע על העמוד וגם בתוך כל קטגוריה */
function UrgencyPicker({ value, onChange }) {
  return (
    <div className="sh-urgency">
      <span className="sh-urgency-label">דחיפות:</span>
      <div className="sh-urg-btns">
        {URGENCY_LEVELS.map((u) => (
          <button
            key={u}
            type="button"
            className={'sh-urg-btn' + (value === u ? ' on ' + urgClass[u] : '')}
            onClick={() => onChange(u)}
          >
            {u}
          </button>
        ))}
      </div>
    </div>
  )
}

/* שורת פריט: לחיצה על "חסר" מסמנת חוסר וצובעת את השורה אדום בהיר. מק״ט מוסתר. */
function ItemRow({ item, missing, onToggle }) {
  return (
    <div className={'sh-row' + (missing ? ' missing' : '')}>
      <span className="sh-name">{item.name}</span>
      <button type="button" className={'sh-toggle' + (missing ? ' on' : '')} onClick={onToggle}>
        {missing ? '✓ חסר' : 'סמן חסר'}
      </button>
    </div>
  )
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="M3 6l9 7 9-7" />
    </svg>
  )
}

/* רשימת פריטים של קטגוריה (עם כותרות-קבוצה אם קיימות) */
function CategoryList({ category, items, isMissing, onToggle }) {
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
    </div>
  )
}

/* אלמנט מקור ל-PDF (מחוץ למסך) – נלכד ע"י html2pdf בשליחת המייל */
function ShortagePrintable({ printRef, unit, category, items, urgency, dateHe }) {
  return (
    <div className="report-print pdf-source" ref={printRef}>
      <div className="rp-head">
        <img className="rp-logo" src={import.meta.env.BASE_URL + 'logo.png'} alt="הרצליה מדיקל סנטר" />
        <div className="rp-brand">הרצליה מדיקל סנטר · כוחות עזר</div>
        <h2 className="rp-title">{category.waTitle}</h2>
        <div className="rp-meta">
          <span><b>מחלקה:</b> {unit.name}</span>
          <span><b>תאריך:</b> {dateHe}</span>
        </div>
      </div>
      <div className={'rp-urgency ' + urgKey(urgency)}>דחיפות: {urgency}</div>
      <div className="rp-section">
        <h3>פריטים לבקשה ({items.length})</h3>
        <table className="rp-table">
          <thead>
            <tr>
              <th className="rp-th-name">פריט</th>
              <th className="rp-th-exp">מק״ט</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td className="rp-td-name">{it.name}</td>
                <td className="rp-td-exp">{it.sku || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {category.note && <div className="rp-foot">{category.note}</div>}
    </div>
  )
}

export default function ShortagesReport({ unit, onBack, onGoHome, onBackToCategory, categoryName }) {
  const categories = useMemo(() => getShortageCategories(unit.id), [unit.id])
  const [query, setQuery] = useState('')
  const [catId, setCatId] = useState(null) // קטגוריה נבחרת
  const [missing, setMissing] = useState({}) // { [key]: true }
  const [urgency, setUrgency] = useState(URGENCY_LEVELS[0]) // דחיפות משותפת לדוח
  const [emailing, setEmailing] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const printRef = useRef(null)
  const dateHe = new Date().toLocaleDateString('he-IL')

  // missing[key] = מספר סידורי עולה (seq) של הסימון; ככל שגבוה יותר – סומן מאוחר יותר.
  const isMissing = (cid, item) => !!missing[itemKey(cid, item)]
  const markSeq = (cid, item) => missing[itemKey(cid, item)] || 0
  const toggle = (cid, item) => {
    const k = itemKey(cid, item)
    setMissing((m) => {
      if (m[k]) {
        const { [k]: _drop, ...rest } = m // ביטול סימון – הסרה
        return rest
      }
      const next = Math.max(0, ...Object.values(m)) + 1 // סימון חדש – seq הבא
      return { ...m, [k]: next }
    })
  }
  const totalMissing = (cat) => cat.items.filter((it) => isMissing(cat.id, it)).length

  const q = norm(query.trim())
  const openCat = (id) => { setQuery(''); setCatId(id); setEmailTo(getSavedEmail(id)) }
  const closeCat = () => { setQuery(''); setCatId(null) }

  const activeCat = catId ? categories.find((c) => c.id === catId) : null

  // כל הפריטים שסומנו כחסר – מכל הקטגוריות יחד, ממוין כך שהפריט שסומן אחרון מופיע ראשון.
  const markedAll = categories
    .flatMap((cat) => cat.items.filter((it) => isMissing(cat.id, it)).map((it) => ({ cat, it })))
    .sort((a, b) => markSeq(b.cat.id, b.it) - markSeq(a.cat.id, a.it))

  const trail = [{ label: 'ראשי', onClick: onGoHome }]
  if (categoryName) trail.push({ label: categoryName, onClick: onBackToCategory })
  trail.push({ label: unit.name, onClick: onBack })
  trail.push({ label: 'דיווח על חסרים', onClick: activeCat ? closeCat : undefined })
  if (activeCat) trail.push({ label: activeCat.label })

  return (
    <div>
      <ScreenHeader
        title={'דיווח על חסרים · ' + unit.name}
        onBack={activeCat ? closeCat : onBack}
        trail={trail}
      />

      {/* סיכום קבוע: כל הפריטים שסומנו כחסר – נשאר גלוי בכל המסכים, גם בין קבוצות שונות */}
      {markedAll.length > 0 && (
        <div className="glass plan-card sh-marked">
          <div className="sh-cat-head">פריטים שסומנו כחסר ({markedAll.length})</div>
          {markedAll.map(({ cat, it }) => (
            <div className="sh-row missing" key={itemKey(cat.id, it)}>
              <span className="sh-name">{it.name}</span>
              <button type="button" className="sh-toggle on" onClick={() => toggle(cat.id, it)}>
                ✓ חסר
              </button>
            </div>
          ))}
        </div>
      )}

      {activeCat ? (
        /* תצוגת קטגוריה נבחרת */
        <div className="glass plan-card" style={{ marginTop: 14 }}>
          <UrgencyPicker value={urgency} onChange={setUrgency} />

          {/* כפתורי שליחה – וואטסאפ ומייל אחד ליד השני, מתחת לדחיפות */}
          {(() => {
            const activeMissing = activeCat.items.filter((it) => isMissing(activeCat.id, it))
            const none = activeMissing.length === 0
            const emailLabel = activeCat.id === 'meds' ? 'שלח למייל הזמנת תרופות' : 'שלח למייל חסרים PDF'
            const subject = activeCat.waTitle + ' · ' + unit.name
            const filename = pdfFilename(subject)
            const onEmail = async () => {
              if (none || emailing) return
              const to = emailTo.trim()
              if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
                alert('יש להזין כתובת מייל תקינה למשלוח.')
                return
              }
              setEmailing(true)
              try {
                const blob = await pdfBlob(printRef.current, filename)
                const pdfBase64 = await blobToBase64(blob)
                await sendPdfEmail({ to, subject, filename, pdfBase64, text: 'מצורף הדוח: ' + subject + ' (דחיפות: ' + urgency + ')' })
                try { localStorage.setItem(emailKey(activeCat.id), to) } catch { /* noop */ }
                alert('✓ הדוח נשלח למייל: ' + to)
              } catch (err) {
                // נפילה לשיתוף/הורדה צד-לקוח אם השרת לא זמין
                try {
                  await emailPdf(printRef.current, filename, subject)
                  alert('השליחה מהשרת לא זמינה — נפתח שיתוף/הורדה לצירוף ידני.')
                } catch {
                  alert('שליחת המייל נכשלה. בדוק/י חיבור לאינטרנט ושהגיבוי לענן מוגדר.')
                }
              } finally {
                setEmailing(false)
              }
            }
            return (
              <>
                <div className="sh-email-to">
                  <MailIcon />
                  <input
                    className="input"
                    type="email"
                    inputMode="email"
                    placeholder="כתובת מייל ליעד (נשמרת במכשיר)"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                  />
                </div>
                <div className="sh-send-row">
                  <button className="wa-btn" disabled={none} onClick={() => sendWhatsApp(activeCat, activeMissing, urgency)}>
                    <WhatsAppIcon /> שלח לוואטסאפ ({activeMissing.length})
                  </button>
                  <button className="email-btn" disabled={none || emailing} onClick={onEmail}>
                    <MailIcon /> {emailing ? 'שולח…' : emailLabel} ({activeMissing.length})
                  </button>
                </div>
                {activeCat.note && <div className="sh-order-note">⏰ {activeCat.note}</div>}
                <ShortagePrintable
                  printRef={printRef}
                  unit={unit}
                  category={activeCat}
                  items={activeMissing}
                  urgency={urgency}
                  dateHe={dateHe}
                />
              </>
            )
          })()}

          {/* חיפוש פנימי בתוך הקטגוריה (גם ציוד מתכלים וגם תרופות) */}
          <input
            className="input sh-search"
            type="search"
            placeholder={activeCat.id === 'meds' ? 'חיפוש תרופה…' : 'חיפוש פריט בקטגוריה…'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ marginTop: 12 }}
          />
          <CategoryList
            category={activeCat}
            items={q ? activeCat.items.filter((it) => norm(it.name).includes(q)) : activeCat.items}
            isMissing={isMissing}
            onToggle={toggle}
          />
        </div>
      ) : (
        /* הַאב: שלושת כפתורי הקטגוריות */
        <div className="card-grid single-col" style={{ marginTop: 14 }}>
          {categories.map((cat) => {
            const miss = totalMissing(cat)
            const empty = cat.items.length === 0
            return (
              <button key={cat.id} className="unit-card drill-card" onClick={() => openCat(cat.id)}>
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
