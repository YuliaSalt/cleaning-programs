// מבנה המחלקות והיחידות של מערך כוחות העזר - הרצליה מדיקל סנטר
//
// shifts: 3 = בוקר / ערב / לילה ,  2 = בוקר / ערב
// המבנה מחולק לקבוצות שנפתחות לתת-יחידות, וליחידות עצמאיות.

export const SHIFTS_3 = ['בוקר', 'ערב', 'לילה']
export const SHIFTS_2 = ['בוקר', 'ערב']

// קבוצות שנפתחות לתת-יחידות
export const groups = [
  {
    id: 'inpatient',
    name: 'מחלקות אשפוז',
    icon: 'department',
    shifts: SHIFTS_3,
    units: [
      { id: 'inpatient-a', name: 'אשפוז א' },
      { id: 'inpatient-b', name: 'אשפוז ב' },
      { id: 'inpatient-c', name: 'אשפוז ג' },
      { id: 'icu', name: 'טיפול נמרץ' },
      { id: 'inpatient-e', name: 'אשפוז ה' },
      { id: 'inpatient-d', name: 'אשפוז ד' },
    ],
  },
  {
    id: 'imaging',
    name: 'מכון דימות',
    icon: 'imaging',
    shifts: SHIFTS_3,
    units: [
      // CT עובד ב-3 משמרות; MRI ורנטגן ב-2 משמרות (לפי קבצי המקור)
      { id: 'ct', name: 'CT', shifts: SHIFTS_3 },
      { id: 'mri', name: 'MRI', shifts: SHIFTS_2 },
      { id: 'xray', name: 'רנטגן', shifts: SHIFTS_2 },
    ],
  },
]

// יחידות עצמאיות (2 משמרות: בוקר / ערב). אייקון אחיד וניטרלי לכל היחידות.
// יחידה עם rooms נפתחת תחילה למסך בחירת חדר; כל חדר הוא תת-יחידה עם נתונים נפרדים.
export const standaloneUnits = [
  {
    id: 'recovery',
    name: 'התאוששות',
    icon: 'department',
    rooms: [
      { id: 'recovery-1', name: 'התאוששות 1' },
      { id: 'recovery-2', name: 'התאוששות 2' },
    ],
  },
  { id: 'or', name: 'חדרי ניתוח', icon: 'department' },
  { id: 'ivf', name: 'IVF', icon: 'department' },
  { id: 'cath', name: 'צינתורים', icon: 'department' },
  { id: 'gastro', name: 'גסטרו ופעולות', icon: 'department' },
].map((u) => ({ ...u, shifts: SHIFTS_2 }))

// שטוח – כל היחידות הניתנות לבחירה, עם הקשר הקבוצה והמשמרות
export function getAllUnits() {
  const fromGroups = groups.flatMap((g) =>
    g.units.map((u) => ({
      ...u,
      shifts: u.shifts || g.shifts, // העדפת משמרות ברמת היחידה (לדוגמה MRI/רנטגן)
      groupId: g.id,
      groupName: g.name,
    }))
  )
  // יחידות עצמאיות; יחידה עם rooms מתרחבת גם לתת-היחידות (חדרים) שלה.
  const standalone = standaloneUnits.flatMap((u) => {
    const base = { ...u, groupId: null, groupName: null }
    if (!u.rooms) return [base]
    const children = u.rooms.map((r) => ({
      id: r.id,
      name: r.name,
      icon: u.icon,
      shifts: u.shifts,
      parentId: u.id,
      groupId: null,
      groupName: null,
    }))
    return [base, ...children]
  })
  return [...fromGroups, ...standalone]
}

export function findUnit(unitId) {
  return getAllUnits().find((u) => u.id === unitId) || null
}

// ===== קטגוריות המסך הראשי (4 קוביות) =====
// קיבוץ תצוגה: כל קובייה נפתחת לרשימת היחידות שלה.
export const categories = [
  {
    id: 'inpatient',
    name: 'מחלקות אשפוז',
    subtitle: 'אשפוז א–ה · טיפול נמרץ',
    unitIds: ['inpatient-a', 'inpatient-b', 'inpatient-c', 'inpatient-d', 'inpatient-e', 'icu'],
  },
  {
    id: 'surgery',
    name: 'מערך חדרי ניתוח והתאוששות',
    subtitle: 'חדרי ניתוח · התאוששות',
    unitIds: ['or', 'recovery'],
  },
  {
    id: 'institutes',
    name: 'מכונים ויחידות',
    subtitle: 'גסטרו ופעולות · צינתורים · IVF',
    unitIds: ['gastro', 'cath', 'ivf'],
  },
  {
    id: 'imaging',
    name: 'מכון דימות',
    subtitle: 'CT · MRI · רנטגן',
    unitIds: ['ct', 'mri', 'xray'],
  },
]

export function getCategory(id) {
  return categories.find((c) => c.id === id) || null
}

export function getCategoryUnits(id) {
  const c = getCategory(id)
  if (!c) return []
  return c.unitIds.map(findUnit).filter(Boolean)
}

export function findCategoryOfUnit(unitId) {
  return categories.find((c) => c.unitIds.includes(unitId)) || null
}

// החלונות הבסיסיים בכניסה לכל יחידה.
export const unitWindows = [
  {
    id: 'cleaning',
    title: 'תוכניות ניקיון מחלקתי',
    description: 'תוכנית יומית / שבועית / חודשית, צ׳קליסט וחתימת מבצע',
    enabled: true,
  },
  {
    id: 'handover',
    title: 'דו״ח אחראית משמרת',
    description: 'דיווח והעברת מידע בין משמרות',
    enabled: true,
  },
  {
    id: 'meds',
    title: 'בקרת תרופות חודשית',
    description: 'בדיקת מלאי ותוקף תרופות',
    enabled: true,
  },
  {
    id: 'shortages',
    title: 'דיווח על חסרים',
    description: 'דיווח חוסרים בציוד רכש, ציוד מהמחסן ותרופות',
    enabled: true,
  },
]

// פעולות מיוחדות – ייחודי ליחידת גסטרו ופעולות.
// פריט יכול להיות מחרוזת פשוטה, או אובייקט עם רישום באנגלית ומשמעות בעברית.
export const specialProcedures = [
  { id: 'broncho', en: 'Bronchoscopy', he: 'ברונכוסקופיה' },
  'ניקור פלאורלי',
  { id: 'cystoscopy', en: 'Cystoscopy', he: 'ציסטוסקופיה' },
  { id: 'pain', he: 'מרפאת כאב' },
  { id: 'conization', en: 'Conization', he: 'קוניזציה' },
  { id: 'overstitch', en: 'OverStitch', he: 'אוברסטיץ׳' },
  { id: 'poem', en: 'POEM', he: 'מיוטומיה אנדוסקופית פומית' },
  'TIF',
]

// החלונות של יחידה ספציפית (כולל תוספות ייחודיות).
export function getUnitWindows(unitId) {
  const windows = [...unitWindows]
  if (unitId === 'gastro') {
    windows.push({
      id: 'special',
      title: 'פעולות מיוחדות',
      description: 'Bronchoscopy · Pleural Puncture · Cystoscopy · Pain Clinic · Conization · OverStitch · POEM · TIF',
      enabled: true,
    })
  }
  return windows
}

// קביעת משמרת אוטומטית לפי שעה: 07-15 בוקר, 15-23 ערב, 23-07 לילה
export function getCurrentShift(date = new Date()) {
  const h = date.getHours()
  if (h >= 7 && h < 15) return 'בוקר'
  if (h >= 15 && h < 23) return 'ערב'
  return 'לילה'
}

// משמרת גסטרו (2 משמרות): 06:30–15:00 בוקר, 15:00–23:00 ערב.
// השלמה לשעות הלילה: עד 06:30 בוקר, מ-23:00 ערב.
export function getGastroShift(date = new Date()) {
  const m = date.getHours() * 60 + date.getMinutes()
  if (m >= 390 && m < 900) return 'בוקר'
  if (m >= 900 && m < 1380) return 'ערב'
  return m >= 1380 ? 'ערב' : 'בוקר'
}
