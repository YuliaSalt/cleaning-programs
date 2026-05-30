import ScreenHeader from './ScreenHeader.jsx'

export default function Handover({ unit, onBack, onGoHome, onBackToCategory, categoryName }) {
  const trail = [{ label: 'ראשי', onClick: onGoHome }]
  if (categoryName) trail.push({ label: categoryName, onClick: onBackToCategory })
  trail.push({ label: unit.name, onClick: onBack })
  trail.push({ label: 'העברת משמרת' })

  return (
    <div>
      <ScreenHeader title="העברת משמרת" onBack={onBack} trail={trail} />
      <div className="glass plan-card" style={{ padding: 40, textAlign: 'center' }}>
        <p className="empty-hint" style={{ fontSize: 16 }}>התוכן יתווסף בהמשך.</p>
      </div>
    </div>
  )
}
