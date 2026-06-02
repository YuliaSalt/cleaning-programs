// סרגל ניווט תחתון קבוע – מובייל בלבד. אייקונים קומפקטיים: ראשי · דשבורד · חזרה.

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  )
}
function IconDash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a9 9 0 1 0-9 9" />
      <path d="M12 12l5-3" />
      <path d="M12 7v5" />
    </svg>
  )
}
function IconBack() {
  // חץ "חזרה" ב-RTL מצביע ימינה
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  )
}

export default function BottomNav({ onHome, onDashboard, onBack, homeActive, dashActive, canBack }) {
  return (
    <nav className="bottom-nav" aria-label="ניווט תחתון">
      <button
        className={'bn-item' + (homeActive ? ' active' : '')}
        onClick={onHome}
        aria-label="מסך ראשי"
      >
        <IconHome />
        <span>ראשי</span>
      </button>
      <button
        className={'bn-item' + (dashActive ? ' active' : '')}
        onClick={onDashboard}
        aria-label="דשבורד ביצועים"
      >
        <IconDash />
        <span>דשבורד</span>
      </button>
      <button
        className="bn-item"
        onClick={onBack}
        disabled={!canBack}
        aria-label="חזרה"
      >
        <IconBack />
        <span>חזרה</span>
      </button>
    </nav>
  )
}
