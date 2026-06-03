import { useState, useRef, useEffect } from 'react'

// בורר תאריך מותאם (Glassmorphism) – ללא ספריות חיצוניות.
// value/onChange בפורמט 'YYYY-MM-DD'. כולל בוררי חודש/שנה, הדגשת היום והנבחר.

const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
const DOW = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'] // ראשון → שבת

const pad = (n) => String(n).padStart(2, '0')
const toISO = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
function parseISO(s) {
  if (!s || typeof s !== 'string') return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return { y, m: m - 1, d }
}

function CalIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="16" rx="3" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
    </svg>
  )
}

export default function DatePicker({ value, onChange, placeholder = 'בחר/י תאריך' }) {
  const [open, setOpen] = useState(false)
  const sel = parseISO(value)
  const today = new Date()
  const [viewY, setViewY] = useState(sel ? sel.y : today.getFullYear())
  const [viewM, setViewM] = useState(sel ? sel.m : today.getMonth())
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  function toggle() {
    if (!open && sel) { setViewY(sel.y); setViewM(sel.m) }
    setOpen((o) => !o)
  }

  const firstDay = new Date(viewY, viewM, 1).getDay()
  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const years = []
  for (let y = today.getFullYear() - 6; y <= today.getFullYear() + 3; y++) years.push(y)

  const label = sel ? `${pad(sel.d)}/${pad(sel.m + 1)}/${sel.y}` : placeholder
  const isToday = (d) => d === today.getDate() && viewM === today.getMonth() && viewY === today.getFullYear()
  const isSel = (d) => sel && d === sel.d && viewM === sel.m && viewY === sel.y

  return (
    <div className="dp" ref={ref}>
      <button type="button" className={'dp-input' + (value ? '' : ' empty')} onClick={toggle}>
        <span className="dp-cal-ic"><CalIcon /></span>
        <span className="dp-val">{label}</span>
      </button>

      {open && (
        <div className="dp-pop">
          <div className="dp-head">
            <select className="dp-sel" value={viewM} onChange={(e) => setViewM(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select className="dp-sel" value={viewY} onChange={(e) => setViewY(Number(e.target.value))}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="dp-grid dp-dow">
            {DOW.map((d, i) => <span key={i} className="dp-dow-c">{d}</span>)}
          </div>

          <div className="dp-grid">
            {cells.map((d, i) =>
              d === null ? (
                <span key={i} className="dp-empty" />
              ) : (
                <button
                  key={i}
                  type="button"
                  className={'dp-day' + (isToday(d) ? ' today' : '') + (isSel(d) ? ' sel' : '')}
                  onClick={() => { onChange(toISO(viewY, viewM, d)); setOpen(false) }}
                >
                  {d}
                </button>
              )
            )}
          </div>

          {value && (
            <button type="button" className="dp-clear" onClick={() => { onChange(''); setOpen(false) }}>ניקוי</button>
          )}
        </div>
      )}
    </div>
  )
}
