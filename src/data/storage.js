// שכבת אחסון מופשטת (StorageAdapter).
// כיום: LocalDevAdapter מעל localStorage – הנתונים נשמרים בדפדפן ושורדים רענון.
// בעתיד: ניתן להחליף ב-CloudAdapter (REST/Firestore וכו') ללא שינוי בשאר האפליקציה.

// ממשק מוגדר (לתיעוד): getItem, setItem, removeItem, getJSON, setJSON, keys.
export class LocalDevAdapter {
  constructor(prefix = 'hmc:') {
    this.prefix = prefix
    this.available = (() => {
      try {
        const k = '__hmc_probe__'
        localStorage.setItem(k, '1')
        localStorage.removeItem(k)
        return true
      } catch {
        return false
      }
    })()
    // גיבוי בזיכרון אם localStorage חסום (מצב פרטי וכו')
    this._mem = new Map()
  }

  getItem(key) {
    if (!this.available) return this._mem.has(key) ? this._mem.get(key) : null
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  }

  setItem(key, value) {
    if (!this.available) {
      this._mem.set(key, value)
      return
    }
    try {
      localStorage.setItem(key, value)
    } catch {
      this._mem.set(key, value)
    }
  }

  removeItem(key) {
    if (!this.available) {
      this._mem.delete(key)
      return
    }
    try {
      localStorage.removeItem(key)
    } catch {
      this._mem.delete(key)
    }
  }

  has(key) {
    return this.getItem(key) !== null
  }

  getJSON(key) {
    const raw = this.getItem(key)
    if (raw == null) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  setJSON(key, obj) {
    this.setItem(key, JSON.stringify(obj))
  }

  keys() {
    if (!this.available) return Array.from(this._mem.keys())
    try {
      return Object.keys(localStorage)
    } catch {
      return []
    }
  }
}

// מופע ברירת המחדל לשימוש בכל האפליקציה.
export const storage = new LocalDevAdapter()
