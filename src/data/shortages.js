// דיווח על חסרים ומלאי – הַאב עם שלוש קטגוריות: ציוד אנדוסקופי (רכש),
// ציוד מהמחסן, והזמנת תרופות. רשימת התרופות נשענת על meds.js (אותה רשימה
// המשמשת את בקרת התרופות החודשית). רשימות הציוד יתווספו בהמשך.
//
// כל פריט: { name, sku?, group? }. מספרי המק״ט מוסתרים מהתצוגה אך נשלפים
// אוטומטית להודעת הוואטסאפ.

import { getMedList } from './meds.js'

// רשימות ציוד לפי מחלקה – ריק כעת, מוכן למילוי כשיתקבלו הרשימות.
const ENDOSCOPIC_ITEMS = {
  // gastro: [{ name: '...', sku: '...' }],
}
const WAREHOUSE_ITEMS = {
  // gastro: [{ name: '...', sku: '...' }],
}

// הגדרת שלוש הקטגוריות עבור מחלקה נתונה.
// waTitle = כותרת קבועה להודעת הוואטסאפ של אותה קטגוריה.
export function getShortageCategories(unitId) {
  const isGastro = unitId === 'gastro'
  return [
    {
      id: 'endoscopic',
      // בגסטרו: "ציוד אנדוסקופי (רכש)". בשאר המחלקות ללא המילה "אנדוסקופי".
      label: isGastro ? 'ציוד אנדוסקופי (רכש)' : 'ציוד (רכש)',
      waTitle: isGastro ? 'בקשה לרכש ציוד אנדוסקופי' : 'בקשה לרכש ציוד',
      items: ENDOSCOPIC_ITEMS[unitId] || [],
    },
    {
      id: 'warehouse',
      label: 'ציוד מהמחסן',
      waTitle: 'בקשה להזמנת ציוד מהמחסן',
      items: WAREHOUSE_ITEMS[unitId] || [],
    },
    {
      id: 'meds',
      label: 'הזמנת תרופות',
      waTitle: 'בקשה להזמנת תרופות',
      items: getMedList(unitId),
    },
  ]
}

// מפתח ייחודי לפריט (לשמירת סטטוס "חסר") – יציב בין סינון/חיפוש לתצוגה רגילה.
export function itemKey(catId, item) {
  return catId + '::' + (item.sku || item.name)
}

// בניית טקסט הודעת הוואטסאפ: כותרת קבועה, שורת דחיפות, ורשימה נקייה
// (שם + מק״ט בלבד, ללא המילה "חסר" וללא סוגריים). ללא כותרת תחתית.
export function buildWhatsAppText(category, items, urgency) {
  const lines = [category.waTitle]
  if (urgency) lines.push('דחיפות: ' + urgency)
  lines.push('')
  items.forEach((it) => {
    lines.push('* ' + it.name + (it.sku ? ' ' + it.sku : ''))
  })
  return lines.join('\n')
}

// פתיחת וואטסאפ עם הטקסט המוכן (בורר צ׳אט/קבוצה במכשיר).
export function sendWhatsApp(category, items, urgency) {
  const url = 'https://wa.me/?text=' + encodeURIComponent(buildWhatsAppText(category, items, urgency))
  window.open(url, '_blank', 'noopener')
}
