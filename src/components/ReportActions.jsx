import { useState } from 'react'
import { savePdf, emailPdf, pdfFilename } from '../data/reportPdf.js'

// סרגל פעולות לתצוגת דוח שמורה: הדפסה · שמירת PDF · שליחת PDF למייל.
// targetRef – ref לאלמנט .report-print שייוצא ל-PDF. name – בסיס שם הקובץ/נושא.
export default function ReportActions({ targetRef, name }) {
  const [busy, setBusy] = useState('') // '' | 'save' | 'email'
  const filename = pdfFilename(name)

  async function onSave() {
    if (busy) return
    setBusy('save')
    try {
      await savePdf(targetRef.current, filename)
    } catch {
      alert('שמירת ה-PDF נכשלה. נסה/י שוב.')
    } finally {
      setBusy('')
    }
  }

  async function onEmail() {
    if (busy) return
    setBusy('email')
    try {
      await emailPdf(targetRef.current, filename, name)
    } catch {
      alert('שליחת ה-PDF נכשלה. נסה/י שוב.')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="rd-actions">
      <button className="btn rd-print" onClick={() => window.print()} disabled={!!busy}>
        הדפסה
      </button>
      <button className="btn ghost" onClick={onSave} disabled={!!busy}>
        {busy === 'save' ? 'מכין PDF…' : 'שמור PDF'}
      </button>
      <button className="btn ghost" onClick={onEmail} disabled={!!busy}>
        {busy === 'email' ? 'מכין PDF…' : 'שלח למייל PDF'}
      </button>
    </div>
  )
}
