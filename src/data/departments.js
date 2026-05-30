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
export const standaloneUnits = [
  { id: 'recovery', name: 'התאוששות', icon: 'department' },
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
  const standalone = standaloneUnits.map((u) => ({
    ...u,
    groupId: null,
    groupName: null,
  }))
  return [...fromGroups, ...standalone]
}

export function findUnit(unitId) {
  return getAllUnits().find((u) => u.id === unitId) || null
}

// חלונות (לוח) בכל יחידה. כרגע פעיל חלון תוכניות הניקיון; השאר שמורים להמשך.
export const unitWindows = [
  {
    id: 'cleaning',
    title: 'תוכניות ניקיון מחלקתי',
    icon: 'cleaning',
    description: 'תוכנית יומית / שבועית / חודשית, צ׳קליסט וחתימת מבצע',
    enabled: true,
  },
  {
    id: 'equipment',
    title: 'ציוד ומלאי',
    icon: 'equipment',
    description: 'בקרת מלאי חומרי ניקיון וציוד מתכלה',
    enabled: false,
  },
  {
    id: 'tasks',
    title: 'משימות יומיות',
    icon: 'tasks',
    description: 'משימות ושיבוץ כוחות עזר למשמרת',
    enabled: false,
  },
  {
    id: 'reports',
    title: 'דוחות ובקרה',
    icon: 'reports',
    description: 'סיכומי ביצוע ומעקב חתימות',
    enabled: false,
  },
]

// קביעת משמרת אוטומטית לפי שעה: 07-15 בוקר, 15-23 ערב, 23-07 לילה
export function getCurrentShift(date = new Date()) {
  const h = date.getHours()
  if (h >= 7 && h < 15) return 'בוקר'
  if (h >= 15 && h < 23) return 'ערב'
  return 'לילה'
}
