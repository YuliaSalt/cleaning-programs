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
  return [
    {
      id: 'endoscopic',
      label: 'ציוד אנדוסקופי (רכש)',
      waTitle: 'בקשה לרכש ציוד אנדוסקופי',
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

// בניית טקסט הודעת הוואטסאפ: כותרת קבועה, רשימה נקייה (שם + מק״ט בלבד,
// ללא המילה "חסר" וללא סוגריים), וכותרת תחתית קבועה.
export function buildWhatsAppText(category, items) {
  const lines = [category.waTitle, '']
  items.forEach((it) => {
    lines.push('* ' + it.name + (it.sku ? ' ' + it.sku : ''))
  })
  lines.push('')
  lines.push('הופק אוטומטית דרך מערכת הדיווח הדיגיטלית')
  return lines.join('\n')
}

// פתיחת וואטסאפ עם הטקסט המוכן (בורר צ׳אט/קבוצה במכשיר).
export function sendWhatsApp(category, items) {
  const url = 'https://wa.me/?text=' + encodeURIComponent(buildWhatsAppText(category, items))
  window.open(url, '_blank', 'noopener')
}
