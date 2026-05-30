import { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Home from './components/Home.jsx'
import UnitBoard from './components/UnitBoard.jsx'
import CleaningPlan from './components/CleaningPlan.jsx'
import { findUnit } from './data/departments.js'

export default function App() {
  // ניווט פשוט מבוסס מצב: view = home | unit | window
  const [unitId, setUnitId] = useState(null)
  const [windowId, setWindowId] = useState(null)

  const unit = unitId ? findUnit(unitId) : null

  function selectUnit(id) {
    setUnitId(id)
    setWindowId(null)
  }

  function goHome() {
    setUnitId(null)
    setWindowId(null)
  }

  function openWindow(id) {
    setWindowId(id)
  }

  function backToBoard() {
    setWindowId(null)
  }

  return (
    <div className="app-shell">
      <Sidebar
        activeUnitId={unitId}
        onSelectUnit={selectUnit}
        onGoHome={goHome}
      />
      <main className="main-area">
        {!unit && <Home onSelectUnit={selectUnit} />}

        {unit && !windowId && (
          <UnitBoard
            unit={unit}
            onOpenWindow={openWindow}
            onGoHome={goHome}
          />
        )}

        {unit && windowId === 'cleaning' && (
          <CleaningPlan unit={unit} onBack={backToBoard} />
        )}
      </main>
    </div>
  )
}
