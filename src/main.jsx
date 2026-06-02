import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { purgeAllReportsOnce } from './data/maintenance.js'

// ניקוי חד-פעמי של דוחות מקומיים – לפני כל קריאה מהאחסון/סנכרון.
purgeAllReportsOnce()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
