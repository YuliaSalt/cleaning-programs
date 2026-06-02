// אימות מקומי (ללא שרת): משתמשים וסשן נשמרים ב-localStorage.
// הערה: זו אינה אבטחה אמיתית – הכול בצד הלקוח. נועד לשער כניסה בסיסי בלבד.

import { storage } from './storage.js'

const USERS_KEY = 'hmc:users'
const SESSION_KEY = 'hmc:session'

// hash פשוט (djb2) – רק כדי לא לשמור סיסמה כטקסט גלוי. אינו מאובטח קריפטוגרפית.
function hashPw(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0
  return String(h >>> 0)
}

function getUsers() {
  return storage.getJSON(USERS_KEY) || {}
}
function saveUsers(u) {
  storage.setJSON(USERS_KEY, u)
}

export function register(name, password) {
  const n = (name || '').trim()
  if (!n) return { ok: false, error: 'יש להזין שם משתמש' }
  if ((password || '').length < 4) return { ok: false, error: 'הסיסמה חייבת להכיל לפחות 4 תווים' }
  const users = getUsers()
  if (users[n]) return { ok: false, error: 'שם המשתמש כבר קיים – נסה/י להתחבר' }
  users[n] = hashPw(password)
  saveUsers(users)
  storage.setItem(SESSION_KEY, n)
  return { ok: true, name: n }
}

export function login(name, password) {
  const n = (name || '').trim()
  const users = getUsers()
  if (!users[n]) return { ok: false, error: 'שם משתמש לא קיים' }
  if (users[n] !== hashPw(password)) return { ok: false, error: 'סיסמה שגויה' }
  storage.setItem(SESSION_KEY, n)
  return { ok: true, name: n }
}

export function getSession() {
  return storage.getItem(SESSION_KEY) || null
}

export function logout() {
  storage.removeItem(SESSION_KEY)
}
