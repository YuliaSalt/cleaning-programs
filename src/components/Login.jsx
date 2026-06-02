import { useState } from 'react'
import { login, register } from '../data/auth.js'

// מסך כניסה/הרשמה – כרטיס זכוכית מרחף מעל רקע ה-Mesh.
export default function Login({ onAuthed }) {
  const [mode, setMode] = useState('login') // login | register
  const [name, setName] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [err, setErr] = useState('')

  const isRegister = mode === 'register'

  function submit(e) {
    e.preventDefault()
    setErr('')
    if (isRegister && pw !== pw2) {
      setErr('הסיסמאות אינן תואמות')
      return
    }
    const res = isRegister ? register(name, pw) : login(name, pw)
    if (res.ok) onAuthed(res.name)
    else setErr(res.error)
  }

  function switchMode(m) {
    setMode(m)
    setErr('')
    setPw('')
    setPw2('')
  }

  return (
    <div className="auth-screen">
      <form className="glass auth-card" onSubmit={submit}>
        <img className="auth-logo" src={import.meta.env.BASE_URL + 'logo.png'} alt="הרצליה מדיקל סנטר" />
        <h1 className="auth-brand">Yplane</h1>
        <p className="auth-sub">הרצליה מדיקל סנטר · כוחות עזר</p>

        {/* בקרת מקטעים: כניסה / הרשמה */}
        <div className="auth-tabs">
          <button
            type="button"
            className={'auth-tab' + (!isRegister ? ' active' : '')}
            onClick={() => switchMode('login')}
          >
            כניסה
          </button>
          <button
            type="button"
            className={'auth-tab' + (isRegister ? ' active' : '')}
            onClick={() => switchMode('register')}
          >
            הרשמה
          </button>
        </div>

        <div className="field">
          <label>שם משתמש</label>
          <input
            className="input"
            type="text"
            autoComplete="username"
            value={name}
            onChange={(e) => { setName(e.target.value); setErr('') }}
            placeholder="שם מלא"
          />
        </div>

        <div className="field">
          <label>סיסמה</label>
          <input
            className="input"
            type="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            value={pw}
            onChange={(e) => { setPw(e.target.value); setErr('') }}
            placeholder="••••"
          />
        </div>

        {isRegister && (
          <div className="field">
            <label>אימות סיסמה</label>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              value={pw2}
              onChange={(e) => { setPw2(e.target.value); setErr('') }}
              placeholder="••••"
            />
          </div>
        )}

        {err && <div className="err">{err}</div>}

        <button type="submit" className="btn auth-submit">
          {isRegister ? 'הרשמה וכניסה' : 'כניסה'}
        </button>

        <p className="auth-switch">
          {isRegister ? 'כבר יש לך חשבון?' : 'אין לך חשבון עדיין?'}{' '}
          <button type="button" className="link-btn auth-switch-btn" onClick={() => switchMode(isRegister ? 'login' : 'register')}>
            {isRegister ? 'כניסה' : 'הרשמה'}
          </button>
        </p>
      </form>
    </div>
  )
}
