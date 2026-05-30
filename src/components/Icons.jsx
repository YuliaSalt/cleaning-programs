// אייקונים ניטרליים ומכובדים בסגנון קווי לסביבה רפואית.
// ללא אמוג'י דרמטיים. כולם משתמשים ב-currentColor כדי להתאים לרקע.

const paths = {
  // אייקון מחלקה / חדר כללי (אחיד וניטרלי לכל היחידות)
  department: (
    <>
      <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
      <line x1="3" y1="21" x2="21" y2="21" />
      <circle cx="15.5" cy="12" r="1" />
    </>
  ),
  // מכון דימות – מסך/מוניטור עם גל, ללא סמלים גרפיים
  imaging: (
    <>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M7 11.5l2.5-3 2 2.5L14 8.5l3 3" />
      <line x1="9" y1="20.5" x2="15" y2="20.5" />
      <line x1="12" y1="17" x2="12" y2="20.5" />
    </>
  ),
  // תוכנית ניקיון – טיפת חיטוי
  cleaning: (
    <>
      <path d="M12 3.2c0 0 6 6.3 6 10.3a6 6 0 0 1-12 0c0-4 6-10.3 6-10.3z" />
      <path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5" />
    </>
  ),
  // ציוד ומלאי – ארגז
  equipment: (
    <>
      <path d="M3 7.5l9-4 9 4v9l-9 4-9-4z" />
      <path d="M3 7.5l9 4 9-4" />
      <line x1="12" y1="11.5" x2="12" y2="20.5" />
    </>
  ),
  // משימות – לוח עם וי
  tasks: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4.5V3.5h6v1" />
      <path d="M8.5 12.5l2 2 4-4" />
    </>
  ),
  // דוחות – תרשים עמודות
  reports: (
    <>
      <line x1="4" y1="20" x2="20" y2="20" />
      <rect x="6" y="11" width="3" height="7" />
      <rect x="11" y="7" width="3" height="11" />
      <rect x="16" y="13" width="3" height="5" />
    </>
  ),
  // נעילה
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  // שמירה
  save: (
    <>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <path d="M7 3.5v5h8v-5" />
      <rect x="8" y="13" width="8" height="6" />
    </>
  ),
  // עריכה
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </>
  ),
  // בית
  home: (
    <>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
    </>
  ),
  // שעון / משמרת
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  // חולה בבידוד – מגן עם וי
  shield: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  // צ'ק מהיר – מונה בין מטופלים
  flash: (
    <>
      <path d="M13 3L5 13h6l-1 8 8-10h-6z" />
    </>
  ),
}

export default function Icon({ name = 'department', size = 24, stroke = 1.7, style }) {
  const d = paths[name] || paths.department
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {d}
    </svg>
  )
}
