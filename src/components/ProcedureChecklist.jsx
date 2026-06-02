import { useState } from 'react'
import {
  SIGN_NOTE,
  emptyChecks,
  saveProcedureReport,
  listProcedureReports,
  deleteProcedureReport,
} from '../data/procedureChecklists.js'
import { getDeviceNurse, rememberDeviceNurse } from '../data/handover.js'

// פריט יכול להיות מחרוזת פשוטה, או אובייקט { name, sku }.
// השם בלבד מוצג במסך; המק"ט נשלח רק בהודעת החוסרים בוואטסאפ, מרוחק מהשם וללא סוגריים.
const itemName = (it) => (typeof it === 'string' ? it : it.name)
const itemWa = (it) => (typeof it === 'string' ? it : `${it.name}    מק"ט: ${it.sku}`)

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.4.7 4.6 1.9 6.5L4 29l7-1.8c1.8 1 3.8 1.5 6 1.5 6.6 0 12-5.3 12-11.9C29 8.3 22.6 3 16 3zm0 21.7c-1.9 0-3.7-.5-5.2-1.4l-.4-.2-4.1 1.1 1.1-4-.3-.4c-1-1.6-1.5-3.5-1.5-5.5C5.6 9.2 10.2 4.7 16 4.7s10.4 4.5 10.4 10.2S21.8 24.7 16 24.7z" />
      <path d="M22 18.3c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4z" />
    </svg>
  )
}

export default function ProcedureChecklist({ procId, title, waTitle, blocks }) {
  // מילוי חדש בכל פתיחה: ה-state מאותחל ריק בכל עליית הרכיב.
  const [checks, setChecks] = useState(() => emptyChecks(blocks))
  const [nurse, setNurse] = useState(() => getDeviceNurse())
  const [signed, setSigned] = useState(false) // חתימה = שמירת דוח; חובה לפני שליחה
  const [signErr, setSignErr] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [reports, setReports] = useState(() => listProcedureReports(procId))
  const [openKey, setOpenKey] = useState(null)

  // לחיצה מחליפה X (חסר) <-> V (קיים)
  const toggle = (blk, i) => setChecks((c) => ({ ...c, [blk]: { ...c[blk], [i]: !c[blk][i] } }))

  function onNurseChange(v) {
    setNurse(v)
    setSigned(false) // שינוי השם מבטל חתימה קיימת
  }

  // איסוף הפריטים שעדיין מסומנים X (חסרים), מקובצים לפי סעיף.
  function missingByBlock() {
    return blocks
      .map((blk) => ({
        title: blk.title,
        items: blk.items.filter((_, i) => !checks[blk.id][i]),
      }))
      .filter((g) => g.items.length > 0)
  }

  const missing = missingByBlock()
  const missingCount = missing.reduce((n, g) => n + g.items.length, 0)
  const allReady = missingCount === 0
  const canSend = signed && !allReady

  // חתימה = שמירת שם האחות + שמירת דוח חתום בעמוד
  function sign() {
    if (!nurse.trim()) {
      setSignErr(true)
      return
    }
    rememberDeviceNurse(nurse)
    // בדוח השמור נשמרים שמות הפריטים בלבד (ללא מק"ט), בהתאם לתצוגה במסך.
    const missingForReport = missing.map((g) => ({
      title: g.title,
      items: g.items.map(itemName),
    }))
    saveProcedureReport({
      procId,
      procName: title,
      nurse: nurse.trim(),
      checks,
      missing: missingForReport,
      missingCount,
      allReady,
    })
    setReports(listProcedureReports(procId))
    setSignErr(false)
    setSigned(true)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2600)
  }

  // מילוי חדש – ניקוי הרשימה לקראת בדיקה הבאה (הדוחות השמורים נשמרים)
  function newFill() {
    setChecks(emptyChecks(blocks))
    setSigned(false)
    setSignErr(false)
  }

  function removeReport(key) {
    deleteProcedureReport(key)
    setReports(listProcedureReports(procId))
    if (openKey === key) setOpenKey(null)
  }

  function sendWhatsApp() {
    // חובה לחתום (לשמור דוח) לפני שליחה
    if (!signed) {
      setSignErr(true)
      return
    }
    const now = new Date()
    const dateHe = now.toLocaleDateString('he-IL')
    const timeHe = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })

    // ללא אימוג'ים/סימנים בתחילת שורה (חלקם נשלחים כסימני שאלה במכשירים מסוימים)
    const lines = [waTitle, `תאריך ${dateHe} שעה ${timeHe}`]
    if (nurse.trim()) lines.push(`אחות: ${nurse.trim()}`)
    lines.push('')
    for (const g of missing) {
      lines.push(g.title + ':')
      for (const it of g.items) lines.push(itemWa(it))
      lines.push('')
    }
    lines.push('הרצליה מדיקל סנטר')

    const url = 'https://wa.me/?text=' + encodeURIComponent(lines.join('\n').trim())
    window.open(url, '_blank', 'noopener')
  }

  return (
    <div className="glass plan-card ho-form">
      <div className="ho-title">{title}</div>

      {blocks.map((blk) => (
        <div className="ho-block" key={blk.id}>
          <div className="ho-block-title">{blk.title}</div>
          {blk.note && <div className="cysto-note">{blk.note}</div>}
          {blk.items.map((item, i) => {
            const on = !!checks[blk.id][i]
            return (
              <button
                key={i}
                className={'cysto-check' + (on ? ' on' : '')}
                onClick={() => toggle(blk.id, i)}
              >
                <span className="cysto-mark">{on ? '✓' : '✕'}</span>
                <span className="cysto-label">{itemName(item)}</span>
              </button>
            )
          })}
        </div>
      ))}

      {/* שם האחות – נשמר מקומית ומופיע אוטומטית בכניסה הבאה */}
      <div className="ho-block">
        <div className="cysto-sign-note">{SIGN_NOTE}</div>
        <div className="field">
          <label>שם האחות <span className="req">*</span></label>
          <input
            className={'input' + (signErr && !nurse.trim() ? ' invalid' : '')}
            type="text"
            placeholder="שם מלא"
            value={nurse}
            onChange={(e) => onNurseChange(e.target.value)}
          />
          <span className="ho-auto-hint">נשמר במכשיר ויופיע מראש בפעם הבאה</span>
          <button
            className={'cysto-sign-btn' + (signed ? ' signed' : '')}
            onClick={sign}
            disabled={signed}
          >
            {signed ? '✓ נחתם ונשמר' : 'חתימה ושמירת דוח'}
          </button>
          {signErr && !signed && (
            <div className="err">חובה לחתום (למלא ולשמור את שם האחות) לפני שליחה.</div>
          )}
          {savedFlash && <div className="save-flash" style={{ marginTop: 10 }}>הדוח נשמר בעמוד ✓</div>}
        </div>
      </div>

      <div className="ho-actions">
        <button className="wa-btn" onClick={sendWhatsApp} disabled={!canSend}>
          <WhatsAppIcon />{' '}
          {allReady
            ? 'אין חוסרים לשליחה'
            : !signed
            ? 'יש לחתום לפני שליחה'
            : `שלח חסרים לקבוצה (${missingCount})`}
        </button>
        <button className="reset-btn" onClick={newFill}>מילוי חדש</button>
      </div>

      {/* דוחות שמורים – באותו עמוד */}
      {reports.length > 0 && (
        <div className="ho-block">
          <div className="ho-block-title">דוחות שמורים ({reports.length})</div>
          {reports.map((r) => {
            const rec = r.record
            const open = openKey === r.key
            return (
              <div className="proc-report" key={r.key}>
                <button
                  className="proc-report-head"
                  onClick={() => setOpenKey(open ? null : r.key)}
                >
                  <span className="proc-report-date">{r.dateLabel} · {r.timeLabel}</span>
                  <span className="proc-report-nurse">{rec.nurse || '—'}</span>
                  <span className={'proc-report-status' + (rec.allReady ? ' ok' : ' miss')}>
                    {rec.allReady ? 'הכל תקין' : `חסרים: ${rec.missingCount}`}
                  </span>
                </button>
                {open && (
                  <div className="proc-report-body">
                    {rec.allReady ? (
                      <p className="proc-report-allok">כל הציוד נבדק, תקין וזמין.</p>
                    ) : (
                      (rec.missing || []).map((g, gi) => (
                        <div key={gi} className="proc-report-group">
                          <div className="proc-report-group-title">{g.title}</div>
                          {g.items.map((it, ii) => (
                            <div key={ii} className="proc-report-item">{it}</div>
                          ))}
                        </div>
                      ))
                    )}
                    <button className="proc-report-del" onClick={() => removeReport(r.key)}>
                      מחיקת דוח
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="ho-footer">הרצליה מדיקל סנטר</div>
    </div>
  )
}
