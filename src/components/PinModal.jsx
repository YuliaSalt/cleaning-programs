import { useState } from 'react'
import { verifyDeletePin } from '../data/security.js'

// מודאל אבטחה למחיקה: דורש קוד PIN. הקוד מאומת מול security.js (לא מוטמע כאן).
// onConfirm נקרא רק אם הקוד תקין; onCancel סוגר ללא פעולה.
export default function PinModal({ title = 'אישור מחיקה', message, onConfirm, onCancel }) {
  const [pin, setPin] = useState('')
  const [err, setErr] = useState(false)

  function submit(e) {
    e.preventDefault()
    if (verifyDeletePin(pin)) {
      onConfirm()
    } else {
      setErr(true)
      setPin('')
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <form className="glass modal-card" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-msg">{message || 'הזן/י קוד אבטחה כדי למחוק את הדוח.'}</p>
        <div className="field">
          <label>קוד אבטחה</label>
          <input
            className={'input' + (err ? ' invalid' : '')}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            value={pin}
            onChange={(e) => { setPin(e.target.value); setErr(false) }}
            placeholder="••••"
          />
          {err && <div className="err">קוד שגוי. נסה/י שוב.</div>}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>ביטול</button>
          <button type="submit" className="btn danger">מחיקה</button>
        </div>
      </form>
    </div>
  )
}
